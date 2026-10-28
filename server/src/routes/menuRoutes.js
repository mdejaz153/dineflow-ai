const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  createCategory,
  getAllCategories,
  createMenuItem,
  getAllMenuItems,
  toggleMenuItemAvailability,
} = require("../controllers/menuController");

const router = express.Router();

// Create Menu Category - Manager Only
router.post(
  "/categories",
  protect,
  authorizeRoles("MANAGER"),
  createCategory
);

// Get All Menu Categories - Public
router.get(
  "/categories",
  getAllCategories
);

// Create Menu Item - Manager Only
router.post(
  "/items",
  protect,
  authorizeRoles("MANAGER"),
  createMenuItem
);

// Get All Menu Items - Public
router.get(
  "/items",
  getAllMenuItems
);
// ========================================
// TOGGLE MENU ITEM AVAILABILITY
// Manager Only
// ========================================

router.patch(
  "/items/:id/availability",
  protect,
  authorizeRoles("MANAGER"),
  toggleMenuItemAvailability
);
module.exports = router;