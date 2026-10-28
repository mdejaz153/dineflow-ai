const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  getWaiterOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const {
  getServiceReservations,
  updateReservationStatus,
} = require("../controllers/reservationController");

const router = express.Router();

// ========================================
// GET READY ORDERS
// Waiter and Manager
// ========================================

router.get(
  "/orders",
  protect,
  authorizeRoles("WAITER", "MANAGER"),
  getWaiterOrders
);

// ========================================
// MARK ORDER AS SERVED
// READY -> SERVED
// ========================================

router.patch(
  "/orders/:id/status",
  protect,
  authorizeRoles("WAITER", "MANAGER"),
  updateOrderStatus
);

// ========================================
// GET ACTIVE RESERVATIONS
// CONFIRMED / SEATED reservations
// ========================================

router.get(
  "/reservations",
  protect,
  authorizeRoles("WAITER", "MANAGER"),
  getServiceReservations
);

// ========================================
// UPDATE RESERVATION STATUS
//
// CONFIRMED -> SEATED
// CONFIRMED -> CANCELLED
// CONFIRMED -> NO_SHOW
// SEATED    -> COMPLETED
// ========================================

router.patch(
  "/reservations/:id/status",
  protect,
  authorizeRoles("WAITER", "MANAGER"),
  updateReservationStatus
);

module.exports = router;