const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  createTable,
  getAllTables,
  updateTableStatus,
} = require("../controllers/tableController");

const router = express.Router();

// ========================================
// GET ALL TABLES
// Public information
// ========================================

router.get(
  "/",
  getAllTables
);

// ========================================
// CREATE TABLE
// Manager only
// ========================================

router.post(
  "/",
  protect,
  authorizeRoles("MANAGER"),
  createTable
);

// ========================================
// UPDATE TABLE STATUS
// Waiter and Manager
// ========================================

router.patch(
  "/:id/status",
  protect,
  authorizeRoles("WAITER", "MANAGER"),
  updateTableStatus
);

module.exports = router;