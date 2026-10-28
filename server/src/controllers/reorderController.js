const prisma = require("../config/prisma");

// ========================================
// COMMON INCLUDE
//
// Keeps reorder responses consistent across
// create/list/review/receive operations.
// ========================================

const reorderInclude = {
  inventoryItem: true,

  createdBy: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },

  reviewedBy: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },

  receivedBy: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
};

// ========================================
// CREATE REORDER REQUEST
//
// Inventory Staff requests additional stock.
// Request starts as PENDING.
// ========================================

const createReorderRequest = async (req, res) => {
  try {
    const inventoryItemId = Number(
      req.body.inventoryItemId
    );

    const quantity = Number(
      req.body.quantity
    );

    const note =
      req.body.note?.trim() || null;

    // ========================================
    // VALIDATION
    // ========================================

    if (!Number.isInteger(inventoryItemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory item ID",
      });
    }

    if (
      Number.isNaN(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reorder quantity must be greater than 0",
      });
    }

    // ========================================
    // CHECK INVENTORY ITEM
    // ========================================

    const inventoryItem =
      await prisma.inventoryItem.findUnique({
        where: {
          id: inventoryItemId,
        },
      });

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    // ========================================
    // PREVENT DUPLICATE ACTIVE REQUESTS
    //
    // Same ingredient should not have multiple
    // PENDING/APPROVED requests accidentally.
    // ========================================

    const existingActiveRequest =
      await prisma.reorderRequest.findFirst({
        where: {
          inventoryItemId,

          status: {
            in: [
              "PENDING",
              "APPROVED",
            ],
          },
        },
      });

    if (existingActiveRequest) {
      return res.status(409).json({
        success: false,
        message:
          "An active reorder request already exists for this inventory item",
      });
    }

    // ========================================
    // CREATE REQUEST
    // ========================================

    const reorderRequest =
      await prisma.reorderRequest.create({
        data: {
          inventoryItemId,
          quantity,
          note,
          createdById: req.user.id,
        },

        include: reorderInclude,
      });

    return res.status(201).json({
      success: true,
      message:
        "Reorder request created successfully",
      reorderRequest,
    });
  } catch (error) {
    console.error(
      "Create reorder request error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// GET MY REORDER REQUESTS
//
// Inventory Staff sees requests they created.
// ========================================

const getMyReorderRequests = async (
  req,
  res
) => {
  try {
    const reorderRequests =
      await prisma.reorderRequest.findMany({
        where: {
          createdById: req.user.id,
        },

        include: reorderInclude,

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      count: reorderRequests.length,
      reorderRequests,
    });
  } catch (error) {
    console.error(
      "Get my reorder requests error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// GET ALL REORDER REQUESTS
//
// Manager sees complete procurement history.
// ========================================

const getAllReorderRequests = async (
  req,
  res
) => {
  try {
    const reorderRequests =
      await prisma.reorderRequest.findMany({
        include: reorderInclude,

        orderBy: {
          createdAt: "desc",
        },
      });

    // Summary for Manager Dashboard
    const summary = {
      total: reorderRequests.length,

      pending: reorderRequests.filter(
        (request) =>
          request.status === "PENDING"
      ).length,

      approved: reorderRequests.filter(
        (request) =>
          request.status === "APPROVED"
      ).length,

      rejected: reorderRequests.filter(
        (request) =>
          request.status === "REJECTED"
      ).length,

      received: reorderRequests.filter(
        (request) =>
          request.status === "RECEIVED"
      ).length,
    };

    return res.status(200).json({
      success: true,
      summary,
      reorderRequests,
    });
  } catch (error) {
    console.error(
      "Get reorder requests error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// REVIEW REORDER REQUEST
//
// Manager:
// PENDING -> APPROVED
// PENDING -> REJECTED
// ========================================

const reviewReorderRequest = async (
  req,
  res
) => {
  try {
    const requestId = Number(
      req.params.id
    );

    const { status } = req.body;

    if (!Number.isInteger(requestId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid reorder request ID",
      });
    }

    if (
      !["APPROVED", "REJECTED"].includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be APPROVED or REJECTED",
      });
    }

    const existingRequest =
      await prisma.reorderRequest.findUnique({
        where: {
          id: requestId,
        },
      });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Reorder request not found",
      });
    }

    if (
      existingRequest.status !== "PENDING"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only pending reorder requests can be reviewed",
      });
    }

    const reorderRequest =
      await prisma.reorderRequest.update({
        where: {
          id: requestId,
        },

        data: {
          status,

          reviewedById:
            req.user.id,

          reviewedAt:
            new Date(),
        },

        include: reorderInclude,
      });

    return res.status(200).json({
      success: true,
      message: `Reorder request ${status.toLowerCase()} successfully`,
      reorderRequest,
    });
  } catch (error) {
    console.error(
      "Review reorder request error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// MARK REORDER AS RECEIVED
//
// APPROVED -> RECEIVED
//
// This operation performs three actions
// inside ONE database transaction:
//
// 1. Reorder becomes RECEIVED
// 2. Inventory stock increases
// 3. STOCK_IN audit transaction is created
//
// This prevents partial/inconsistent updates.
// ========================================

const receiveReorderRequest = async (
  req,
  res
) => {
  try {
    const requestId = Number(
      req.params.id
    );

    if (!Number.isInteger(requestId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid reorder request ID",
      });
    }

    const existingRequest =
      await prisma.reorderRequest.findUnique({
        where: {
          id: requestId,
        },

        include: {
          inventoryItem: true,
        },
      });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Reorder request not found",
      });
    }

    if (
      existingRequest.status !==
      "APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only approved reorder requests can be received",
      });
    }

    const quantity =
      Number(existingRequest.quantity);

    // ========================================
    // DATABASE TRANSACTION
    // ========================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          // 1. Increase inventory stock
          const updatedInventoryItem =
            await tx.inventoryItem.update({
              where: {
                id:
                  existingRequest.inventoryItemId,
              },

              data: {
                currentStock: {
                  increment: quantity,
                },
              },
            });

          // 2. Create inventory audit record
          await tx.inventoryTransaction.create({
            data: {
              type: "STOCK_IN",

              quantity,

              note:
                `Received reorder request #${existingRequest.id}`,

              inventoryItemId:
                existingRequest.inventoryItemId,

              performedById:
                req.user.id,
            },
          });

          // 3. Mark procurement request received
          const reorderRequest =
            await tx.reorderRequest.update({
              where: {
                id: requestId,
              },

              data: {
                status: "RECEIVED",

                receivedById:
                  req.user.id,

                receivedAt:
                  new Date(),
              },

              include: reorderInclude,
            });

          return {
            reorderRequest,
            updatedInventoryItem,
          };
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Reorder received and inventory updated successfully",

      reorderRequest:
        result.reorderRequest,

      inventoryItem:
        result.updatedInventoryItem,
    });
  } catch (error) {
    console.error(
      "Receive reorder request error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createReorderRequest,
  getMyReorderRequests,
  getAllReorderRequests,
  reviewReorderRequest,
  receiveReorderRequest,
};