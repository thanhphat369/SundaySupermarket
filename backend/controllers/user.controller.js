const User = require('../models/User.model');

// Get all users (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    if (role) filters.role = role;
    if (search) filters.search = search;

    const users = await User.findAll(filters);

    res.json({
      success: true,
      data: {
        users: users.map(u => ({
          _id: u.User_ID,
          username: u.User_Name,
          email: u.Email,
          fullName: u.Full_Name,
          phone: u.Phone,
          avatar: u.Avatar,
          role: u.Role?.toLowerCase() || u.Role, // Normalize role to lowercase
          isActive: u.IsActive,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: users.length,
          pages: Math.ceil(users.length / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Normalize role to lowercase
    const normalizedUser = {
      ...user,
      role: user.Role?.toLowerCase() || user.Role,
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

// Create user (Admin only)
exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);

    // Normalize role to lowercase
    const normalizedUser = {
      ...user,
      role: user.Role?.toLowerCase() || user.Role,
    };

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: normalizedUser },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const user = await User.update(req.params.id, req.body);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // User.findById already joins with Role table, so user.Role should already be set

    // Normalize role to lowercase and format user data
    const normalizedUser = {
      id: user.User_ID,
      _id: user.User_ID,
      username: user.User_Name,
      email: user.Email,
      fullName: user.Full_Name,
      phone: user.Phone,
      avatar: user.Avatar,
      role: user.Role?.toLowerCase() || user.Role,
      isActive: user.IsActive,
    };

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: normalizedUser },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    await User.delete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
