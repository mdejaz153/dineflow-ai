const prisma = require("../config/prisma");

// ========================================
// GET WASTE ANALYTICS
//
// Uses existing InventoryTransaction records
// where transaction type = WASTE.
//
// Accessible to:
// - MANAGER
// - INVENTORY_STAFF
// ========================================

const getWasteAnalytics = async (req, res) => {
  try {
    // ========================================
    // FETCH ALL WASTE TRANSACTIONS
    // ========================================

    const wasteTransactions =
      await prisma.inventoryTransaction.findMany({
        where: {
          type: "WASTE",
        },

        include: {
          inventoryItem: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },

          performedBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    // ========================================
    // BUILD ITEM-WISE WASTE SUMMARY
    //
    // Important:
    // Different units such as kg and L are
    // never added together into one quantity.
    // ========================================

    const itemWasteMap = new Map();

    for (const transaction of wasteTransactions) {
      const item = transaction.inventoryItem;
      const quantity = Number(transaction.quantity);

      if (!itemWasteMap.has(item.id)) {
        itemWasteMap.set(item.id, {
          inventoryItemId: item.id,
          name: item.name,
          unit: item.unit,
          totalWaste: 0,
          wasteEvents: 0,
        });
      }

      const wasteData =
        itemWasteMap.get(item.id);

      wasteData.totalWaste += quantity;
      wasteData.wasteEvents += 1;
    }

    const itemWaste = Array.from(
      itemWasteMap.values()
    )
      .map((item) => ({
        ...item,

        totalWaste: Number(
          item.totalWaste.toFixed(3)
        ),
      }))
      .sort(
        (a, b) =>
          b.wasteEvents - a.wasteEvents ||
          b.totalWaste - a.totalWaste
      );

    // ========================================
    // HIGHEST WASTE FREQUENCY ITEM
    //
    // We use event frequency rather than
    // comparing kg against L/pcs directly.
    // ========================================

    const highestWasteItem =
      itemWaste.length > 0
        ? itemWaste[0]
        : null;

    // ========================================
    // RECENT WASTE ACTIVITY
    // Latest 10 waste transactions
    // ========================================

    const recentWaste =
      wasteTransactions
        .slice(0, 10)
        .map((transaction) => ({
          id: transaction.id,

          inventoryItemId:
            transaction.inventoryItem.id,

          name:
            transaction.inventoryItem.name,

          unit:
            transaction.inventoryItem.unit,

          quantity: Number(
            transaction.quantity
          ),

          note:
            transaction.note,

          createdAt:
            transaction.createdAt,

          performedBy:
            transaction.performedBy,
        }));

    // ========================================
    // SMART WASTE INSIGHT
    //
    // V1 is deterministic and explainable.
    // ========================================

    let insight = {
      level: "HEALTHY",
      message:
        "No inventory waste has been recorded yet.",
    };

    if (highestWasteItem) {
      if (
        highestWasteItem.wasteEvents >= 5
      ) {
        insight = {
          level: "HIGH",
          message:
            `${highestWasteItem.name} has the highest waste frequency ` +
            `with ${highestWasteItem.wasteEvents} recorded waste events. ` +
            "Review purchasing, storage, preparation, and handling practices.",
        };
      } else if (
        highestWasteItem.wasteEvents >= 3
      ) {
        insight = {
          level: "MODERATE",
          message:
            `${highestWasteItem.name} has repeated waste activity ` +
            `(${highestWasteItem.wasteEvents} events). Monitor usage and storage closely.`,
        };
      } else {
        insight = {
          level: "LOW",
          message:
            `${highestWasteItem.name} currently has the highest recorded waste frequency, ` +
            "but there is not yet enough activity to classify it as a major waste pattern.",
        };
      }
    }

    // ========================================
    // RESPONSE SUMMARY
    // ========================================

    const summary = {
      totalWasteEvents:
        wasteTransactions.length,

      itemsWithWaste:
        itemWaste.length,

      // We intentionally do NOT return one
      // "total waste quantity" because adding
      // kg + L + pcs would be misleading.
      highestWasteItem:
        highestWasteItem
          ? {
              inventoryItemId:
                highestWasteItem.inventoryItemId,

              name:
                highestWasteItem.name,

              unit:
                highestWasteItem.unit,

              totalWaste:
                highestWasteItem.totalWaste,

              wasteEvents:
                highestWasteItem.wasteEvents,
            }
          : null,
    };

    return res.status(200).json({
      success: true,
      summary,
      insight,
      itemWaste,
      recentWaste,
    });
  } catch (error) {
    console.error(
      "Waste analytics error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate waste analytics",
    });
  }
};
// ========================================
// GET CONSUMPTION ANALYTICS
//
// Uses real CONSUMPTION transactions created
// when kitchen starts preparing an order.
//
// Provides:
// - Total consumption per ingredient
// - Consumption event count
// - Current stock
// - Average daily consumption
// - Estimated stock coverage
// - Waste vs consumption
// ========================================

const getConsumptionAnalytics = async (
  req,
  res
) => {
  try {
    // ========================================
    // ANALYSIS WINDOW
    //
    // V1 uses last 30 days.
    // ========================================

    const now = new Date();

    const thirtyDaysAgo = new Date(
      now.getTime() -
        30 * 24 * 60 * 60 * 1000
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
    // FETCH CONSUMPTION TRANSACTIONS
    // ========================================

    const consumptionTransactions =
      await prisma.inventoryTransaction.findMany({
        where: {
          type: "CONSUMPTION",

          createdAt: {
            gte: thirtyDaysAgo,
          },
        },

        include: {
          inventoryItem: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    // ========================================
    // FETCH WASTE IN SAME WINDOW
    //
    // Used for waste-vs-consumption ratio.
    // ========================================

    const wasteTransactions =
      await prisma.inventoryTransaction.findMany({
        where: {
          type: "WASTE",

          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

    // ========================================
    // AGGREGATE CONSUMPTION
    // ========================================

    const consumptionMap =
      new Map();

    for (
      const transaction of
      consumptionTransactions
    ) {
      const itemId =
        transaction.inventoryItemId;

      const quantity =
        Number(
          transaction.quantity
        );

      if (
        !consumptionMap.has(itemId)
      ) {
        consumptionMap.set(
          itemId,
          {
            totalConsumed: 0,
            consumptionEvents: 0,
            firstConsumptionAt:
              transaction.createdAt,
            lastConsumptionAt:
              transaction.createdAt,
          }
        );
      }

      const data =
        consumptionMap.get(itemId);

      data.totalConsumed +=
        quantity;

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
    // AGGREGATE WASTE
    // ========================================

    const wasteMap =
      new Map();

    for (
      const transaction of
      wasteTransactions
    ) {
      const itemId =
        transaction.inventoryItemId;

      const quantity =
        Number(
          transaction.quantity
        );

      wasteMap.set(
        itemId,
        (wasteMap.get(itemId) || 0) +
          quantity
      );
    }

    // ========================================
    // BUILD ITEM ANALYTICS
    // ========================================

    const items =
      inventoryItems.map(
        (inventoryItem) => {
          const consumption =
            consumptionMap.get(
              inventoryItem.id
            );

          const totalConsumed =
            consumption
              ? consumption.totalConsumed
              : 0;

          const consumptionEvents =
            consumption
              ? consumption.consumptionEvents
              : 0;

          const totalWaste =
            wasteMap.get(
              inventoryItem.id
            ) || 0;

          // ====================================
          // ACTIVE CONSUMPTION DAYS
          //
          // For V1:
          // If consumption exists, measure days
          // from first consumption until now,
          // minimum 1 day.
          // ====================================

          let observedDays = 0;

          if (consumption) {
            const difference =
              now.getTime() -
              new Date(
                consumption.firstConsumptionAt
              ).getTime();

            observedDays = Math.max(
              1,
              Math.ceil(
                difference /
                  (24 *
                    60 *
                    60 *
                    1000)
              )
            );
          }

          // ====================================
          // AVERAGE DAILY CONSUMPTION
          // ====================================

          const averageDailyConsumption =
            observedDays > 0
              ? totalConsumed /
                observedDays
              : 0;

          // ====================================
          // ESTIMATED DAYS REMAINING
          //
          // Current stock / average daily usage
          // ====================================

          const currentStock =
            Number(
              inventoryItem.currentStock
            );

          const estimatedDaysRemaining =
            averageDailyConsumption > 0
              ? currentStock /
                averageDailyConsumption
              : null;

          // ====================================
          // WASTE RATE
          //
          // Waste compared with total material
          // leaving usable inventory through
          // consumption + waste.
          // ====================================

          const materialOutflow =
            totalConsumed +
            totalWaste;

          const wasteRate =
            materialOutflow > 0
              ? (totalWaste /
                  materialOutflow) *
                100
              : 0;

          // ====================================
          // OPERATIONAL STATUS
          // ====================================

          let stockCoverageStatus =
            "NO_USAGE_DATA";

          if (
            averageDailyConsumption > 0
          ) {
            if (
              estimatedDaysRemaining <= 2
            ) {
              stockCoverageStatus =
                "URGENT";
            } else if (
              estimatedDaysRemaining <= 5
            ) {
              stockCoverageStatus =
                "LOW_COVERAGE";
            } else {
              stockCoverageStatus =
                "HEALTHY";
            }
          }

          return {
            inventoryItemId:
              inventoryItem.id,

            name:
              inventoryItem.name,

            unit:
              inventoryItem.unit,

            currentStock:
              Number(
                currentStock.toFixed(3)
              ),

            minimumStock:
              Number(
                Number(
                  inventoryItem.minimumStock
                ).toFixed(3)
              ),

            totalConsumed:
              Number(
                totalConsumed.toFixed(3)
              ),

            consumptionEvents,

            observedDays,

            averageDailyConsumption:
              Number(
                averageDailyConsumption.toFixed(
                  3
                )
              ),

            estimatedDaysRemaining:
              estimatedDaysRemaining ===
              null
                ? null
                : Number(
                    estimatedDaysRemaining.toFixed(
                      1
                    )
                  ),

            totalWaste:
              Number(
                totalWaste.toFixed(3)
              ),

            wasteRate:
              Number(
                wasteRate.toFixed(1)
              ),

            stockCoverageStatus,
          };
        }
      );

    // ========================================
    // FASTEST MOVING INGREDIENT
    //
    // Compare daily usage rate rather than
    // raw quantities.
    // ========================================

    const itemsWithConsumption =
      items.filter(
        (item) =>
          item.averageDailyConsumption >
          0
      );

    const fastestMovingItem =
      itemsWithConsumption.length > 0
        ? [...itemsWithConsumption].sort(
            (a, b) =>
              b.averageDailyConsumption -
              a.averageDailyConsumption
          )[0]
        : null;

    // ========================================
    // STOCK RISK COUNTS
    // ========================================

    const urgentItems =
      items.filter(
        (item) =>
          item.stockCoverageStatus ===
          "URGENT"
      );

    const lowCoverageItems =
      items.filter(
        (item) =>
          item.stockCoverageStatus ===
          "LOW_COVERAGE"
      );

    // ========================================
    // SMART INSIGHT
    // ========================================

    let insight = {
      level: "INFO",

      message:
        "More consumption data is needed before stock coverage can be estimated.",
    };

    if (urgentItems.length > 0) {
      insight = {
        level: "URGENT",

        message:
          `${urgentItems.length} ingredient(s) may have 2 days or less of stock remaining based on recent consumption.`,
      };
    } else if (
      lowCoverageItems.length > 0
    ) {
      insight = {
        level: "WARNING",

        message:
          `${lowCoverageItems.length} ingredient(s) may have 5 days or less of stock remaining based on recent consumption.`,
      };
    } else if (
      itemsWithConsumption.length > 0
    ) {
      insight = {
        level: "HEALTHY",

        message:
          "Current ingredient stock coverage appears healthy based on available consumption data.",
      };
    }

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      analysisWindowDays: 30,

      summary: {
        totalInventoryItems:
          items.length,

        itemsWithConsumption:
          itemsWithConsumption.length,

        urgentItems:
          urgentItems.length,

        lowCoverageItems:
          lowCoverageItems.length,

        fastestMovingItem:
          fastestMovingItem
            ? {
                inventoryItemId:
                  fastestMovingItem.inventoryItemId,

                name:
                  fastestMovingItem.name,

                unit:
                  fastestMovingItem.unit,

                averageDailyConsumption:
                  fastestMovingItem.averageDailyConsumption,
              }
            : null,
      },

      insight,

      items,
    });
  } catch (error) {
    console.error(
      "Consumption analytics error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to generate consumption analytics",
    });
  }
};
module.exports = {
  getWasteAnalytics,
  getConsumptionAnalytics,
};