const { getPool, sql } = require('../config/database');

class Category {
  static async findAll() {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT * FROM Category
      ORDER BY Category_Name
    `);
    return result.recordset;
  }

  static async findById(categoryId) {
    const pool = getPool();
    const result = await pool.request()
      .input('categoryId', sql.Int, categoryId)
      .query('SELECT * FROM Category WHERE Category_ID = @categoryId');
    return result.recordset[0] || null;
  }

  static async findByName(name) {
    const pool = getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .query('SELECT * FROM Category WHERE Category_Name = @name');
    return result.recordset[0] || null;
  }

  static async create(categoryData) {
    const pool = getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar, categoryData.name)
      .query(`
        INSERT INTO Category (Category_Name)
        OUTPUT INSERTED.*
        VALUES (@name)
      `);
    return result.recordset[0];
  }

  static async update(categoryId, categoryData) {
    const pool = getPool();
    const result = await pool.request()
      .input('categoryId', sql.Int, categoryId)
      .input('name', sql.NVarChar, categoryData.name)
      .query(`
        UPDATE Category
        SET Category_Name = @name
        OUTPUT INSERTED.*
        WHERE Category_ID = @categoryId
      `);
    return result.recordset[0] || null;
  }

  static async delete(categoryId) {
    const pool = getPool();
    await pool.request()
      .input('categoryId', sql.Int, categoryId)
      .query('DELETE FROM Category WHERE Category_ID = @categoryId');
    return true;
  }
}

module.exports = Category;
