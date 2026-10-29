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
  searchNutrition,
  getNutritionDetails,
} = require(
  "../controllers/nutritionController"
);

const router = express.Router();

// ========================================
// NUTRITION SEARCH
//
// Customer + Manager can access.
// ========================================

router.get(
  "/search",
  protect,
  authorizeRoles(
    "CUSTOMER",
    "MANAGER"
  ),
  searchNutrition
);

// ========================================
// NUTRITION DETAIL
// ========================================

router.get(
  "/:fdcId",
  protect,
  authorizeRoles(
    "CUSTOMER",
    "MANAGER"
  ),
  getNutritionDetails
);

module.exports = router;