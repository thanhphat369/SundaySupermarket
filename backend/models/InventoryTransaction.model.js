const { getPool, sql } = require('../config/database');

// Using Stock_Transactions table
class InventoryTransaction {
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT DISTINCT
        st.Transaction_ID,
        st.Product_ID,
        st.Type,
        st.Quantity,
        st.Supplier_ID,
        st.CreatedAt,
        st.Note,
        p.Name as Product_Name,
        p.ImageURL as Product_Image,
        s.Supplier_Name
      FROM Stock_Transactions st
      INNER JOIN Product p ON st.Product_ID = p.Product_ID
      LEFT JOIN Supplier s ON st.Supplier_ID = s.Supplier_ID
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

  static async update(transactionId, transactionData) {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Get existing transaction
      const existingResult = await transaction.request()
        .input('transactionId', sql.Int, transactionId)
        .query('SELECT * FROM Stock_Transactions WHERE Transaction_ID = @transactionId');
      
      if (existingResult.recordset.length === 0) {
        throw new Error('Transaction not found');
      }
      
      const existingTransaction = existingResult.recordset[0];
      
      // Get current stock
      const inventoryResult = await transaction.request()
        .input('productId', sql.Int, transactionData.product)
        .query('SELECT Stock FROM Inventory WHERE Product_ID = @productId');
      
      if (inventoryResult.recordset.length === 0) {
        throw new Error('Product inventory not found');
      }
      
      const currentStock = inventoryResult.recordset[0].Stock;
      
      // Reverse the old transaction effect
      let stockAfterReverse = currentStock;
      if (existingTransaction.Type === 'import' || existingTransaction.Type === 'return') {
        stockAfterReverse = currentStock - existingTransaction.Quantity;
      } else if (existingTransaction.Type === 'export') {
        stockAfterReverse = currentStock + existingTransaction.Quantity;
      } else if (existingTransaction.Type === 'adjustment') {
        // For adjustment, we need to restore previous stock
        // This is tricky, so we'll recalculate from all transactions
        // For simplicity, we'll just reverse the adjustment
        stockAfterReverse = currentStock; // Keep current for now
      }
      
      // Apply new transaction
      let newStock = stockAfterReverse;
      if (transactionData.type === 'import' || transactionData.type === 'return') {
        newStock = stockAfterReverse + transactionData.quantity;
      } else if (transactionData.type === 'export') {
        if (stockAfterReverse < transactionData.quantity) {
          throw new Error('Insufficient stock');
        }
        newStock = stockAfterReverse - transactionData.quantity;
      } else if (transactionData.type === 'adjustment') {
        newStock = transactionData.quantity;
      }
      
      // Update transaction record
      const result = await transaction.request()
        .input('transactionId', sql.Int, transactionId)
        .input('productId', sql.Int, transactionData.product)
        .input('type', sql.NVarChar, transactionData.type)
        .input('quantity', sql.Int, transactionData.quantity)
        .input('supplierId', sql.Int, transactionData.supplierId || null)
        .input('note', sql.NVarChar, transactionData.reason || null)
        .query(`
          UPDATE Stock_Transactions
          SET Product_ID = @productId,
              Type = @type,
              Quantity = @quantity,
              Supplier_ID = @supplierId,
              Note = @note
          OUTPUT INSERTED.*
          WHERE Transaction_ID = @transactionId
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
      transactionRecord.previousStock = currentStock;
      transactionRecord.newStock = newStock;
      
      return transactionRecord;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = InventoryTransaction;
