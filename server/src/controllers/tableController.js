const prisma = require("../config/prisma");

// ========================================
// CREATE RESTAURANT TABLE
// Manager creates a physical table
// ========================================

const createTable = async (req, res) => {
  try {
    const { number, capacity } = req.body;

    const tableNumber = String(number || "").trim().toUpperCase();
    const numericCapacity = Number(capacity);

    // Basic validation
    if (!tableNumber || !Number.isInteger(numericCapacity)) {
      return res.status(400).json({
        success: false,
        message: "Table number and valid capacity are required",
      });
    }

    if (numericCapacity < 1 || numericCapacity > 20) {
      return res.status(400).json({
        success: false,
        message: "Table capacity must be between 1 and 20",
      });
    }

    // Prevent duplicate table numbers
    const existingTable = await prisma.restaurantTable.findUnique({
      where: {
        number: tableNumber,
      },
    });

    if (existingTable) {
      return res.status(409).json({
        success: false,
        message: "Table number already exists",
      });
    }

    const table = await prisma.restaurantTable.create({
      data: {
        number: tableNumber,
        capacity: numericCapacity,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Restaurant table created successfully",
      table,
    });
  } catch (error) {
    console.error("Create table error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// GET ALL RESTAURANT TABLES
// Public/customer-facing table information
// ========================================

const getAllTables = async (req, res) => {
  try {
    const tables = await prisma.restaurantTable.findMany({
      orderBy: {
        number: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      count: tables.length,
      tables,
    });
  } catch (error) {
    console.error("Get tables error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// UPDATE PHYSICAL TABLE STATUS
// Manager/Waiter controls current table state
// ========================================

const updateTableStatus = async (req, res) => {
  try {
    const tableId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(tableId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid table ID",
      });
    }

    const allowedStatuses = [
      "AVAILABLE",
      "RESERVED",
      "OCCUPIED",
      "CLEANING",
      "DISABLED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid table status",
      });
    }

    const existingTable = await prisma.restaurantTable.findUnique({
      where: {
        id: tableId,
      },
    });

    if (!existingTable) {
      return res.status(404).json({
        success: false,
        message: "Restaurant table not found",
      });
    }

    const table = await prisma.restaurantTable.update({
      where: {
        id: tableId,
      },
      data: {
        status,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Table status updated to ${status}`,
      table,
    });
  } catch (error) {
    console.error("Update table status error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createTable,
  getAllTables,
  updateTableStatus,
};