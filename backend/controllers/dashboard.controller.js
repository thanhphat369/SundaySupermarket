const { getPool, sql } = require('../config/database');
const Product = require('../models/Product.model');
const Order = require('../models/Order.model');
const User = require('../models/User.model');

// Get dashboard statistics
exports.getStats = async (req, res) => {
  try {
    const pool = getPool();

    // Get total products
    const productCount = await Product.count({});

    // Get total orders
    const orderResult = await pool.request().query('SELECT COUNT(*) as total FROM [Order]');
    const orderCount = orderResult.recordset[0].total;

    // Get total revenue (sum of all completed orders)
    const revenueResult = await pool.request().query(`
      SELECT SUM(TotalAmount) as total 
      FROM [Order] 
      WHERE Status IN ('completed', 'delivered')
    `);
    const revenue = revenueResult.recordset[0].total || 0;

    // Get total users
    const userResult = await pool.request().query('SELECT COUNT(*) as total FROM [User] WHERE IsActive = 1');
    const userCount = userResult.recordset[0].total;

    // Get pending orders
    const pendingResult = await pool.request().query(`
      SELECT COUNT(*) as total 
      FROM [Order] 
      WHERE Status = 'pending'
    `);
    const pendingOrders = pendingResult.recordset[0].total;

    // Get low stock products (stock < minStock)
    const lowStockResult = await pool.request().query(`
      SELECT COUNT(*) as total 
      FROM Inventory i
      WHERE i.Stock < i.MinStock
    `);
    const lowStockProducts = lowStockResult.recordset[0].total;

    // Get recent orders (last 5)
    const recentOrdersResult = await pool.request().query(`
      SELECT TOP 5
        o.Order_ID,
        o.TotalAmount,
        o.Status,
        o.OrderDate,
        u.Full_Name,
        u.Email
      FROM [Order] o
      INNER JOIN [User] u ON o.User_ID = u.User_ID
      ORDER BY o.OrderDate DESC
    `);
    const recentOrders = recentOrdersResult.recordset.map(o => ({
      _id: o.Order_ID,
      orderNumber: `SS${o.Order_ID}`,
      total: o.TotalAmount,
      status: o.Status,
      createdAt: o.OrderDate,
      customer: {
        fullName: o.Full_Name,
        email: o.Email,
      },
    }));

    // Get orders by status
    const statusResult = await pool.request().query(`
      SELECT 
        Status,
        COUNT(*) as count
      FROM [Order]
      GROUP BY Status
    `);
    const ordersByStatus = statusResult.recordset.reduce((acc, row) => {
      acc[row.Status] = row.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        stats: {
          totalProducts: productCount,
          totalOrders: orderCount,
          totalRevenue: revenue,
          totalUsers: userCount,
          pendingOrders,
          lowStockProducts,
        },
        recentOrders,
        ordersByStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

