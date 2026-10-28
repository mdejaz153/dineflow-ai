const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  createOrder,
  getMyOrders,
} = require("../controllers/orderController");

const router = express.Router();

// ========================================
// PLACE ORDER
// Only logged-in CUSTOMER can place an order
// ========================================

router.post(
  "/",
  protect,
  authorizeRoles("CUSTOMER"),
  createOrder
);
// ========================================
// GET MY ORDERS
// Logged-in customer can see only
// their own order history
// ========================================

router.get(
  "/my-orders",
  protect,
  authorizeRoles("CUSTOMER"),
  getMyOrders
);
module.exports = router;