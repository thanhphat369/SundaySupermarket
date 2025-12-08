const { getPool, sql } = require('../config/database');

class Brand {
  static async findAll() {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT 
        b.*,
        s.Supplier_Name,
        s.PhoneContact as Supplier_Phone,
        s.Address as Supplier_Address
      FROM Brand b
      LEFT JOIN Supplier s ON b.Supplier_ID = s.Supplier_ID
      ORDER BY Brand_Name
    `);
    return result.recordset;
  }

  static async findById(brandId) {
    const pool = getPool();
    const result = await pool.request()
      .input('brandId', sql.Int, brandId)
      .query(`
        SELECT 
          b.*,
          s.Supplier_Name,
          s.PhoneContact as Supplier_Phone,
          s.Address as Supplier_Address
        FROM Brand b
        LEFT JOIN Supplier s ON b.Supplier_ID = s.Supplier_ID
        WHERE b.Brand_ID = @brandId
      `);
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
    const request = pool.request()
      .input('name', sql.NVarChar, brandData.name);
    
    let query = `INSERT INTO Brand (Brand_Name`;
    let values = `VALUES (@name`;
    
    if (brandData.description !== undefined && brandData.description !== null && brandData.description !== '') {
      query += `, Description`;
      values += `, @description`;
      request.input('description', sql.NVarChar, brandData.description);
    }
    
    if (brandData.supplierId !== undefined && brandData.supplierId !== null && brandData.supplierId !== '') {
      query += `, Supplier_ID`;
      values += `, @supplierId`;
      request.input('supplierId', sql.Int, parseInt(brandData.supplierId));
    }
    
    query += `) OUTPUT INSERTED.* ${values})`;
    
    const result = await request.query(query);
    return result.recordset[0];
  }

  static async update(brandId, brandData) {
    const pool = getPool();
    const request = pool.request()
      .input('brandId', sql.Int, brandId)
      .input('name', sql.NVarChar, brandData.name);
    
    let updates = ['Brand_Name = @name'];
    
    if (brandData.description !== undefined) {
      if (brandData.description === null || brandData.description === '') {
        updates.push('Description = NULL');
      } else {
        updates.push('Description = @description');
        request.input('description', sql.NVarChar, brandData.description);
      }
    }
    
    if (brandData.supplierId !== undefined) {
      if (brandData.supplierId === null || brandData.supplierId === '') {
        updates.push('Supplier_ID = NULL');
      } else {
        updates.push('Supplier_ID = @supplierId');
        request.input('supplierId', sql.Int, parseInt(brandData.supplierId));
      }
    }
    
    const result = await request.query(`
      UPDATE Brand
      SET ${updates.join(', ')}
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
