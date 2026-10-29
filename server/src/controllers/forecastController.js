const prisma = require("../config/prisma");

// ========================================
// DEMAND FORECASTING V1
//
// Uses actual CONSUMPTION transactions.
//
// V1 strategy:
// - Analysis window: last 30 days
// - Calculate observed daily consumption
// - Forecast next 7 days
// - Keep minimumStock as safety stock
// - Recommend reorder when current stock
//   cannot cover forecast + safety stock
//
// This is statistical/rule-based forecasting,
// not a machine-learning model.
// ========================================

const getDemandForecast = async (req, res) => {
  try {
    const now = new Date();

    const ANALYSIS_WINDOW_DAYS = 30;
    const FORECAST_DAYS = 7;

    const analysisStart = new Date(
      now.getTime() -
        ANALYSIS_WINDOW_DAYS *
          24 *
          60 *
          60 *
          1000
    );

    // ========================================
    // FETCH INVENTORY
    // ========================================

    const inventoryItems =
      await prisma.inventoryItem.findMany({
        orderBy: {
          name: "asc",
        },
      });

    // ========================================
    // FETCH ACTUAL CONSUMPTION HISTORY
    // ========================================

    const transactions =
      await prisma.inventoryTransaction.findMany({
        where: {
          type: "CONSUMPTION",

          createdAt: {
            gte: analysisStart,
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    // ========================================
    // GROUP CONSUMPTION BY INGREDIENT
    // ========================================

    const consumptionMap = new Map();

    for (const transaction of transactions) {
      const itemId =
        transaction.inventoryItemId;

      const quantity =
        Number(transaction.quantity);

      if (!consumptionMap.has(itemId)) {
        consumptionMap.set(itemId, {
          totalConsumed: 0,
          consumptionEvents: 0,
          firstConsumptionAt:
            transaction.createdAt,
          lastConsumptionAt:
            transaction.createdAt,
        });
      }

      const data =
        consumptionMap.get(itemId);

      data.totalConsumed += quantity;
      data.consumptionEvents += 1;

      if (
        transaction.createdAt <
        data.firstConsumptionAt
      ) {
        data.firstConsumptionAt =
          transaction.createdAt;
      }

      if (
        transaction.createdAt >
        data.lastConsumptionAt
      ) {
        data.lastConsumptionAt =
          transaction.createdAt;
      }
    }

    // ========================================
    // BUILD FORECAST FOR EVERY ITEM
    // ========================================

    const forecasts =
      inventoryItems.map((item) => {
        const consumption =
          consumptionMap.get(item.id);

        const currentStock =
          Number(item.currentStock);

        const minimumStock =
          Number(item.minimumStock);

        // No actual usage data yet
        if (!consumption) {
          return {
            inventoryItemId: item.id,
            name: item.name,
            unit: item.unit,

            currentStock,
            minimumStock,

            consumptionEvents: 0,
            totalConsumed: 0,
            observedDays: 0,
            averageDailyConsumption: 0,

            forecastDays:
              FORECAST_DAYS,

            forecastDemand: 0,

            projectedStockAfterForecast:
              currentStock,

            safetyStock:
              minimumStock,

            requiredStock:
              minimumStock,

            expectedShortage: 0,
            recommendedReorder: 0,

            riskLevel:
              "NO_DATA",

            message:
              "Not enough consumption data to generate a demand forecast.",
          };
        }

        // ====================================
        // OBSERVATION PERIOD
        //
        // Minimum 1 day so same-day test data
        // does not cause division by zero.
        // ====================================

        const elapsedMs =
          now.getTime() -
          new Date(
            consumption.firstConsumptionAt
          ).getTime();

        const observedDays =
          Math.max(
            1,
            Math.ceil(
              elapsedMs /
                (24 *
                  60 *
                  60 *
                  1000)
            )
          );

        // ====================================
        // DAILY CONSUMPTION RATE
        // ====================================

        const averageDailyConsumption =
          consumption.totalConsumed /
          observedDays;

        // ====================================
        // 7-DAY DEMAND FORECAST
        // ====================================

        const forecastDemand =
          averageDailyConsumption *
          FORECAST_DAYS;

        // Stock expected after meeting demand
        const projectedStockAfterForecast =
          currentStock -
          forecastDemand;

        // ====================================
        // SAFETY STOCK
        //
        // Existing minimumStock acts as the
        // safety reserve.
        // ====================================

        const safetyStock =
          minimumStock;

        // To satisfy predicted demand AND
        // preserve safety stock:
        const requiredStock =
          forecastDemand +
          safetyStock;

        // ====================================
        // REORDER REQUIREMENT
        // ====================================

        const recommendedReorder =
          Math.max(
            requiredStock -
              currentStock,
            0
          );

        // Actual inability to meet forecast
        // demand, excluding safety reserve.
        const expectedShortage =
          Math.max(
            forecastDemand -
              currentStock,
            0
          );

        // ====================================
        // RISK CLASSIFICATION
        // ====================================

        let riskLevel = "LOW";

        let message =
          `${item.name} has sufficient stock for the next ${FORECAST_DAYS} days based on recent consumption.`;

        if (currentStock < forecastDemand) {
          riskLevel = "HIGH";

          message =
            `${item.name} may run out within the next ${FORECAST_DAYS} days based on recent consumption.`;
        } else if (
          currentStock <
          requiredStock
        ) {
          riskLevel = "MEDIUM";

          message =
            `${item.name} can cover forecast demand, but may fall below its safety stock level.`;
        }

        return {
          inventoryItemId:
            item.id,

          name:
            item.name,

          unit:
            item.unit,

          currentStock:
            Number(
              currentStock.toFixed(3)
            ),

          minimumStock:
            Number(
              minimumStock.toFixed(3)
            ),

          consumptionEvents:
            consumption.consumptionEvents,

          totalConsumed:
            Number(
              consumption.totalConsumed.toFixed(
                3
              )
            ),

          observedDays,

          averageDailyConsumption:
            Number(
              averageDailyConsumption.toFixed(
                3
              )
            ),

          forecastDays:
            FORECAST_DAYS,

          forecastDemand:
            Number(
              forecastDemand.toFixed(3)
            ),

          projectedStockAfterForecast:
            Number(
              projectedStockAfterForecast.toFixed(
                3
              )
            ),

          safetyStock:
            Number(
              safetyStock.toFixed(3)
            ),

          requiredStock:
            Number(
              requiredStock.toFixed(3)
            ),

          expectedShortage:
            Number(
              expectedShortage.toFixed(3)
            ),

          recommendedReorder:
            Number(
              recommendedReorder.toFixed(3)
            ),

          riskLevel,

          message,
        };
      });

    // ========================================
    // SORT BY RISK
    // HIGH -> MEDIUM -> LOW -> NO_DATA
    // ========================================

    const riskPriority = {
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
      NO_DATA: 4,
    };

    forecasts.sort(
      (a, b) =>
        riskPriority[a.riskLevel] -
        riskPriority[b.riskLevel]
    );

    // ========================================
    // SUMMARY
    // ========================================

    const highRiskItems =
      forecasts.filter(
        (item) =>
          item.riskLevel === "HIGH"
      );

    const mediumRiskItems =
      forecasts.filter(
        (item) =>
          item.riskLevel === "MEDIUM"
      );

    const lowRiskItems =
      forecasts.filter(
        (item) =>
          item.riskLevel === "LOW"
      );

    const noDataItems =
      forecasts.filter(
        (item) =>
          item.riskLevel === "NO_DATA"
      );

    const reorderItems =
      forecasts.filter(
        (item) =>
          item.recommendedReorder > 0
      );

    // ========================================
    // OVERALL FORECAST INSIGHT
    // ========================================

    let insight = {
      level: "HEALTHY",

      message:
        "No forecasted inventory shortages were detected.",
    };

    if (highRiskItems.length > 0) {
      insight = {
        level: "HIGH",

        message:
          `${highRiskItems.length} ingredient(s) are at high risk of running out within the next ${FORECAST_DAYS} days.`,
      };
    } else if (
      mediumRiskItems.length > 0
    ) {
      insight = {
        level: "MEDIUM",

        message:
          `${mediumRiskItems.length} ingredient(s) may fall below safety stock within the next ${FORECAST_DAYS} days.`,
      };
    } else if (
      forecasts.every(
        (item) =>
          item.riskLevel ===
          "NO_DATA"
      )
    ) {
      insight = {
        level: "NO_DATA",

        message:
          "More consumption history is required before demand risk can be estimated.",
      };
    }

    return res.status(200).json({
      success: true,

      methodology: {
        analysisWindowDays:
          ANALYSIS_WINDOW_DAYS,

        forecastDays:
          FORECAST_DAYS,

        model:
          "RECENT_AVERAGE_CONSUMPTION",

        safetyStockPolicy:
          "INVENTORY_MINIMUM_STOCK",
      },

      summary: {
        totalItems:
          forecasts.length,

        highRiskItems:
          highRiskItems.length,

        mediumRiskItems:
          mediumRiskItems.length,

        lowRiskItems:
          lowRiskItems.length,

        noDataItems:
          noDataItems.length,

        reorderRecommendedItems:
          reorderItems.length,
      },

      insight,

      forecasts,
    });
  } catch (error) {
    console.error(
      "Demand forecast error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to generate demand forecast",
    });
  }
};

module.exports = {
  getDemandForecast,
};