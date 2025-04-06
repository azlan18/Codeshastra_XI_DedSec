const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin'); // Adjust path to your Admin model

// Login route for admins
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare plain text password
    if (password !== admin.password) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Return admin data (excluding password)
    const adminData = admin.toObject();
    delete adminData.password;
    res.status(200).json({ message: 'Login successful', admin: adminData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;