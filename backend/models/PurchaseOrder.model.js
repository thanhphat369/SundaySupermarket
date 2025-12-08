const { getPool, sql } = require('../config/database');

class PurchaseOrder {
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT 
        po.*,
        s.Supplier_Name,
        s.PhoneContact as Supplier_Phone,
        s.Address as Supplier_Address
      FROM PurchaseOrder po
      INNER JOIN Supplier s ON po.Supplier_ID = s.Supplier_ID
      WHERE 1=1
    `;
    
    const request = pool.request();
    
    if (filters.supplierId) {
      query += ' AND po.Supplier_ID = @supplierId';
      request.input('supplierId', sql.Int, filters.supplierId);
    }
    
    if (filters.status) {
      query += ' AND po.Status = @status';
      request.input('status', sql.NVarChar, filters.status);
    }
    
    query += ' ORDER BY po.CreatedAt DESC';
    
    if (filters.limit) {
      query += ' OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
      request.input('offset', sql.Int, ((filters.page || 1) - 1) * filters.limit);
      request.input('limit', sql.Int, filters.limit);
    }

    const result = await request.query(query);
    
    // Get details for each purchase order
    for (let po of result.recordset) {
      po.items = await this.getDetails(po.PO_ID);
    }
    
    return result.recordset;
  }

  static async findById(poId) {
    const pool = getPool();
    const result = await pool.request()
      .input('poId', sql.Int, poId)
      .query(`
        SELECT 
          po.*,
          s.Supplier_Name,
          s.PhoneContact as Supplier_Phone,
          s.Address as Supplier_Address
        FROM PurchaseOrder po
        INNER JOIN Supplier s ON po.Supplier_ID = s.Supplier_ID
        WHERE po.PO_ID = @poId
      `);
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    const po = result.recordset[0];
    po.items = await this.getDetails(po.PO_ID);
    
    return po;
  }

  static async getDetails(poId) {
    const pool = getPool();
    const result = await pool.request()
      .input('poId', sql.Int, poId)
      .query(`
        SELECT 
          pod.*,
          p.Name as Product_Name,
          p.ImageURL as Product_Image,
          p.UnitPrice as Product_Price
        FROM PurchaseOrder_Details pod
        INNER JOIN Product p ON pod.Product_ID = p.Product_ID
        WHERE pod.PO_ID = @poId
        ORDER BY pod.POD_ID
      `);
    
    return result.recordset;
  }

  static async create(poData) {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Calculate total amount
      let totalAmount = 0;
      if (poData.items && poData.items.length > 0) {
        totalAmount = poData.items.reduce((sum, item) => {
          return sum + (item.quantity * item.unitCost);
        }, 0);
      }
      
      // Create purchase order
      const poResult = await transaction.request()
        .input('supplierId', sql.Int, poData.supplierId)
        .input('status', sql.NVarChar, poData.status || 'pending')
        .input('totalAmount', sql.Int, totalAmount)
        .query(`
          INSERT INTO PurchaseOrder (Supplier_ID, Status, TotalAmount)
          OUTPUT INSERTED.*
          VALUES (@supplierId, @status, @totalAmount)
        `);
      
      const po = poResult.recordset[0];
      
      // Create purchase order details
      if (poData.items && poData.items.length > 0) {
        for (const item of poData.items) {
          await transaction.request()
            .input('poId', sql.Int, po.PO_ID)
            .input('productId', sql.Int, item.productId)
            .input('quantity', sql.Int, item.quantity)
            .input('unitCost', sql.Int, item.unitCost)
            .query(`
              INSERT INTO PurchaseOrder_Details (PO_ID, Product_ID, Quantity, UnitCost)
              VALUES (@poId, @productId, @quantity, @unitCost)
            `);
        }
      }
      
      await transaction.commit();
      
      return await this.findById(po.PO_ID);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async update(poId, poData) {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Update purchase order
      const updates = [];
      const request = transaction.request().input('poId', sql.Int, poId);
      
      if (poData.supplierId !== undefined) {
        updates.push('Supplier_ID = @supplierId');
        request.input('supplierId', sql.Int, poData.supplierId);
      }
      if (poData.status !== undefined) {
        updates.push('Status = @status');
        request.input('status', sql.NVarChar, poData.status);
      }
      
      if (updates.length > 0) {
        await request.query(`
          UPDATE PurchaseOrder
          SET ${updates.join(', ')}
          WHERE PO_ID = @poId
        `);
      }
      
      // Update details if provided
      if (poData.items && poData.items.length > 0) {
        // Delete existing details
        await transaction.request()
          .input('poId', sql.Int, poId)
          .query('DELETE FROM PurchaseOrder_Details WHERE PO_ID = @poId');
        
        // Calculate new total
        let totalAmount = poData.items.reduce((sum, item) => {
          return sum + (item.quantity * item.unitCost);
        }, 0);
        
        // Insert new details
        for (const item of poData.items) {
          await transaction.request()
            .input('poId', sql.Int, poId)
            .input('productId', sql.Int, item.productId)
            .input('quantity', sql.Int, item.quantity)
            .input('unitCost', sql.Int, item.unitCost)
            .query(`
              INSERT INTO PurchaseOrder_Details (PO_ID, Product_ID, Quantity, UnitCost)
              VALUES (@poId, @productId, @quantity, @unitCost)
            `);
        }
        
        // Update total amount
        await transaction.request()
          .input('poId', sql.Int, poId)
          .input('totalAmount', sql.Int, totalAmount)
          .query(`
            UPDATE PurchaseOrder
            SET TotalAmount = @totalAmount
            WHERE PO_ID = @poId
          `);
      }
      
      await transaction.commit();
      
      return await this.findById(poId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async delete(poId) {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Delete details first
      await transaction.request()
        .input('poId', sql.Int, poId)
        .query('DELETE FROM PurchaseOrder_Details WHERE PO_ID = @poId');
      
      // Delete purchase order
      await transaction.request()
        .input('poId', sql.Int, poId)
        .query('DELETE FROM PurchaseOrder WHERE PO_ID = @poId');
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async count(filters = {}) {
    const pool = getPool();
    let query = 'SELECT COUNT(*) as total FROM PurchaseOrder WHERE 1=1';
    const request = pool.request();
    
    if (filters.supplierId) {
      query += ' AND Supplier_ID = @supplierId';
      request.input('supplierId', sql.Int, filters.supplierId);
    }
    
    if (filters.status) {
      query += ' AND Status = @status';
      request.input('status', sql.NVarChar, filters.status);
    }
    
    const result = await request.query(query);
    return result.recordset[0].total;
  }
}

module.exports = PurchaseOrder;
