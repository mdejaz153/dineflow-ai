const prisma = require("../config/prisma");

const {
  sendReservationConfirmationEmail,
  sendReservationCancellationEmail,
} = require("../services/notificationService");

// Reservation duration for V1.
// Customer selects start time; system reserves table for 90 minutes.
const RESERVATION_DURATION_MINUTES = 90;

// ========================================
// GET AVAILABLE TABLES
// ========================================

const getAvailableTables = async (req, res) => {
  try {
    const guestCount = Number(req.query.guestCount);
    const startTime = new Date(req.query.startTime);

    if (
      !Number.isInteger(guestCount) ||
      guestCount <= 0 ||
      Number.isNaN(startTime.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid guestCount and startTime are required",
      });
    }

    if (startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message:
          "Reservation time must be in the future",
      });
    }

    const endTime = new Date(
      startTime.getTime() +
        RESERVATION_DURATION_MINUTES *
          60 *
          1000
    );

    const candidateTables =
      await prisma.restaurantTable.findMany({
        where: {
          capacity: {
            gte: guestCount,
          },

          status: {
            not: "DISABLED",
          },
        },

        orderBy: [
          {
            capacity: "asc",
          },
          {
            number: "asc",
          },
        ],
      });

    const availableTables = [];

    for (const table of candidateTables) {
      const overlappingReservation =
        await prisma.reservation.findFirst({
          where: {
            tableId: table.id,

            status: {
              in: [
                "CONFIRMED",
                "SEATED",
              ],
            },

            startTime: {
              lt: endTime,
            },

            endTime: {
              gt: startTime,
            },
          },
        });

      if (!overlappingReservation) {
        availableTables.push(table);
      }
    }

    return res.status(200).json({
      success: true,
      count: availableTables.length,
      startTime,
      endTime,
      tables: availableTables,
    });
  } catch (error) {
    console.error(
      "Get available tables error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// CREATE RESERVATION
//
// Customer books one table for 90 minutes.
// After successful DB creation, DineFlow
// attempts to send confirmation email.
//
// IMPORTANT:
// Email failure never rolls back reservation.
// ========================================

const createReservation = async (req, res) => {
  try {
    const customerId = req.user.id;

    const {
      tableId,
      guestCount,
      startTime,
      specialRequest,
    } = req.body;

    const numericTableId =
      Number(tableId);

    const numericGuestCount =
      Number(guestCount);

    const reservationStart =
      new Date(startTime);

    // ========================================
    // BASIC VALIDATION
    // ========================================

    if (
      !Number.isInteger(numericTableId) ||
      !Number.isInteger(
        numericGuestCount
      ) ||
      numericGuestCount <= 0 ||
      Number.isNaN(
        reservationStart.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid tableId, guestCount and startTime are required",
      });
    }

    if (
      reservationStart <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reservation time must be in the future",
      });
    }

    const reservationEnd =
      new Date(
        reservationStart.getTime() +
          RESERVATION_DURATION_MINUTES *
            60 *
            1000
      );

    // ========================================
    // CHECK TABLE
    // ========================================

    const table =
      await prisma.restaurantTable.findUnique({
        where: {
          id: numericTableId,
        },
      });

    if (!table) {
      return res.status(404).json({
        success: false,
        message:
          "Restaurant table not found",
      });
    }

    if (
      table.status === "DISABLED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This table is currently disabled",
      });
    }

    if (
      numericGuestCount >
      table.capacity
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Table ${table.number} supports maximum ${table.capacity} guests`,
      });
    }

    // ========================================
    // DOUBLE-BOOKING PROTECTION
    // ========================================

    const overlappingReservation =
      await prisma.reservation.findFirst({
        where: {
          tableId: numericTableId,

          status: {
            in: [
              "CONFIRMED",
              "SEATED",
            ],
          },

          startTime: {
            lt: reservationEnd,
          },

          endTime: {
            gt: reservationStart,
          },
        },
      });

    if (overlappingReservation) {
      return res.status(409).json({
        success: false,
        message:
          "This table is already reserved for the selected time",
      });
    }

    // ========================================
    // CREATE RESERVATION
    // ========================================

    const reservation =
      await prisma.reservation.create({
        data: {
          customerId,
          tableId:
            numericTableId,

          guestCount:
            numericGuestCount,

          startTime:
            reservationStart,

          endTime:
            reservationEnd,

          specialRequest:
            specialRequest?.trim() ||
            null,
        },

        include: {
          table: true,

          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

    // ========================================
    // SEND CONFIRMATION EMAIL
    //
    // Reservation has already been created.
    // Email errors are logged separately.
    // ========================================

    try {
      await sendReservationConfirmationEmail({
        customer:
          reservation.customer,

        reservation,
      });
    } catch (emailError) {
      console.error(
        "Reservation confirmation email failed:",
        emailError.message
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Table reserved successfully",
      reservation,
    });
  } catch (error) {
    console.error(
      "Create reservation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

// ========================================
// GET MY RESERVATIONS
// ========================================

const getMyReservations = async (
  req,
  res
) => {
  try {
    const customerId =
      req.user.id;

    const reservations =
      await prisma.reservation.findMany({
        where: {
          customerId,
        },

        include: {
          table: true,
        },

        orderBy: {
          startTime: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      count: reservations.length,
      reservations,
    });
  } catch (error) {
    console.error(
      "Get my reservations error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

// ========================================
// CANCEL MY RESERVATION
//
// Customer can cancel their own confirmed
// reservation.
//
// After cancellation, DineFlow attempts to
// send cancellation email.
//
// Email failure does not undo cancellation.
// ========================================

const cancelMyReservation = async (
  req,
  res
) => {
  try {
    const customerId =
      req.user.id;

    const reservationId =
      Number(req.params.id);

    if (
      !Number.isInteger(
        reservationId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid reservation ID",
      });
    }

    const reservation =
      await prisma.reservation.findFirst({
        where: {
          id: reservationId,
          customerId,
        },

        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message:
          "Reservation not found",
      });
    }

    if (
      reservation.status !==
      "CONFIRMED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only confirmed reservations can be cancelled",
      });
    }

    // ========================================
    // CANCEL RESERVATION
    // ========================================

    const updatedReservation =
      await prisma.reservation.update({
        where: {
          id: reservationId,
        },

        data: {
          status: "CANCELLED",
        },

        include: {
          table: true,

          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    // ========================================
    // SEND CANCELLATION EMAIL
    // ========================================

    try {
      await sendReservationCancellationEmail({
        customer:
          updatedReservation.customer,

        reservation:
          updatedReservation,
      });
    } catch (emailError) {
      console.error(
        "Reservation cancellation email failed:",
        emailError.message
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Reservation cancelled successfully",
      reservation:
        updatedReservation,
    });
  } catch (error) {
    console.error(
      "Cancel reservation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

// ========================================
// GET SERVICE RESERVATIONS
//
// Waiter / Manager sees active bookings.
// ========================================

const getServiceReservations = async (
  req,
  res
) => {
  try {
    const reservations =
      await prisma.reservation.findMany({
        where: {
          status: {
            in: [
              "CONFIRMED",
              "SEATED",
            ],
          },
        },

        include: {
          table: true,

          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },

        orderBy: {
          startTime: "asc",
        },
      });

    return res.status(200).json({
      success: true,
      count: reservations.length,
      reservations,
    });
  } catch (error) {
    console.error(
      "Get service reservations error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

// ========================================
// UPDATE RESERVATION STATUS
//
// Waiter / Manager handles:
//
// CONFIRMED -> SEATED
// CONFIRMED -> CANCELLED
// CONFIRMED -> NO_SHOW
// SEATED    -> COMPLETED
// ========================================

const updateReservationStatus = async (
  req,
  res
) => {
  try {
    const reservationId =
      Number(req.params.id);

    const { status } =
      req.body;

    if (
      !Number.isInteger(
        reservationId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid reservation ID",
      });
    }

    const reservation =
      await prisma.reservation.findUnique({
        where: {
          id: reservationId,
        },
      });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message:
          "Reservation not found",
      });
    }

    // ========================================
    // CONTROLLED WORKFLOW
    // ========================================

    const allowedTransitions = {
      CONFIRMED: [
        "SEATED",
        "CANCELLED",
        "NO_SHOW",
      ],

      SEATED: [
        "COMPLETED",
      ],

      COMPLETED: [],
      CANCELLED: [],
      NO_SHOW: [],
    };

    if (
      !status ||
      !allowedTransitions[
        reservation.status
      ]?.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Cannot change reservation from ${reservation.status} to ${status}`,
      });
    }

    // ========================================
    // RESERVATION + TABLE TRANSACTION
    // ========================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          const updatedReservation =
            await tx.reservation.update({
              where: {
                id: reservationId,
              },

              data: {
                status,
              },

              include: {
                table: true,

                customer: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                  },
                },
              },
            });

          // Guest seated
          if (
            status === "SEATED"
          ) {
            await tx.restaurantTable.update({
              where: {
                id:
                  reservation.tableId,
              },

              data: {
                status:
                  "OCCUPIED",
              },
            });
          }

          // Reservation completed
          if (
            status === "COMPLETED"
          ) {
            await tx.restaurantTable.update({
              where: {
                id:
                  reservation.tableId,
              },

              data: {
                status:
                  "CLEANING",
              },
            });
          }

          return updatedReservation;
        }
      );

    return res.status(200).json({
      success: true,
      message:
        `Reservation status updated to ${status}`,
      reservation: result,
    });
  } catch (error) {
    console.error(
      "Update reservation status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

module.exports = {
  getAvailableTables,
  createReservation,
  getMyReservations,
  cancelMyReservation,
  getServiceReservations,
  updateReservationStatus,
};