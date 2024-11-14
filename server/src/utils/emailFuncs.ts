import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Extract database connection details from environment variables
const { MAIL_USER, MAIL_PASS } = process.env;

const transporter = nodemailer.createTransport({
  service: "gmail",
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
 * @returns {Promise<boolean>} A promise that resolves with the mailer status.
 * @throws {Error} If there's an error sending the email.
 */
async function emailUser(
  userEmail: string,
  email_subject: string,
  email_body: string,
): Promise<boolean> {
  console.log(`Sending email to: ${userEmail}`);

  // Sent email
  const mailer_status = await transporter.sendMail({
    from: "h3.pipeline.poc@gmail.com",
    to: userEmail,
    subject: email_subject,
    text: email_body,
  });

  if (!mailer_status) {
    throw new Error(`Error sending email to ${userEmail}`);
  } else {
    return true;
  }
}

export { emailUser };
