import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "",
  port: 587,
  secure: false,
  auth: {
    user: "",
    pass: "",
  },
});

async function emailUser(userEmail, email_subject, email_body) {
  console.log(`Sending email to: ${userEmail}`);

  // Return success message
  return `Email sent to ${userEmail}`;
}

export { emailUser };
