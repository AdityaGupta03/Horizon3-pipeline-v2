import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Extract database connection details from environment variables
const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS } = process.env;

const transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: MAIL_PORT,
  secure: false,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

/**
 * Sends an email to a specified user.
 *
 * @param {string} userEmail - The email address of the recipient.
 * @param {string} email_subject - The subject line of the email.
 * @param {string} email_body - The content of the email.
 * @returns {Promise<object>} A promise that resolves with the mailer status.
 * @throws {Error} If there's an error sending the email.
 */
async function emailUser(userEmail, email_subject, email_body) {
  console.log(`Sending email to: ${userEmail}`);

  // Sent email
  const mailer_status = await transporter.sendMail({
    from: MAIL_USER,
    to: userEmail,
    subject: email_subject,
    text: email_body,
  });

  if (!mailer_status) {
    throw new Error(`Error sending email to ${userEmail}`);
  } else {
    return mailer_status;
  }
}

export { emailUser };
