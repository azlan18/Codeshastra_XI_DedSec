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
  const { to, subject, text } = req.body;
  if (!to || !subject || !text) {
    return res.status(400).json({ error: "Missing required fields: to, subject, text" });
  }
  next();
};

// Endpoint to send email to admin
router.post("/to-admin", validateRequest, async (req, res) => {
  const { to, subject, text } = req.body;

  const adminEmail = process.env.GMAIL_EMAIL; // Admin email (your Gmail)

  const mailOptions = {
    from: process.env.GMAIL_EMAIL,
    to,
    subject: subject || "Admin Notification",
    text: text || "This is a notification from the system.",
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
  const { to, subject, text } = req.body;

  const mailOptions = {
    from: process.env.GMAIL_EMAIL,
    to: to, // Employee email provided in the request body
    subject: subject || "Employee Notification",
    text: text || "This is a notification for you.",
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent to employee successfully" });
  } catch (error) {
    console.error("Error sending email to employee:", error);
    res.status(500).json({ error: "Failed to send email to employee" });
  }
});

module.exports = router;