const { connectDB, closeDB } = require('../config/database');
const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/database');
const dotenv = require('dotenv');

dotenv.config();

const hashAllPasswords = async () => {
  try {
    await connectDB();
    console.log('Connected to SQL Server');

    const pool = getPool();
    
    // Get all users
    const result = await pool.request().query(`
      SELECT User_ID, Email, Password 
      FROM [User] 
      WHERE IsActive = 1
    `);

    console.log(`Found ${result.recordset.length} active users`);
    
    let updatedCount = 0;
    
    for (const user of result.recordset) {
      const currentPassword = user.Password;
      
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      const isHashed = currentPassword && (
        currentPassword.startsWith('$2a$') || 
        currentPassword.startsWith('$2b$') || 
        currentPassword.startsWith('$2y$')
      );
      
      if (!isHashed) {
        // Hash the plain text password
        const hashedPassword = await bcrypt.hash(currentPassword, 10);
        
        // Update password in database
        await pool.request()
          .input('userId', sql.Int, user.User_ID)
          .input('hashedPassword', sql.NVarChar, hashedPassword)
          .query(`
            UPDATE [User]
            SET Password = @hashedPassword
            WHERE User_ID = @userId
          `);
        
        console.log(`✓ Updated password for user ID ${user.User_ID} (${user.Email || 'N/A'})`);
        updatedCount++;
      } else {
        console.log(`- User ID ${user.User_ID} (${user.Email || 'N/A'}) already has hashed password`);
      }
    }

    console.log(`\nCompleted! Updated ${updatedCount} password(s).`);
    console.log('All passwords are now hashed with bcrypt.');

    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('Error hashing passwords:', error);
    await closeDB();
    process.exit(1);
  }
};

hashAllPasswords();

