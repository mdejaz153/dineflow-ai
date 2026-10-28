const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  createInventoryItem,
  getAllInventory,
  addStock,
  recordWaste,
  adjustStock,
  updateMinimumStock,
  getInventoryHistory,
} = require("../controllers/inventoryController");

const router = express.Router();

// ========================================
// CREATE INVENTORY ITEM
// Manager only
// ========================================

router.post(
  "/",
  protect,
  authorizeRoles("MANAGER"),
  createInventoryItem
);

// ========================================
// GET INVENTORY
// Inventory Staff + Manager
// ========================================

router.get(
  "/",
  protect,
  authorizeRoles("INVENTORY_STAFF", "MANAGER"),
  getAllInventory
);

// ========================================
// ADD STOCK
// Inventory Staff + Manager
// ========================================

router.patch(
  "/:id/add-stock",
  protect,
  authorizeRoles("INVENTORY_STAFF", "MANAGER"),
  addStock
);

// ========================================
// RECORD WASTE
// Inventory Staff + Manager
// ========================================

router.patch(
  "/:id/waste",
  protect,
  authorizeRoles("INVENTORY_STAFF", "MANAGER"),
  recordWaste
);

// ========================================
// MANUAL STOCK ADJUSTMENT
// Inventory Staff + Manager
// ========================================

router.patch(
  "/:id/adjust",
  protect,
  authorizeRoles("INVENTORY_STAFF", "MANAGER"),
  adjustStock
);

// ========================================
// UPDATE MINIMUM STOCK THRESHOLD
// Manager only
// ========================================

router.patch(
  "/:id/minimum-stock",
  protect,
  authorizeRoles("MANAGER"),
  updateMinimumStock
);

// ========================================
// INVENTORY HISTORY
// Inventory Staff + Manager
// ========================================

router.get(
  "/:id/history",
  protect,
  authorizeRoles("INVENTORY_STAFF", "MANAGER"),
  getInventoryHistory
);

module.exports = router;