const nodemailer = require("nodemailer");
const mailConfig = require("../config/mail");

if (!mailConfig.auth.user || !mailConfig.auth.pass) {
  throw new Error("Email credentials are not configured. Please check your environment variables.");
}

const transporter = nodemailer.createTransport(mailConfig);

const sendMail = async (to, subject, text, html) => {
  const mailOptions = {
    from: mailConfig.auth.user,
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Error sending email");
  }
};

module.exports = {
  sendMail,
};
