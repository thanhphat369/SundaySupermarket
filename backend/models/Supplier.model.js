const { getPool, sql } = require('../config/database');

class Supplier {
  static async findAll() {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT * FROM Supplier
      ORDER BY Supplier_Name
    `);
    return result.recordset;
  }

  static async findById(supplierId) {
    const pool = getPool();
    const result = await pool.request()
      .input('supplierId', sql.Int, supplierId)
      .query('SELECT * FROM Supplier WHERE Supplier_ID = @supplierId');
    return result.recordset[0] || null;
  }

  static async create(supplierData) {
    const pool = getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar, supplierData.name)
      .input('phone', sql.NVarChar, supplierData.phone || null)
      .input('address', sql.NVarChar, supplierData.address || null)
      .query(`
        INSERT INTO Supplier (Supplier_Name, PhoneContact, Address)
        OUTPUT INSERTED.*
        VALUES (@name, @phone, @address)
      `);
    return result.recordset[0];
  }

  static async update(supplierId, supplierData) {
    const pool = getPool();
    const updates = [];
    const request = pool.request().input('supplierId', sql.Int, supplierId);

    if (supplierData.name) {
      updates.push('Supplier_Name = @name');
      request.input('name', sql.NVarChar, supplierData.name);
    }
    if (supplierData.phone !== undefined) {
      updates.push('PhoneContact = @phone');
      request.input('phone', sql.NVarChar, supplierData.phone || null);
    }
    if (supplierData.address !== undefined) {
      updates.push('Address = @address');
      request.input('address', sql.NVarChar, supplierData.address || null);
    }

    if (updates.length > 0) {
      const result = await request.query(`
        UPDATE Supplier
        SET ${updates.join(', ')}
        OUTPUT INSERTED.*
        WHERE Supplier_ID = @supplierId
      `);
      return result.recordset[0] || null;
    }

    return await this.findById(supplierId);
  }

  static async delete(supplierId) {
    const pool = getPool();
    // Check if supplier is used in transactions
    const checkResult = await pool.request()
      .input('supplierId', sql.Int, supplierId)
      .query('SELECT COUNT(*) as count FROM Stock_Transactions WHERE Supplier_ID = @supplierId');
    
    if (checkResult.recordset[0].count > 0) {
      throw new Error('Không thể xóa nhà cung cấp đã được sử dụng trong giao dịch');
    }

    await pool.request()
      .input('supplierId', sql.Int, supplierId)
      .query('DELETE FROM Supplier WHERE Supplier_ID = @supplierId');
    return true;
  }
}

module.exports = Supplier;
