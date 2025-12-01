const { getPool, sql } = require('../config/database');

class ShoppingCart {
  static async findByUserId(userId) {
    const pool = getPool();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          sc.*,
          p.Name as Product_Name,
          p.UnitPrice,
          p.ImageURL,
          i.Stock
        FROM ShoppingCart sc
        INNER JOIN Product p ON sc.Product_ID = p.Product_ID
        LEFT JOIN Inventory i ON sc.Product_ID = i.Product_ID
        WHERE sc.User_ID = @userId
        ORDER BY sc.CreateAt DESC
      `);
    return result.recordset;
  }

  static async addItem(userId, productId, quantity) {
    const pool = getPool();
    
    // Check if item already exists
    const existing = await pool.request()
      .input('userId', sql.Int, userId)
      .input('productId', sql.Int, productId)
      .query('SELECT * FROM ShoppingCart WHERE User_ID = @userId AND Product_ID = @productId');
    
    if (existing.recordset.length > 0) {
      // Update quantity
      const result = await pool.request()
        .input('cartId', sql.Int, existing.recordset[0].Cart_ID)
        .input('quantity', sql.Int, quantity)
        .query(`
          UPDATE ShoppingCart
          SET Quantity = Quantity + @quantity
          OUTPUT INSERTED.*
          WHERE Cart_ID = @cartId
        `);
      return result.recordset[0];
    } else {
      // Insert new item
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('productId', sql.Int, productId)
        .input('quantity', sql.Int, quantity)
        .query(`
          INSERT INTO ShoppingCart (User_ID, Product_ID, Quantity)
          OUTPUT INSERTED.*
          VALUES (@userId, @productId, @quantity)
        `);
      return result.recordset[0];
    }
  }

  static async updateQuantity(cartId, quantity) {
    const pool = getPool();
    const result = await pool.request()
      .input('cartId', sql.Int, cartId)
      .input('quantity', sql.Int, quantity)
      .query(`
        UPDATE ShoppingCart
        SET Quantity = @quantity
        OUTPUT INSERTED.*
        WHERE Cart_ID = @cartId
      `);
    return result.recordset[0] || null;
  }

  static async removeItem(cartId) {
    const pool = getPool();
    await pool.request()
      .input('cartId', sql.Int, cartId)
      .query('DELETE FROM ShoppingCart WHERE Cart_ID = @cartId');
    return true;
  }

  static async clear(userId) {
    const pool = getPool();
    await pool.request()
      .input('userId', sql.Int, userId)
      .query('DELETE FROM ShoppingCart WHERE User_ID = @userId');
    return true;
  }
}

module.exports = ShoppingCart;

