const prisma = require("../config/prisma");

// ========================================
// CREATE CUSTOMER ORDER
// Creates an order from customer cart items
// ========================================

const createOrder = async (req, res) => {
  try {
    // Logged-in customer protect middleware se milta hai
    const customerId = req.user.id;

    // Expected format:
    // items: [
    //   { menuItemId: 1, quantity: 2 },
    //   { menuItemId: 2, quantity: 1 }
    // ]
    const { items } = req.body;

    // ========================================
    // BASIC VALIDATION
    // ========================================

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
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
          message: "Each item must have a valid quantity",
        });
      }
    }

    // Get requested menu item IDs
    const menuItemIds = items.map(
      (item) => Number(item.menuItemId)
    );

    // ========================================
    // FETCH REAL MENU DATA FROM DATABASE
    // ========================================

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: menuItemIds,
        },
      },
    });

    // Make sure every requested dish exists
    if (menuItems.length !== new Set(menuItemIds).size) {
      return res.status(400).json({
        success: false,
        message: "One or more menu items are invalid",
      });
    }

    // ========================================
    // CHECK AVAILABILITY
    // ========================================

    const unavailableItem = menuItems.find(
      (item) => !item.isAvailable
    );

    if (unavailableItem) {
      return res.status(400).json({
        success: false,
        message: `${unavailableItem.name} is currently unavailable`,
      });
    }

    // ========================================
    // BUILD ORDER ITEMS + CALCULATE TOTAL
    // IMPORTANT:
    // Price comes from DATABASE, not frontend.
    // ========================================

    let total = 0;

    const orderItemsData = items.map((cartItem) => {
      const menuItem = menuItems.find(
        (item) =>
          item.id === Number(cartItem.menuItemId)
      );

      const unitPrice = Number(menuItem.price);

      total += unitPrice * cartItem.quantity;

      return {
        menuItemId: menuItem.id,
        quantity: cartItem.quantity,
        unitPrice: menuItem.price,
      };
    });

    // ========================================
    // CREATE ORDER + ORDER ITEMS
    // ========================================

    const order = await prisma.order.create({
      data: {
        customerId,
        total,

        items: {
          create: orderItemsData,
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

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// ========================================
// GET KITCHEN ORDERS
// Fetches active orders for Chef / Kitchen
// ========================================

const getKitchenOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      // Kitchen ko completed/cancelled orders nahi chahiye
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

      // Customer information
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },

        // Order ke andar dishes
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

      // Oldest order first
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
    console.error("Get kitchen orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// ========================================
// UPDATE ORDER STATUS
// Chef / Manager moves an order through
// the kitchen workflow
// ========================================

const updateOrderStatus = async (req, res) => {
  try {
    // Order ID comes from URL
    const orderId = Number(req.params.id);

    // New status comes from request body
    const { status } = req.body;

    // ========================================
    // VALIDATE ORDER ID
    // ========================================

    if (!Number.isInteger(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ========================================
    // ALLOWED KITCHEN STATUS TRANSITIONS
    // ========================================

    const allowedTransitions = {
      PENDING: ["ACCEPTED", "CANCELLED"],
      ACCEPTED: ["PREPARING", "CANCELLED"],
      PREPARING: ["READY"],
      READY: ["SERVED"],
      SERVED: [],
      CANCELLED: [],
    };

    // ========================================
    // FIND ORDER
    // ========================================

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ========================================
    // VALIDATE NEW STATUS
    // ========================================

    if (
      !status ||
      !allowedTransitions[order.status]?.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order from ${order.status} to ${status}`,
      });
    }

    // ========================================
    // UPDATE ORDER
    // ========================================

    const updatedOrder = await prisma.order.update({
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

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// ========================================
// GET WAITER ORDERS
// Returns orders that are ready to be served
// ========================================

const getWaiterOrders = async (req, res) => {
  try {
    // Waiter only needs orders that kitchen
    // has finished preparing.
    const orders = await prisma.order.findMany({
      where: {
        status: "READY",
      },

      include: {
        // Customer basic information
        customer: {
          select: {
            id: true,
            name: true,
          },
        },

        // Dishes inside the order
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

      // Oldest ready order should be served first
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
    console.error("Get waiter orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// ========================================
// GET CUSTOMER ORDERS
// Returns only the orders placed by
// the currently logged-in customer
// ========================================

const getMyOrders = async (req, res) => {
  try {
    // Logged-in customer's ID comes
    // from the JWT protect middleware
    const customerId = req.user.id;

    // Fetch only this customer's orders
    const orders = await prisma.order.findMany({
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

      // Latest order first
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
    console.error("Get customer orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
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