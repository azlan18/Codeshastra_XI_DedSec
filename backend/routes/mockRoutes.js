const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Admin = require("../models/Admin");

// POST route to add mock User and Admin data
router.post("/addMock", async (req, res) => {
  const { user, admin } = req.body;

  try {
    // Create and save User if provided
    let savedUser = null;
    if (user) {
      const newUser = new User(user);
      savedUser = await newUser.save();
    }

    // Create and save Admin if provided
    let savedAdmin = null;
    if (admin) {
      const newAdmin = new Admin(admin);
      savedAdmin = await newAdmin.save();
    }

    res.status(201).json({
      message: "Mock data added successfully",
      user: savedUser,
      admin: savedAdmin
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;