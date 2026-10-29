const express = require("express");

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const {
  authorizeRoles,
} = require(
  "../middleware/roleMiddleware"
);

const {
  getDemandForecast,
} = require(
  "../controllers/forecastController"
);

const router = express.Router();

// ========================================
// DEMAND FORECAST
//
// Accessible to:
// - MANAGER
// - INVENTORY_STAFF
// ========================================

router.get(
  "/demand",
  protect,
  authorizeRoles(
    "MANAGER",
    "INVENTORY_STAFF"
  ),
  getDemandForecast
);

module.exports = router;