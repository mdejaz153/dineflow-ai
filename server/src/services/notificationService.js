const { Resend } = require("resend");

// ========================================
// RESEND CLIENT
// ========================================

const getResendClient = () => {
  const apiKey =
    process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY_NOT_CONFIGURED"
    );
  }

  return new Resend(apiKey);
};

// ========================================
// SEND EMAIL
// ========================================

const sendEmail = async ({
  to,
  subject,
  html,
}) => {
  if (!to) {
    throw new Error(
      "EMAIL_RECIPIENT_REQUIRED"
    );
  }

  const resend =
    getResendClient();

  const { data, error } =
    await resend.emails.send({
      from:
        "DineFlow <onboarding@resend.dev>",

      to: [to],

      subject,

      html,
    });

  if (error) {
    console.error(
      "Resend email error:",
      error
    );

    throw new Error(
      error.message ||
        "EMAIL_SEND_FAILED"
    );
  }

  return data;
};

// ========================================
// FORMAT DATE / TIME
// ========================================

const formatDateTime = (
  value
) => {
  return new Date(value).toLocaleString(
    "en-IN",
    {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
};

// ========================================
// RESERVATION CONFIRMATION EMAIL
// ========================================

const sendReservationConfirmationEmail =
  async ({
    customer,
    reservation,
  }) => {
    if (!customer?.email) {
      return null;
    }

    return sendEmail({
      to: customer.email,

      subject:
        `DineFlow Reservation #${reservation.id} Confirmed`,

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>DineFlow Reservation Confirmed</h2>

          <p>Hi ${customer.name},</p>

          <p>
            Your table reservation has been
            confirmed successfully.
          </p>

          <h3>Reservation Details</h3>

          <p>
            <strong>Reservation ID:</strong>
            #${reservation.id}
          </p>

          <p>
            <strong>Table:</strong>
            ${reservation.table.number}
          </p>

          <p>
            <strong>Guests:</strong>
            ${reservation.guestCount}
          </p>

          <p>
            <strong>Start:</strong>
            ${formatDateTime(
              reservation.startTime
            )}
          </p>

          <p>
            <strong>End:</strong>
            ${formatDateTime(
              reservation.endTime
            )}
          </p>

          ${
            reservation.specialRequest
              ? `
                <p>
                  <strong>Special Request:</strong>
                  ${reservation.specialRequest}
                </p>
              `
              : ""
          }

          <p>
            Status:
            <strong>CONFIRMED</strong>
          </p>

          <hr />

          <p>
            We look forward to serving you.
          </p>

          <small>
            DineFlow Restaurant Management System
          </small>
        </div>
      `,
    });
  };

// ========================================
// RESERVATION CANCELLATION EMAIL
// ========================================

const sendReservationCancellationEmail =
  async ({
    customer,
    reservation,
  }) => {
    if (!customer?.email) {
      return null;
    }

    return sendEmail({
      to: customer.email,

      subject:
        `DineFlow Reservation #${reservation.id} Cancelled`,

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Reservation Cancelled</h2>

          <p>Hi ${customer.name},</p>

          <p>
            Your DineFlow reservation has been
            cancelled successfully.
          </p>

          <h3>Reservation Details</h3>

          <p>
            <strong>Reservation ID:</strong>
            #${reservation.id}
          </p>

          <p>
            <strong>Table:</strong>
            ${reservation.table.number}
          </p>

          <p>
            <strong>Guests:</strong>
            ${reservation.guestCount}
          </p>

          <p>
            <strong>Scheduled Time:</strong>
            ${formatDateTime(
              reservation.startTime
            )}
          </p>

          <p>
            Status:
            <strong>CANCELLED</strong>
          </p>

          <hr />

          <p>
            You can create another reservation
            anytime through DineFlow.
          </p>

          <small>
            DineFlow Restaurant Management System
          </small>
        </div>
      `,
    });
  };

// ========================================
// PROCUREMENT REVIEW EMAIL
//
// Sent to Inventory Staff after Manager
// approves or rejects a reorder request.
// ========================================

const sendReorderReviewEmail =
  async ({
    recipient,
    reorderRequest,
  }) => {
    if (!recipient?.email) {
      return null;
    }

    const approved =
      reorderRequest.status ===
      "APPROVED";

    const statusText =
      approved
        ? "APPROVED"
        : "REJECTED";

    const statusMessage =
      approved
        ? "Your procurement request has been approved by the Manager and is now awaiting delivery."
        : "Your procurement request has been rejected by the Manager.";

    return sendEmail({
      to: recipient.email,

      subject:
        `DineFlow Reorder #${reorderRequest.id} ${statusText}`,

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>
            Procurement Request ${statusText}
          </h2>

          <p>
            Hi ${recipient.name},
          </p>

          <p>
            ${statusMessage}
          </p>

          <h3>Request Details</h3>

          <p>
            <strong>Request ID:</strong>
            #${reorderRequest.id}
          </p>

          <p>
            <strong>Ingredient:</strong>
            ${reorderRequest.inventoryItem.name}
          </p>

          <p>
            <strong>Quantity:</strong>
            ${reorderRequest.quantity}
            ${reorderRequest.inventoryItem.unit}
          </p>

          ${
            reorderRequest.note
              ? `
                <p>
                  <strong>Request Note:</strong>
                  ${reorderRequest.note}
                </p>
              `
              : ""
          }

          <p>
            <strong>Reviewed By:</strong>
            ${
              reorderRequest.reviewedBy
                ?.name || "Manager"
            }
          </p>

          ${
            reorderRequest.reviewedAt
              ? `
                <p>
                  <strong>Reviewed At:</strong>
                  ${formatDateTime(
                    reorderRequest.reviewedAt
                  )}
                </p>
              `
              : ""
          }

          <p>
            <strong>Status:</strong>
            ${statusText}
          </p>

          ${
            approved
              ? `
                <p>
                  Once the supplier delivery
                  arrives, mark the request as
                  received in the Inventory
                  Dashboard.
                </p>
              `
              : ""
          }

          <hr />

          <small>
            DineFlow Procurement System
          </small>
        </div>
      `,
    });
  };

module.exports = {
  sendEmail,

  sendReservationConfirmationEmail,
  sendReservationCancellationEmail,

  sendReorderReviewEmail,
};