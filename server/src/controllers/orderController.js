const prisma = require("../config/prisma");

// ========================================
// CREATE CUSTOMER ORDER
// Creates an order from customer cart items
// ========================================

const createOrder = async (req, res) => {
  try {
    const customerId = req.user.id;

    const { items } = req.body;

    // ========================================
    // BASIC VALIDATION
    // ========================================

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Order must contain at least one item",
      });
    }

    // ========================================
    // VALIDATE QUANTITIES
    // ========================================

    for (const item of items) {
      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each item must have a valid quantity",
        });
      }
    }

    const menuItemIds = items.map(
      (item) => Number(item.menuItemId)
    );

    // ========================================
    // FETCH REAL MENU DATA
    // ========================================

    const menuItems =
      await prisma.menuItem.findMany({
        where: {
          id: {
            in: menuItemIds,
          },
        },
      });

    if (
      menuItems.length !==
      new Set(menuItemIds).size
    ) {
      return res.status(400).json({
        success: false,
        message:
          "One or more menu items are invalid",
      });
    }

    // ========================================
    // CHECK MENU AVAILABILITY
    // ========================================

    const unavailableItem =
      menuItems.find(
        (item) => !item.isAvailable
      );

    if (unavailableItem) {
      return res.status(400).json({
        success: false,
        message:
          `${unavailableItem.name} is currently unavailable`,
      });
    }

    // ========================================
    // BUILD ORDER ITEMS + TOTAL
    //
    // Price always comes from database.
    // ========================================

    let total = 0;

    const orderItemsData =
      items.map((cartItem) => {
        const menuItem =
          menuItems.find(
            (item) =>
              item.id ===
              Number(
                cartItem.menuItemId
              )
          );

        const unitPrice =
          Number(menuItem.price);

        total +=
          unitPrice *
          cartItem.quantity;

        return {
          menuItemId:
            menuItem.id,

          quantity:
            cartItem.quantity,

          unitPrice:
            menuItem.price,
        };
      });

    // ========================================
    // CREATE ORDER
    // ========================================

    const order =
      await prisma.order.create({
        data: {
          customerId,
          total,

          items: {
            create:
              orderItemsData,
          },
        },

        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });

    return res.status(201).json({
      success: true,
      message:
        "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

// ========================================
// GET KITCHEN ORDERS
// ========================================

const getKitchenOrders = async (
  req,
  res
) => {
  try {
    const orders =
      await prisma.order.findMany({
        where: {
          status: {
            in: [
              "PENDING",
              "ACCEPTED",
              "PREPARING",
              "READY",
            ],
          },
        },

        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },

          items: {
            include: {
              menuItem: {
                select: {
                  id: true,
                  name: true,
                  prepTime: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(
      "Get kitchen orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

// ========================================
// CONSUME ORDER INGREDIENTS
//
// Called ONLY during:
// ACCEPTED -> PREPARING
//
// Important:
// - Loads complete recipes
// - Aggregates same inventory ingredient
//   across multiple dishes
// - Validates ALL stock first
// - Deducts everything atomically
// - Creates CONSUMPTION audit records
// ========================================

const consumeOrderIngredients = async (
  tx,
  orderId,
  performedById
) => {
  // ========================================
  // LOAD ORDER + COMPLETE RECIPES
  // ========================================

  const order =
    await tx.order.findUnique({
      where: {
        id: orderId,
      },

      include: {
        items: {
          include: {
            menuItem: {
              include: {
                recipeIngredients: {
                  include: {
                    inventoryItem:
                      true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!order) {
    throw new Error(
      "ORDER_NOT_FOUND"
    );
  }

  // ========================================
  // REQUIRE RECIPES
  //
  // Every ordered dish must have at least
  // one configured recipe ingredient.
  // ========================================

  const missingRecipeItem =
    order.items.find(
      (orderItem) =>
        orderItem.menuItem
          .recipeIngredients
          .length === 0
    );

  if (missingRecipeItem) {
    throw new Error(
      `MISSING_RECIPE:${missingRecipeItem.menuItem.name}`
    );
  }

  // ========================================
  // AGGREGATE REQUIRED INGREDIENTS
  //
  // Example:
  //
  // 2 × Pizza:
  // Mozzarella = 0.150 × 2 = 0.300
  //
  // Another dish may also use Mozzarella.
  // We combine requirements before checking.
  // ========================================

  const requirements = new Map();

  for (const orderItem of order.items) {
    for (
      const recipeIngredient of
      orderItem.menuItem
        .recipeIngredients
    ) {
      const inventoryItem =
        recipeIngredient.inventoryItem;

      const requiredQuantity =
        Number(
          recipeIngredient.quantity
        ) * orderItem.quantity;

      const existing =
        requirements.get(
          inventoryItem.id
        );

      if (existing) {
        existing.requiredQuantity +=
          requiredQuantity;
      } else {
        requirements.set(
          inventoryItem.id,
          {
            inventoryItemId:
              inventoryItem.id,

            name:
              inventoryItem.name,

            unit:
              inventoryItem.unit,

            currentStock:
              Number(
                inventoryItem.currentStock
              ),

            requiredQuantity,
          }
        );
      }
    }
  }

  // ========================================
  // VALIDATE ALL STOCK FIRST
  //
  // Nothing is deducted until every
  // ingredient has enough stock.
  // ========================================

  for (
    const requirement of
    requirements.values()
  ) {
    if (
      requirement.currentStock <
      requirement.requiredQuantity
    ) {
      throw new Error(
        `INSUFFICIENT_STOCK:${requirement.name}:${requirement.requiredQuantity}:${requirement.currentStock}:${requirement.unit}`
      );
    }
  }

  // ========================================
  // DEDUCT INVENTORY + AUDIT
  // ========================================

  for (
    const requirement of
    requirements.values()
  ) {
    const quantity = Number(
      requirement.requiredQuantity.toFixed(
        3
      )
    );

    // Reduce stock
    await tx.inventoryItem.update({
      where: {
        id:
          requirement.inventoryItemId,
      },

      data: {
        currentStock: {
          decrement: quantity,
        },
      },
    });

    // Record consumption
    await tx.inventoryTransaction.create({
      data: {
        type: "CONSUMPTION",

        quantity,

        note:
          `Consumed for order #${orderId}`,

        inventoryItemId:
          requirement.inventoryItemId,

        performedById,
      },
    });
  }
};

// ========================================
// UPDATE ORDER STATUS
//
// Kitchen workflow:
//
// PENDING -> ACCEPTED / CANCELLED
//
// ACCEPTED -> PREPARING / CANCELLED
// ACCEPTED -> PREPARING also consumes recipe
//
// PREPARING -> READY
//
// READY -> SERVED
// ========================================

const updateOrderStatus = async (
  req,
  res
) => {
  try {
    const orderId =
      Number(req.params.id);

    const { status } =
      req.body;

    // ========================================
    // VALIDATE ORDER ID
    // ========================================

    if (!Number.isInteger(orderId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order ID",
      });
    }

    // ========================================
    // ALLOWED TRANSITIONS
    // ========================================

    const allowedTransitions = {
      PENDING: [
        "ACCEPTED",
        "CANCELLED",
      ],

      ACCEPTED: [
        "PREPARING",
        "CANCELLED",
      ],

      PREPARING: [
        "READY",
      ],

      READY: [
        "SERVED",
      ],

      SERVED: [],

      CANCELLED: [],
    };

    // ========================================
    // FIND CURRENT ORDER
    // ========================================

    const order =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found",
      });
    }

    // ========================================
    // VALIDATE TRANSITION
    //
    // This also prevents double consumption.
    //
    // Once PREPARING:
    // PREPARING -> PREPARING is invalid.
    // ========================================

    if (
      !status ||
      !allowedTransitions[
        order.status
      ]?.includes(status)
    ) {
      return res.status(400).json({
        success: false,

        message:
          `Cannot change order from ${order.status} to ${status}`,
      });
    }

    let updatedOrder;

    // ========================================
    // ACCEPTED -> PREPARING
    //
    // Recipe consumption and status update
    // happen inside ONE transaction.
    //
    // If any ingredient fails:
    // - no stock deducted
    // - no audit record created
    // - order remains ACCEPTED
    // ========================================

    if (
      order.status === "ACCEPTED" &&
      status === "PREPARING"
    ) {
      updatedOrder =
        await prisma.$transaction(
          async (tx) => {
            // Consume ingredients first.
            // Any error rolls back everything.
            await consumeOrderIngredients(
              tx,
              orderId,
              req.user.id
            );

            // Move order to PREPARING
            return tx.order.update({
              where: {
                id: orderId,
              },

              data: {
                status:
                  "PREPARING",
              },

              include: {
                customer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },

                items: {
                  include: {
                    menuItem: true,
                  },
                },
              },
            });
          }
        );
    } else {
      // ========================================
      // NORMAL STATUS UPDATE
      //
      // No inventory consumption required.
      // ========================================

      updatedOrder =
        await prisma.order.update({
          where: {
            id: orderId,
          },

          data: {
            status,
          },

          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },

            items: {
              include: {
                menuItem: true,
              },
            },
          },
        });
    }

    return res.status(200).json({
      success: true,

      message:
        `Order status updated to ${status}`,

      order: updatedOrder,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    // ========================================
    // MISSING RECIPE
    // ========================================

    if (
      error.message?.startsWith(
        "MISSING_RECIPE:"
      )
    ) {
      const dishName =
        error.message.split(":")[1];

      return res.status(400).json({
        success: false,

        message:
          `Recipe is not configured for ${dishName}`,
      });
    }

    // ========================================
    // INSUFFICIENT STOCK
    // ========================================

    if (
      error.message?.startsWith(
        "INSUFFICIENT_STOCK:"
      )
    ) {
      const [
        ,
        ingredientName,
        required,
        available,
        unit,
      ] = error.message.split(":");

      return res.status(400).json({
        success: false,

        message:
          `Insufficient ${ingredientName} stock. ` +
          `Required: ${Number(
            required
          ).toFixed(3)} ${unit}, ` +
          `Available: ${Number(
            available
          ).toFixed(3)} ${unit}`,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

// ========================================
// GET WAITER ORDERS
// Returns READY orders
// ========================================

const getWaiterOrders = async (
  req,
  res
) => {
  try {
    const orders =
      await prisma.order.findMany({
        where: {
          status: "READY",
        },

        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },

          items: {
            include: {
              menuItem: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },

        orderBy: {
          updatedAt: "asc",
        },
      });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(
      "Get waiter orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

// ========================================
// GET CUSTOMER ORDERS
// ========================================

const getMyOrders = async (
  req,
  res
) => {
  try {
    const customerId =
      req.user.id;

    const orders =
      await prisma.order.findMany({
        where: {
          customerId,
        },

        include: {
          items: {
            include: {
              menuItem: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(
      "Get customer orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

module.exports = {
  createOrder,
  getKitchenOrders,
  updateOrderStatus,
  getWaiterOrders,
  getMyOrders,
};