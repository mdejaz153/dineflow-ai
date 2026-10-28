const prisma = require("../config/prisma");

// ========================================
// HELPER - FORMAT INVENTORY ITEM
//
// Adds a calculated stockStatus field.
// We do NOT need another DB column for this.
// ========================================

const formatInventoryItem = (item) => {
  const currentStock = Number(item.currentStock);
  const minimumStock = Number(item.minimumStock);

  return {
    ...item,

    stockStatus:
      currentStock <= minimumStock
        ? "LOW_STOCK"
        : "OK",
  };
};

// ========================================
// CREATE INVENTORY ITEM
// Manager creates a new ingredient/material
// ========================================

const createInventoryItem = async (req, res) => {
  try {
    const {
      name,
      unit,
      currentStock = 0,
      minimumStock = 0,
    } = req.body;

    const cleanName = String(name || "").trim();
    const cleanUnit = String(unit || "").trim();

    const numericCurrentStock = Number(currentStock);
    const numericMinimumStock = Number(minimumStock);

    // ========================================
    // VALIDATION
    // ========================================

    if (!cleanName || !cleanUnit) {
      return res.status(400).json({
        success: false,
        message: "Ingredient name and unit are required",
      });
    }

    if (
      Number.isNaN(numericCurrentStock) ||
      numericCurrentStock < 0 ||
      Number.isNaN(numericMinimumStock) ||
      numericMinimumStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current stock and minimum stock must be valid non-negative numbers",
      });
    }

    // Prevent duplicate ingredient names
    const existingItem =
      await prisma.inventoryItem.findUnique({
        where: {
          name: cleanName,
        },
      });

    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: "Inventory item already exists",
      });
    }

    // ========================================
    // CREATE ITEM
    // ========================================

    const item = await prisma.inventoryItem.create({
      data: {
        name: cleanName,
        unit: cleanUnit,
        currentStock: numericCurrentStock,
        minimumStock: numericMinimumStock,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      item: formatInventoryItem(item),
    });
  } catch (error) {
    console.error("Create inventory item error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// GET ALL INVENTORY
// Inventory Staff + Manager
// ========================================

const getAllInventory = async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: {
        name: "asc",
      },
    });

    const formattedItems = items.map(
      formatInventoryItem
    );

    const lowStockCount = formattedItems.filter(
      (item) => item.stockStatus === "LOW_STOCK"
    ).length;

    return res.status(200).json({
      success: true,
      count: formattedItems.length,
      lowStockCount,
      items: formattedItems,
    });
  } catch (error) {
    console.error("Get inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// ADD STOCK
// Example:
// Mozzarella 2kg + 5kg = 7kg
// ========================================

const addStock = async (req, res) => {
  try {
    const itemId = Number(req.params.id);
    const quantity = Number(req.body.quantity);
    const note = req.body.note?.trim() || null;

    if (!Number.isInteger(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory item ID",
      });
    }

    if (
      Number.isNaN(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const existingItem =
      await prisma.inventoryItem.findUnique({
        where: {
          id: itemId,
        },
      });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    // Update stock + create audit history together
    const updatedItem = await prisma.$transaction(
      async (tx) => {
        const item = await tx.inventoryItem.update({
          where: {
            id: itemId,
          },

          data: {
            currentStock: {
              increment: quantity,
            },
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            type: "STOCK_IN",
            quantity,
            note,
            inventoryItemId: itemId,
            performedById: req.user.id,
          },
        });

        return item;
      }
    );

    return res.status(200).json({
      success: true,
      message: "Stock added successfully",
      item: formatInventoryItem(updatedItem),
    });
  } catch (error) {
    console.error("Add stock error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// RECORD WASTE
// Removes damaged/expired/wasted stock
// ========================================

const recordWaste = async (req, res) => {
  try {
    const itemId = Number(req.params.id);
    const quantity = Number(req.body.quantity);
    const note = req.body.note?.trim() || null;

    if (!Number.isInteger(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory item ID",
      });
    }

    if (
      Number.isNaN(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const existingItem =
      await prisma.inventoryItem.findUnique({
        where: {
          id: itemId,
        },
      });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    // Never allow stock below zero
    if (
      quantity >
      Number(existingItem.currentStock)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Waste quantity cannot exceed current stock",
      });
    }

    const updatedItem = await prisma.$transaction(
      async (tx) => {
        const item = await tx.inventoryItem.update({
          where: {
            id: itemId,
          },

          data: {
            currentStock: {
              decrement: quantity,
            },
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            type: "WASTE",
            quantity,
            note,
            inventoryItemId: itemId,
            performedById: req.user.id,
          },
        });

        return item;
      }
    );

    return res.status(200).json({
      success: true,
      message: "Waste recorded successfully",
      item: formatInventoryItem(updatedItem),
    });
  } catch (error) {
    console.error("Record waste error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// MANUAL STOCK ADJUSTMENT
//
// Manager/Inventory Staff enters the actual
// counted stock quantity.
//
// Example:
// System says 7kg
// Physical count says 6.5kg
// New current stock becomes 6.5kg
// ========================================

const adjustStock = async (req, res) => {
  try {
    const itemId = Number(req.params.id);
    const newStock = Number(req.body.newStock);
    const note = req.body.note?.trim() || null;

    if (!Number.isInteger(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory item ID",
      });
    }

    if (
      Number.isNaN(newStock) ||
      newStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "New stock must be a valid non-negative number",
      });
    }

    const existingItem =
      await prisma.inventoryItem.findUnique({
        where: {
          id: itemId,
        },
      });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    // Store magnitude of the adjustment in history
    const difference = Math.abs(
      newStock -
        Number(existingItem.currentStock)
    );

    const updatedItem = await prisma.$transaction(
      async (tx) => {
        const item = await tx.inventoryItem.update({
          where: {
            id: itemId,
          },

          data: {
            currentStock: newStock,
          },
        });

        // Only create transaction when stock changed
        if (difference > 0) {
          await tx.inventoryTransaction.create({
            data: {
              type: "ADJUSTMENT",
              quantity: difference,
              note:
                note ||
                `Stock adjusted from ${existingItem.currentStock} to ${newStock}`,
              inventoryItemId: itemId,
              performedById: req.user.id,
            },
          });
        }

        return item;
      }
    );

    return res.status(200).json({
      success: true,
      message: "Stock adjusted successfully",
      item: formatInventoryItem(updatedItem),
    });
  } catch (error) {
    console.error("Adjust stock error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// UPDATE MINIMUM STOCK
// Manager controls low-stock threshold
// ========================================

const updateMinimumStock = async (req, res) => {
  try {
    const itemId = Number(req.params.id);
    const minimumStock = Number(
      req.body.minimumStock
    );

    if (!Number.isInteger(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory item ID",
      });
    }

    if (
      Number.isNaN(minimumStock) ||
      minimumStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum stock must be a valid non-negative number",
      });
    }

    const existingItem =
      await prisma.inventoryItem.findUnique({
        where: {
          id: itemId,
        },
      });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    const updatedItem =
      await prisma.inventoryItem.update({
        where: {
          id: itemId,
        },

        data: {
          minimumStock,
        },
      });

    return res.status(200).json({
      success: true,
      message: "Minimum stock updated successfully",
      item: formatInventoryItem(updatedItem),
    });
  } catch (error) {
    console.error(
      "Update minimum stock error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// GET INVENTORY TRANSACTION HISTORY
// Shows stock movement audit trail
// ========================================

const getInventoryHistory = async (req, res) => {
  try {
    const itemId = Number(req.params.id);

    if (!Number.isInteger(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory item ID",
      });
    }

    const item =
      await prisma.inventoryItem.findUnique({
        where: {
          id: itemId,
        },
      });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    const transactions =
      await prisma.inventoryTransaction.findMany({
        where: {
          inventoryItemId: itemId,
        },

        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      item: {
        id: item.id,
        name: item.name,
        unit: item.unit,
      },
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error(
      "Get inventory history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createInventoryItem,
  getAllInventory,
  addStock,
  recordWaste,
  adjustStock,
  updateMinimumStock,
  getInventoryHistory,
};