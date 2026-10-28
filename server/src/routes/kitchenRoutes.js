const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  getKitchenOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const router = express.Router();

// Chef / Kitchen protected route
router.get(
  "/test",
  protect,
  authorizeRoles("CHEF", "MANAGER"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Welcome to the Kitchen area",
      user: req.user,
    });
  }
);
// ========================================
// GET ACTIVE KITCHEN ORDERS
// Chef and Manager can view incoming orders
// ========================================

router.get(
  "/orders",
  protect,
  authorizeRoles("CHEF", "MANAGER"),
  getKitchenOrders
);
// ========================================
// UPDATE ORDER STATUS
// Chef and Manager can update kitchen orders
// Example:
// PENDING -> ACCEPTED -> PREPARING -> READY
// ========================================

router.patch(
  "/orders/:id/status",
  protect,
  authorizeRoles("CHEF", "MANAGER"),
  updateOrderStatus
);
module.exports = router;