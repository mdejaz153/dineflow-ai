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
  sendTestEmail,
} = require(
  "../controllers/notificationController"
);

const router = express.Router();

// ========================================
// TEST EMAIL
//
// Manager-only development endpoint.
// ========================================

router.post(
  "/test-email",
  protect,
  authorizeRoles("MANAGER"),
  sendTestEmail
);

module.exports = router;