const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  getAvailableTables,
  createReservation,
  getMyReservations,
  cancelMyReservation,
} = require("../controllers/reservationController");

const router = express.Router();

// ========================================
// CHECK AVAILABLE TABLES
// Logged-in customer
//
// Example:
// /api/reservations/available
// ?guestCount=4
// &startTime=2026-10-26T19:00:00+05:30
// ========================================

router.get(
  "/available",
  protect,
  authorizeRoles("CUSTOMER"),
  getAvailableTables
);

// ========================================
// CREATE RESERVATION
// Customer only
// ========================================

router.post(
  "/",
  protect,
  authorizeRoles("CUSTOMER"),
  createReservation
);

// ========================================
// GET MY RESERVATIONS
// Customer only
// ========================================

router.get(
  "/my-reservations",
  protect,
  authorizeRoles("CUSTOMER"),
  getMyReservations
);

// ========================================
// CANCEL MY RESERVATION
// Customer only
// ========================================

router.patch(
  "/:id/cancel",
  protect,
  authorizeRoles("CUSTOMER"),
  cancelMyReservation
);

module.exports = router;