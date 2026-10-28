const express = require("express");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const {
  getInventoryAlerts,
} = require(
  "../controllers/inventoryAlertController"
);

const router = express.Router();

// ========================================
// SMART INVENTORY ALERTS
//
// Accessible only to:
// - Manager
// - Inventory Staff
// ========================================

router.get(
  "/",
  protect,
  authorizeRoles(
    "MANAGER",
    "INVENTORY_STAFF"
  ),
  getInventoryAlerts
);

module.exports = router;