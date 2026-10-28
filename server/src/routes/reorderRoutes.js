const express = require("express");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const {
  createReorderRequest,
  getMyReorderRequests,
  getAllReorderRequests,
  reviewReorderRequest,
  receiveReorderRequest,
} = require(
  "../controllers/reorderController"
);

const router = express.Router();

// ========================================
// INVENTORY STAFF
// Create procurement request
// ========================================

router.post(
  "/",
  protect,
  authorizeRoles("INVENTORY_STAFF"),
  createReorderRequest
);

// ========================================
// INVENTORY STAFF
// View own procurement requests
// ========================================

router.get(
  "/my-requests",
  protect,
  authorizeRoles("INVENTORY_STAFF"),
  getMyReorderRequests
);

// ========================================
// MANAGER
// View all procurement requests
// ========================================

router.get(
  "/",
  protect,
  authorizeRoles("MANAGER"),
  getAllReorderRequests
);

// ========================================
// MANAGER
// Approve / Reject pending request
// ========================================

router.patch(
  "/:id/review",
  protect,
  authorizeRoles("MANAGER"),
  reviewReorderRequest
);

// ========================================
// INVENTORY STAFF
// Receive approved delivery
// ========================================

router.patch(
  "/:id/receive",
  protect,
  authorizeRoles("INVENTORY_STAFF"),
  receiveReorderRequest
);

module.exports = router;