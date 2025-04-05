const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();
require("dotenv").config();

// Configure transporter for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD, // Use App Password generated for Gmail
  },
});

// Middleware to validate request body
const validateRequest = (req, res, next) => {
  const { to, subject, text, empId, decision } = req.body; // Added empId and decision
  if (!to || !subject || !text) {
    return res.status(400).json({ error: "Missing required fields: to, subject, text" });
  }
  next();
};

// Function to generate HTML email content
const generateAdminEmailHTML = (empId, message) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Notification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
      }
      .container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        background-color: #4a90e2;
        color: white;
        padding: 10px;
        text-align: center;
        border-radius: 8px 8px 0 0;
      }
      .content {
        padding: 20px;
        color: #333333;
      }
      .emp-id {
        font-weight: bold;
        color: #2ecc71;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #777777;
        padding: 10px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>Admin Notification</h2>
      </div>
      <div class="content">
        <p>Hello Admin,</p>
        <p>A new request has been logged with the following details:</p>
        <p><strong>Employee ID:</strong> <span class="emp-id">${empId}</span></p>
        <p><strong>Message:</strong> ${message}</p>
        <p>Please take appropriate action.</p>
      </div>
      <div class="footer">
        <p>&copy; 2025 Your Company. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

const generateEmployeeEmailHTML = decision => {
  const title = decision === "Accepted" ? "Request Accepted" : "Request Rejected";
  const message =
    decision === "Accepted"
      ? "Your request has been approved. You may now proceed."
      : "Your request has been denied. Please contact the admin for more details.";
  const color = decision === "Accepted" ? "#2ecc71" : "#e74c3c";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: ${color};
          color: white;
          padding: 10px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          padding: 20px;
          color: #333333;
        }
        .decision {
          font-weight: bold;
          font-size: 18px;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #777777;
          padding: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${title}</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p class="decision">${message}</p>
          <p>If you have any questions, please contact the admin.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Endpoint to send email to admin
router.post("/to-admin", validateRequest, async (req, res) => {
  const { to, subject, text, empId } = req.body;

  const mailOptions = {
    from: process.env.GMAIL_EMAIL,
    to, // Admin email (same as sender)
    subject: subject || "Admin Notification",
    html: generateAdminEmailHTML(empId, text || "This is a notification from the system."),
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent to admin successfully" });
  } catch (error) {
    console.error("Error sending email to admin:", error);
    res.status(500).json({ error: "Failed to send email to admin" });
  }
});

// Endpoint to send email to employee
router.post("/to-employee", validateRequest, async (req, res) => {
  const { to, subject, text, decision } = req.body;
  if (!decision || !["Accepted", "Rejected"].includes(decision)) {
    return res.status(400).json({ error: "Decision must be 'Accepted' or 'Rejected'" });
  }

  const mailOptions = {
    from: process.env.GMAIL_EMAIL,
    to: to,
    subject: subject || `${decision} Notification`,
    html: generateEmployeeEmailHTML(decision),
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: `Email sent to employee (${decision} successfully)` });
  } catch (error) {
    console.error("Error sending email to employee:", error);
    res.status(500).json({ error: "Failed to send email to employee" });
  }
});

module.exports = router;