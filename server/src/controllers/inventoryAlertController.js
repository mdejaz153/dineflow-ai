const prisma = require("../config/prisma");

// ========================================
// BUILD SMART INVENTORY ALERT
//
// Rule-based and explainable alert engine.
// No external AI API is required.
//
// Severity:
// OUT_OF_STOCK -> stock = 0
// CRITICAL     -> stock <= 50% of minimum
// LOW          -> stock <= minimum
// OK           -> stock > minimum
// ========================================

const buildInventoryAlert = (item) => {
  const currentStock = Number(item.currentStock);
  const minimumStock = Number(item.minimumStock);

  let severity = "OK";
  let message = `${item.name} stock level is healthy.`;

  // ========================================
  // DETERMINE SEVERITY
  // ========================================

  if (currentStock === 0) {
    severity = "OUT_OF_STOCK";
    message = `${item.name} is out of stock.`;
  } else if (
    minimumStock > 0 &&
    currentStock <= minimumStock * 0.5
  ) {
    severity = "CRITICAL";
    message = `${item.name} stock is critically low.`;
  } else if (
    minimumStock > 0 &&
    currentStock <= minimumStock
  ) {
    severity = "LOW";
    message = `${item.name} is below or at its minimum stock level.`;
  }

  // ========================================
  // CALCULATE STOCK PERCENTAGE
  //
  // Example:
  // current = 1.5
  // minimum = 2
  // percentage = 75%
  // ========================================

  const stockPercentage =
    minimumStock > 0
      ? (currentStock / minimumStock) * 100
      : null;

  // ========================================
  // REORDER SUGGESTION
  //
  // V1 strategy:
  // Target stock = 2 × minimum stock.
  //
  // Example:
  // Minimum = 2kg
  // Target  = 4kg
  // Current = 1.5kg
  // Reorder = 2.5kg
  // ========================================

  const targetStock = minimumStock * 2;

  const suggestedReorder =
    severity !== "OK"
      ? Math.max(
          targetStock - currentStock,
          0
        )
      : 0;

  return {
    id: item.id,
    name: item.name,
    unit: item.unit,

    currentStock,
    minimumStock,

    stockPercentage:
      stockPercentage === null
        ? null
        : Number(
            stockPercentage.toFixed(1)
          ),

    severity,

    message,

    suggestedReorder: Number(
      suggestedReorder.toFixed(3)
    ),
  };
};

// ========================================
// GET SMART INVENTORY ALERTS
//
// Manager + Inventory Staff
// ========================================

const getInventoryAlerts = async (req, res) => {
  try {
    const items =
      await prisma.inventoryItem.findMany({
        orderBy: {
          name: "asc",
        },
      });

    const allItems =
      items.map(buildInventoryAlert);

    // Only items needing attention
    const alerts = allItems.filter(
      (item) => item.severity !== "OK"
    );

    // ========================================
    // SUMMARY COUNTS
    // ========================================

    const summary = {
      totalItems: allItems.length,

      healthyItems: allItems.filter(
        (item) =>
          item.severity === "OK"
      ).length,

      lowItems: allItems.filter(
        (item) =>
          item.severity === "LOW"
      ).length,

      criticalItems: allItems.filter(
        (item) =>
          item.severity === "CRITICAL"
      ).length,

      outOfStockItems: allItems.filter(
        (item) =>
          item.severity ===
          "OUT_OF_STOCK"
      ).length,

      totalAlerts: alerts.length,
    };

    return res.status(200).json({
      success: true,
      summary,
      alerts,
    });
  } catch (error) {
    console.error(
      "Inventory alerts error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getInventoryAlerts,
};