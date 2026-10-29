const express = require("express");
const cors = require("cors");
require("dotenv").config();

const prisma = require("./config/prisma");

// ========================================
// ROUTE IMPORTS
// ========================================

// Authentication routes
const authRoutes = require("./routes/authRoutes");

// Manager / Admin routes
const adminRoutes = require("./routes/adminRoutes");

// Chef / Kitchen routes
const kitchenRoutes = require("./routes/kitchenRoutes");

// Menu routes
const menuRoutes = require("./routes/menuRoutes");

// Customer order routes
const orderRoutes = require("./routes/orderRoutes");

// Waiter / Service routes
const waiterRoutes = require("./routes/waiterRoutes");

// Table management routes
const tableRoutes = require("./routes/tableRoutes");

// Reservation routes
const reservationRoutes = require("./routes/reservationRoutes");

// Inventory management routes
const inventoryRoutes = require("./routes/inventoryRoutes");

// Inventory alerts routes
const inventoryAlertRoutes = require(
  "./routes/inventoryAlertRoutes"
);

// Procurement / Reorder routes
const reorderRoutes = require(
  "./routes/reorderRoutes"
);

// Analytics routes
const analyticsRoutes = require(
  "./routes/analyticsRoutes"
);


// ========================================
// EXPRESS APP
// ========================================

const app = express();

// ========================================
// GLOBAL MIDDLEWARE
// ========================================

// Allow frontend to communicate with backend
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// ========================================
// API ROUTES
// ========================================

// Authentication
app.use("/api/auth", authRoutes);

// Manager / Admin
app.use("/api/admin", adminRoutes);

// Chef / Kitchen
app.use("/api/kitchen", kitchenRoutes);

// Restaurant Menu
app.use("/api/menu", menuRoutes);

// Customer Orders
app.use("/api/orders", orderRoutes);

// Waiter / Service
app.use("/api/waiter", waiterRoutes);

// Restaurant Tables
app.use("/api/tables", tableRoutes);

// Customer Reservations
app.use("/api/reservations", reservationRoutes);

// Inventory Management
app.use("/api/inventory", inventoryRoutes);

// Smart Inventory Alerts
app.use(
  "/api/inventory-alerts",
  inventoryAlertRoutes
);

// Smart Reorder / Procurement
app.use(
  "/api/reorders",
  reorderRoutes
);

// Analytics
app.use(
  "/api/analytics",
  analyticsRoutes
);


// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DineFlow API is running",
  });
});

// ========================================
// DATABASE CONNECTION TEST
// ========================================

app.get("/api/db-test", async (req, res) => {
  try {
    const userCount = await prisma.user.count();

    res.status(200).json({
      success: true,
      message: "Database connected successfully",
      users: userCount,
    });
  } catch (error) {
    console.error("Database test error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `DineFlow server running on port ${PORT}`
  );
});