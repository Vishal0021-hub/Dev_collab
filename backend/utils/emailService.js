const nodemailer = require("nodemailer");

/**
 * Send an invitation email to a user.
 * @param {string} to - The recipient's email address.
 * @param {string} workspaceName - The name of the workspace they are invited to.
 * @param {string} inviterName - The name of the person who invited them.
 * @param {string} role - The role they are invited as (Admin/Member).
 */
const sendInviteEmail = async (to, workspaceName, inviterName, role) => {
  try {
    // Create a transporter using environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER || "placeholder@example.com",
        pass: process.env.SMTP_PASS || "password",
      },
    });

    const mailOptions = {
      from: `"DevCollab" <${process.env.SMTP_FROM || "no-reply@devcollab.com"}>`,
      to,
      subject: `Invitation to join ${workspaceName} on DevCollab`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">DevCollab</h1>
          </div>
          <div style="padding: 40px; background-color: #fff;">
            <h2 style="color: #1a1a1a; margin-top: 0;">You've been invited!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
              Hello,
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
              <strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace as an <strong>${role}</strong>.
            </p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
                Accept Invitation
              </a>
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: #9ca3af; margin-bottom: 0;">
              If you don't have an account yet, you'll need to create one first using this email address.
            </p>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              &copy; 2026 DevCollab. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    // We don't throw here to prevent the main process from failing, 
    // but in a production app, you might want to log this to a monitoring service.
    return null;
  }
};

module.exports = { sendInviteEmail };
