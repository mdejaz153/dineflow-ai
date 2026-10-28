const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  createStaff,
  getAllStaff,
  deactivateStaff,
  reactivateStaff,
} = require("../controllers/adminController");

const router = express.Router();

// ========================================
// RBAC Test - Manager Only
// ========================================
router.get(
  "/test",
  protect,
  authorizeRoles("MANAGER"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome to the Manager area",
      user: req.user,
    });
  }
);

// ========================================
// Create Staff - Manager Only
// ========================================
router.post(
  "/staff",
  protect,
  authorizeRoles("MANAGER"),
  createStaff
);

// ========================================
// Get All Staff - Manager Only
// ========================================
router.get(
  "/staff",
  protect,
  authorizeRoles("MANAGER"),
  getAllStaff
);
// ========================================
// Deactivate Staff - Manager Only
// ========================================
router.patch(
  "/staff/:id/deactivate",
  protect,
  authorizeRoles("MANAGER"),
  deactivateStaff
  
);
// ========================================
// Reactivate Staff - Manager Only
// ========================================
router.patch(
  "/staff/:id/reactivate",
  protect,
  authorizeRoles("MANAGER"),
  reactivateStaff
);
// IMPORTANT: Export the router
module.exports = router;