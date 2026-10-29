const {
  sendEmail,
} = require(
  "../services/notificationService"
);

// ========================================
// TEST EMAIL
//
// Development endpoint used only to verify
// DineFlow -> Resend -> Email integration.
// ========================================

const sendTestEmail = async (
  req,
  res
) => {
  try {
    const { email } =
      req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Email address is required",
      });
    }

    const result =
      await sendEmail({
        to: email,

        subject:
          "DineFlow Email Integration Test",

        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>DineFlow</h2>

            <p>
              Your DineFlow email notification
              integration is working successfully.
            </p>

            <p>
              This email was sent from the
              DineFlow Node.js backend using
              the Resend API.
            </p>

            <hr />

            <small>
              DineFlow Restaurant Management
              System
            </small>
          </div>
        `,
      });

    return res.status(200).json({
      success: true,

      message:
        "Test email sent successfully",

      emailId:
        result?.id || null,
    });
  } catch (error) {
    console.error(
      "Test email error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to send test email",
    });
  }
};

module.exports = {
  sendTestEmail,
};