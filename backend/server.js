const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('./config/database');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const brandRoutes = require('./routes/brand.routes');
const orderRoutes = require('./routes/order.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const reviewRoutes = require('./routes/review.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const supplierRoutes = require('./routes/supplier.routes');
const purchaseOrderRoutes = require('./routes/purchaseorder.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
connectDB()
  .then(() => console.log('SQL Server connected successfully'))
  .catch((err) => console.error('SQL Server connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sunday Supermarket API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : {} 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Scheduled tasks - Auto cleanup unused images daily
const cleanupUnusedImages = require('./scripts/cleanup-unused-images');

// Run cleanup once on startup (optional)
// cleanupUnusedImages().catch(err => console.error('Initial cleanup error:', err));

// Schedule daily cleanup at 2 AM
const scheduleDailyCleanup = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(2, 0, 0, 0); // 2 AM
  
  const msUntilCleanup = tomorrow.getTime() - now.getTime();
  
  setTimeout(() => {
    console.log('🧹 Running scheduled image cleanup...');
    cleanupUnusedImages()
      .then(result => {
        console.log(`✅ Scheduled cleanup completed: Deleted ${result.deleted} files`);
      })
      .catch(err => {
        console.error('❌ Scheduled cleanup error:', err);
      });
    
    // Schedule next cleanup (24 hours later)
    setInterval(() => {
      console.log('🧹 Running scheduled image cleanup...');
      cleanupUnusedImages()
        .then(result => {
          console.log(`✅ Scheduled cleanup completed: Deleted ${result.deleted} files`);
        })
        .catch(err => {
          console.error('❌ Scheduled cleanup error:', err);
        });
    }, 24 * 60 * 60 * 1000); // 24 hours
  }, msUntilCleanup);
  
  console.log(`📅 Scheduled daily image cleanup at 2 AM (in ${Math.round(msUntilCleanup / (1000 * 60 * 60))} hours)`);
};

// Start scheduled cleanup
scheduleDailyCleanup();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

