const { connectDB, closeDB } = require('../config/database');
const User = require('../models/User.model');
const dotenv = require('dotenv');

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();
    console.log('Connected to SQL Server');

    // Check if admin exists
    const existingAdmin = await User.findByEmail('admin@sunday.com');
    if (existingAdmin) {
      console.log('Admin user already exists');
      await closeDB();
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@sunday.com',
      password: 'admin123',
      fullName: 'Quản trị viên',
      phone: '0123456789',
      role: 'Admin',
      address: JSON.stringify({
        street: '01 Lý Tự Trọng',
        ward: 'Ninh Kiều',
        district: 'Ninh Kiều',
        city: 'Cần Thơ',
      }),
    });

    console.log('Admin user created successfully:');
    console.log('Email: admin@sunday.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login!');

    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    await closeDB();
    process.exit(1);
  }
};

seedAdmin();
