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

module.exports = {
  getWasteAnalytics,
};