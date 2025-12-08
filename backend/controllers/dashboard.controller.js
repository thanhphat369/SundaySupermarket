const { getPool, sql } = require('../config/database');
const Product = require('../models/Product.model');
const Order = require('../models/Order.model');
const User = require('../models/User.model');

// Get dashboard statistics
exports.getStats = async (req, res) => {
  try {
    const pool = getPool();
    const { month, year } = req.query;
    
    // Build date filter for month/year
    let dateFilter = '';
    if (month && year) {
      const monthInt = parseInt(month);
      const yearInt = parseInt(year);
      const startDate = `${yearInt}-${month.padStart(2, '0')}-01`;
      // Get last day of month: new Date(year, month, 0) gives last day of previous month
      // So new Date(year, month+1, 0) gives last day of current month
      const lastDay = new Date(yearInt, monthInt, 0).getDate();
      const endDate = `${yearInt}-${month.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      dateFilter = `AND o.OrderDate >= '${startDate}' AND o.OrderDate <= '${endDate} 23:59:59'`;
    }

    // Get total products (not filtered by month)
    const productCount = await Product.count({});

    // Get total orders (filtered by month if provided)
    let orderQuery = 'SELECT COUNT(*) as total FROM [Order] o WHERE 1=1';
    if (dateFilter) {
      orderQuery = orderQuery.replace('FROM [Order] o', 'FROM [Order] o');
      orderQuery += ` ${dateFilter.replace('o.', 'o.')}`;
    }
    const orderResult = await pool.request().query(orderQuery);
    const orderCount = orderResult.recordset[0].total;

    // Get total revenue (sum of all completed orders, filtered by month)
    let revenueQuery = `
      SELECT SUM(TotalAmount) as total 
      FROM [Order] o
      WHERE Status IN ('completed', 'delivered')
    `;
    if (dateFilter) {
      revenueQuery += ` ${dateFilter}`;
    }
    const revenueResult = await pool.request().query(revenueQuery);
    const revenue = revenueResult.recordset[0].total || 0;

    // Get total users (not filtered by month)
    const userResult = await pool.request().query('SELECT COUNT(*) as total FROM [User] WHERE IsActive = 1');
    const userCount = userResult.recordset[0].total;

    // Get pending orders (filtered by month)
    let pendingQuery = `
      SELECT COUNT(*) as total 
      FROM [Order] o
      WHERE Status = 'pending'
    `;
    if (dateFilter) {
      pendingQuery += ` ${dateFilter}`;
    }
    const pendingResult = await pool.request().query(pendingQuery);
    const pendingOrders = pendingResult.recordset[0].total;

    // Get low stock products (not filtered by month)
    const lowStockResult = await pool.request().query(`
      SELECT COUNT(*) as total 
      FROM Inventory i
      WHERE i.Stock < i.MinStock
    `);
    const lowStockProducts = lowStockResult.recordset[0].total;

    // Get recent orders (last 5, filtered by month)
    let recentOrdersQuery = `
      SELECT TOP 5
        o.Order_ID,
        o.TotalAmount,
        o.Status,
        o.OrderDate,
        u.Full_Name,
        u.Email
      FROM [Order] o
      INNER JOIN [User] u ON o.User_ID = u.User_ID
      WHERE 1=1
    `;
    if (dateFilter) {
      recentOrdersQuery += ` ${dateFilter}`;
    }
    recentOrdersQuery += ` ORDER BY o.OrderDate DESC`;
    const recentOrdersResult = await pool.request().query(recentOrdersQuery);
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

    // Get orders by status (filtered by month)
    let statusQuery = `
      SELECT 
        Status,
        COUNT(*) as count
      FROM [Order] o
      WHERE 1=1
    `;
    if (dateFilter) {
      statusQuery += ` ${dateFilter}`;
    }
    statusQuery += ` GROUP BY Status`;
    const statusResult = await pool.request().query(statusQuery);
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

