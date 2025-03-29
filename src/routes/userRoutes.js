const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../../../shared/middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, dob, contact } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      user = new User({
        name,
        email,
        password: hashedPassword,
        dob: dob ? new Date(dob) : null,
        contact
      });

      await user.save();

      // Generate token
      const token = user.generateAuthToken();
      
      // Send response with sanitized user data
      const userData = {
        id: user._id,
        name: user.name,
        email: user.email
      };

      return res.status(201).json({
        success: true,
        token,
        user: userData
      });

    } catch (error) {
      console.error('User creation error:', error);
      return res.status(500).json({ 
        message: 'Error creating user account',
        error: error.message 
      });
    }

  } catch (error) {
    console.error('Registration route error:', error);
    return res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.generateAuthToken();
    console.log('Generated token:', token);

    // Send response with sanitized user data
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email
    };

    res.json({
      success: true,
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get user profile
router.get('/profile', auth(), async (req, res) => {
  console.log('profile is being hit....');
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      name: user.name,
      email: user.email,
      contact: user.contact,
      dob: user.dob
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

// Update user profile
router.put('/profile', auth(), async (req, res) => {
  try {
    const { name, email } = req.body; // Changed to expect name and email
    
    // Find user and update
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update name if provided
    if (name) {
      user.name = name;
    }

    // If email is being changed, check if new email already exists
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    await user.save();

    // Send response with updated user data
    res.json({
      name: user.name,
      email: user.email,
      contact: user.contact,
      dob: user.dob
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

module.exports = router;
