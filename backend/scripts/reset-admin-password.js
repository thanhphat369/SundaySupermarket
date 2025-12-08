const { connectDB, closeDB } = require('../config/database');
const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/database');
const dotenv = require('dotenv');

dotenv.config();

const resetAdminPassword = async () => {
  try {
    await connectDB();
    console.log('Connected to SQL Server');

    // Find user by email
    const user = await User.findByEmail('admin@gmail.com');
    if (!user) {
      console.log('User with email admin@gmail.com not found');
      await closeDB();
      process.exit(1);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash('123', 10);

    // Update password directly in database
    const pool = getPool();
    await pool.request()
      .input('email', sql.NVarChar, 'admin@gmail.com')
      .input('password', sql.NVarChar, hashedPassword)
      .query(`
        UPDATE [User]
        SET Password = @password
        WHERE Email = @email
      `);

    console.log('Password reset successfully!');
    console.log('Email: admin@gmail.com');
    console.log('New Password: 123');
    console.log('Please change the password after first login!');

    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    await closeDB();
    process.exit(1);
  }
};

resetAdminPassword();

