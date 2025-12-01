const { getPool, sql } = require('../config/database');

// Using Stock_Transactions table
class InventoryTransaction {
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT 
        st.*,
        p.Name as Product_Name,
        p.ImageURL as Product_Image,
        u.User_Name as CreatedBy_Name
      FROM Stock_Transactions st
      INNER JOIN Product p ON st.Product_ID = p.Product_ID
      LEFT JOIN [User] u ON st.CreatedAt = st.CreatedAt
      WHERE 1=1
    `;
    
    const request = pool.request();
    
    if (filters.productId) {
      query += ' AND st.Product_ID = @productId';
      request.input('productId', sql.Int, filters.productId);
    }
    
    if (filters.type) {
      query += ' AND st.Type = @type';
      request.input('type', sql.NVarChar, filters.type);
    }
    
    query += ' ORDER BY st.CreatedAt DESC';
    
    if (filters.limit) {
      query += ' OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
      request.input('offset', sql.Int, ((filters.page || 1) - 1) * filters.limit);
      request.input('limit', sql.Int, filters.limit);
    }

    const result = await request.query(query);
    return result.recordset;
  }

  static async create(transactionData) {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Get current stock
      const inventoryResult = await transaction.request()
        .input('productId', sql.Int, transactionData.product)
        .query('SELECT Stock FROM Inventory WHERE Product_ID = @productId');
      
      if (inventoryResult.recordset.length === 0) {
        throw new Error('Product inventory not found');
      }
      
      const previousStock = inventoryResult.recordset[0].Stock;
      let newStock = previousStock;
      
      // Calculate new stock based on type
      if (transactionData.type === 'import' || transactionData.type === 'return') {
        newStock = previousStock + transactionData.quantity;
      } else if (transactionData.type === 'export') {
        if (previousStock < transactionData.quantity) {
          throw new Error('Insufficient stock');
        }
        newStock = previousStock - transactionData.quantity;
      } else if (transactionData.type === 'adjustment') {
        newStock = transactionData.quantity;
      }
      
      // Create transaction record
      const result = await transaction.request()
        .input('productId', sql.Int, transactionData.product)
        .input('type', sql.NVarChar, transactionData.type)
        .input('quantity', sql.Int, transactionData.quantity)
        .input('supplierId', sql.Int, transactionData.supplierId || null)
        .input('note', sql.NVarChar, transactionData.reason || null)
        .query(`
          INSERT INTO Stock_Transactions (Product_ID, Type, Quantity, Supplier_ID, Note)
          OUTPUT INSERTED.*
          VALUES (@productId, @type, @quantity, @supplierId, @note)
        `);
      
      // Update inventory
      await transaction.request()
        .input('productId', sql.Int, transactionData.product)
        .input('stock', sql.Int, newStock)
        .query(`
          UPDATE Inventory
          SET Stock = @stock, LastUpdate = GETDATE()
          WHERE Product_ID = @productId
        `);
      
      await transaction.commit();
      
      const transactionRecord = result.recordset[0];
      transactionRecord.previousStock = previousStock;
      transactionRecord.newStock = newStock;
      
      return transactionRecord;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = InventoryTransaction;
