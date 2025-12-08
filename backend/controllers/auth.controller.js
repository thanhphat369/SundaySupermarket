const User = require('../models/User.model');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Register
exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName, phone, address } = req.body;

    // Check if user exists
    const existingByEmail = await User.findByEmail(email);
    const existingByUsername = await User.findByUsername(username);

    if (existingByEmail || existingByUsername) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username',
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      phone,
      address: address ? JSON.stringify(address) : null,
      role: 'Customer',
    });

    const token = generateToken(user.User_ID);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.User_ID,
          username: user.User_Name,
          email: user.Email,
          fullName: user.Full_Name,
          role: user.Role?.toLowerCase() || user.Role, // Normalize role to lowercase
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user
    const user = await User.findByEmailWithPassword(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or inactive account',
      });
    }

    // Check password
    const isPasswordMatch = await User.comparePassword(password, user.Password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user.User_ID);

    // Safely parse address
    let parsedAddress = null;
    if (user.Address) {
      if (typeof user.Address === 'string') {
        try {
          parsedAddress = JSON.parse(user.Address);
        } catch (e) {
          // If not valid JSON, treat as plain string
          parsedAddress = user.Address;
        }
      } else {
        parsedAddress = user.Address;
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.User_ID,
          username: user.User_Name,
          email: user.Email,
          fullName: user.Full_Name,
          phone: user.Phone,
          address: parsedAddress,
          avatar: user.Avatar,
          role: user.Role?.toLowerCase() || user.Role, // Normalize role to lowercase
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.User_ID);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Safely parse address
    let parsedAddress = null;
    if (user.Address) {
      if (typeof user.Address === 'string') {
        try {
          parsedAddress = JSON.parse(user.Address);
        } catch (e) {
          // If not valid JSON, treat as plain string
          parsedAddress = user.Address;
        }
      } else {
        parsedAddress = user.Address;
      }
    }

    // Normalize role to lowercase and format user data
    const normalizedUser = {
      id: user.User_ID,
      username: user.User_Name,
      email: user.Email,
      fullName: user.Full_Name,
      phone: user.Phone,
      address: parsedAddress,
      avatar: user.Avatar,
      role: user.Role?.toLowerCase() || user.Role,
      isActive: user.IsActive,
    };

    res.json({
      success: true,
      data: { user: normalizedUser },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone, address } = req.body;
    const userId = req.user.User_ID;

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (address) updateData.address = JSON.stringify(address);

    // Handle uploaded avatar
    if (req.file) {
      updateData.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    const user = await User.update(userId, updateData);

    // Normalize role to lowercase
    const normalizedUser = {
      ...user,
      role: user.Role?.toLowerCase() || user.Role,
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: normalizedUser },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
