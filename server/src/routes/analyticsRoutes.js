const express = require("express");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const {
  getWasteAnalytics,
  getConsumptionAnalytics,
  getOperationsAnalytics,
} = require(
  "../controllers/analyticsController"
);

const router = express.Router();

// ========================================
// WASTE ANALYTICS
//
// Allowed:
// - MANAGER
// - INVENTORY_STAFF
//
// Blocked:
// - CUSTOMER
// - CHEF
// - WAITER
// ========================================

router.get(
  "/waste",
  protect,
  authorizeRoles(
    "MANAGER",
    "INVENTORY_STAFF"
  ),
  getWasteAnalytics
);

// ========================================
// CONSUMPTION / DEMAND ANALYTICS
//
// Manager + Inventory Staff
// ========================================

router.get(
  "/consumption",
  protect,
  authorizeRoles(
    "MANAGER",
    "INVENTORY_STAFF"
  ),
  getConsumptionAnalytics
);

// ========================================
// MANAGER OPERATIONS ANALYTICS
//
// Manager-only consolidated dashboard.
// ========================================

router.get(
  "/operations",
  protect,
  authorizeRoles("MANAGER"),
  getOperationsAnalytics
);

module.exports = router;