const express = require("express");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const {
  getRecipe,
  upsertRecipeIngredient,
  removeRecipeIngredient,
} = require(
  "../controllers/recipeController"
);

const router = express.Router();

// ========================================
// MANAGER - VIEW DISH RECIPE
// ========================================

router.get(
  "/:menuItemId",
  protect,
  authorizeRoles("MANAGER"),
  getRecipe
);

// ========================================
// MANAGER - ADD / UPDATE INGREDIENT
// ========================================

router.put(
  "/:menuItemId/ingredients",
  protect,
  authorizeRoles("MANAGER"),
  upsertRecipeIngredient
);

// ========================================
// MANAGER - REMOVE INGREDIENT
// ========================================

router.delete(
  "/ingredients/:id",
  protect,
  authorizeRoles("MANAGER"),
  removeRecipeIngredient
);

module.exports = router;