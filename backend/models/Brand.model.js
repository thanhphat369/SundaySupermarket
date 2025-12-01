const { getPool, sql } = require('../config/database');

class Brand {
  static async findAll() {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT * FROM Brand
      ORDER BY Brand_Name
    `);
    return result.recordset;
  }

  static async findById(brandId) {
    const pool = getPool();
    const result = await pool.request()
      .input('brandId', sql.Int, brandId)
      .query('SELECT * FROM Brand WHERE Brand_ID = @brandId');
    return result.recordset[0] || null;
  }

  static async findByName(name) {
    const pool = getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .query('SELECT * FROM Brand WHERE Brand_Name = @name');
    return result.recordset[0] || null;
  }

  static async create(brandData) {
    const pool = getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar, brandData.name)
      .query(`
        INSERT INTO Brand (Brand_Name)
        OUTPUT INSERTED.*
        VALUES (@name)
      `);
    return result.recordset[0];
  }

  static async update(brandId, brandData) {
    const pool = getPool();
    const result = await pool.request()
      .input('brandId', sql.Int, brandId)
      .input('name', sql.NVarChar, brandData.name)
      .query(`
        UPDATE Brand
        SET Brand_Name = @name
        OUTPUT INSERTED.*
        WHERE Brand_ID = @brandId
      `);
    return result.recordset[0] || null;
  }

  static async delete(brandId) {
    const pool = getPool();
    await pool.request()
      .input('brandId', sql.Int, brandId)
      .query('DELETE FROM Brand WHERE Brand_ID = @brandId');
    return true;
  }
}

module.exports = Brand;
