const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust path to your User model

// Login route for users
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare plain text password
    if (password !== user.password) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Return user data (excluding password)
    const userData = user.toObject();
    delete userData.password;
    res.status(200).json({ message: 'Login successful', user: userData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;