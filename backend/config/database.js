const sql = require('mssql');
const dotenv = require('dotenv');

dotenv.config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'sa',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'SundaySupermarket',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Use this if you're on Windows Azure
    trustServerCertificate: true, // Use this if you're on Windows Azure
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

const connectDB = async () => {
  try {
    if (pool) {
      return pool;
    }
    
    pool = await sql.connect(config);
    console.log('SQL Server connected successfully');
    return pool;
  } catch (error) {
    console.error('SQL Server connection error:', error);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database connection not initialized. Call connectDB() first.');
  }
  return pool;
};

const closeDB = async () => {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('SQL Server connection closed');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

module.exports = {
  connectDB,
  getPool,
  closeDB,
  sql,
};
