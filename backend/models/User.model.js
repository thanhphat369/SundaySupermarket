const { getPool, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Get user by ID
  static async findById(userId) {
    const pool = getPool();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT u.*, r.Role_Name as Role
        FROM [User] u
        INNER JOIN Role r ON u.Role_ID = r.Role_ID
        WHERE u.User_ID = @userId AND u.IsActive = 1
      `);
    return result.recordset[0] || null;
  }

  // Get user by email
  static async findByEmail(email) {
    const pool = getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT u.*, r.Role_Name as Role
        FROM [User] u
        INNER JOIN Role r ON u.Role_ID = r.Role_ID
        WHERE u.Email = @email AND u.IsActive = 1
      `);
    return result.recordset[0] || null;
  }

  // Get user by username
  static async findByUsername(username) {
    const pool = getPool();
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query(`
        SELECT u.*, r.Role_Name as Role
        FROM [User] u
        INNER JOIN Role r ON u.Role_ID = r.Role_ID
        WHERE u.User_Name = @username AND u.IsActive = 1
      `);
    return result.recordset[0] || null;
  }

  // Get user with password (for login)
  static async findByEmailWithPassword(email) {
    const pool = getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT u.*, r.Role_Name as Role
        FROM [User] u
        INNER JOIN Role r ON u.Role_ID = r.Role_ID
        WHERE u.Email = @email AND u.IsActive = 1
      `);
    return result.recordset[0] || null;
  }

  // Create user
  static async create(userData) {
    const pool = getPool();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Get Role_ID by role name
    const roleResult = await pool.request()
      .input('roleName', sql.NVarChar, userData.role || 'Customer')
      .query('SELECT Role_ID FROM Role WHERE Role_Name = @roleName');
    
    if (roleResult.recordset.length === 0) {
      throw new Error('Role not found');
    }
    
    const roleId = roleResult.recordset[0].Role_ID;

    const result = await pool.request()
      .input('userName', sql.NVarChar, userData.username)
      .input('password', sql.NVarChar, hashedPassword)
      .input('fullName', sql.NVarChar, userData.fullName)
      .input('email', sql.NVarChar, userData.email)
      .input('phone', sql.NVarChar, userData.phone || null)
      .input('address', sql.NVarChar, userData.address || null)
      .input('avatar', sql.NVarChar, userData.avatar || null)
      .input('roleId', sql.Int, roleId)
      .query(`
        INSERT INTO [User] (User_Name, Password, Full_Name, Email, Phone, Address, Avatar, Role_ID)
        OUTPUT INSERTED.*
        VALUES (@userName, @password, @fullName, @email, @phone, @address, @avatar, @roleId)
      `);

    const user = result.recordset[0];
    // Get role name
    const roleResult2 = await pool.request()
      .input('roleId', sql.Int, roleId)
      .query('SELECT Role_Name FROM Role WHERE Role_ID = @roleId');
    
    user.Role = roleResult2.recordset[0].Role_Name;
    return user;
  }

  // Update user
  static async update(userId, userData) {
    const pool = getPool();
    const updates = [];
    const request = pool.request().input('userId', sql.Int, userId);

    if (userData.fullName) {
      updates.push('Full_Name = @fullName');
      request.input('fullName', sql.NVarChar, userData.fullName);
    }
    if (userData.phone !== undefined) {
      updates.push('Phone = @phone');
      request.input('phone', sql.NVarChar, userData.phone);
    }
    if (userData.address !== undefined) {
      updates.push('Address = @address');
      request.input('address', sql.NVarChar, userData.address);
    }
    if (userData.avatar !== undefined) {
      updates.push('Avatar = @avatar');
      request.input('avatar', sql.NVarChar, userData.avatar);
    }
    if (userData.isActive !== undefined) {
      updates.push('IsActive = @isActive');
      request.input('isActive', sql.Bit, userData.isActive);
    }

    if (updates.length === 0) {
      return await this.findById(userId);
    }

    const result = await request.query(`
      UPDATE [User]
      SET ${updates.join(', ')}
      OUTPUT INSERTED.*
      WHERE User_ID = @userId
    `);

    return result.recordset[0] || null;
  }

  // Delete user (soft delete)
  static async delete(userId) {
    const pool = getPool();
    await pool.request()
      .input('userId', sql.Int, userId)
      .query('UPDATE [User] SET IsActive = 0 WHERE User_ID = @userId');
    return true;
  }

  // Get all users
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT u.*, r.Role_Name as Role
      FROM [User] u
      INNER JOIN Role r ON u.Role_ID = r.Role_ID
      WHERE 1=1
    `;
    
    const request = pool.request();
    
    if (filters.role) {
      query += ' AND r.Role_Name = @role';
      request.input('role', sql.NVarChar, filters.role);
    }
    
    if (filters.search) {
      query += ' AND (u.User_Name LIKE @search OR u.Email LIKE @search OR u.Full_Name LIKE @search)';
      request.input('search', sql.NVarChar, `%${filters.search}%`);
    }
    
    query += ' ORDER BY u.User_ID DESC';
    
    if (filters.limit) {
      query += ' OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
      request.input('offset', sql.Int, (filters.page - 1) * filters.limit || 0);
      request.input('limit', sql.Int, filters.limit);
    }

    const result = await request.query(query);
    return result.recordset;
  }

  // Compare password
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
