const { getPool, sql } = require('../config/database');

class Order {
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT 
        o.*,
        u.User_Name,
        u.Email,
        u.Full_Name,
        u.Phone,
        d.User_ID as Shipper_ID,
        shipper.User_Name as Shipper_Name
      FROM [Order] o
      INNER JOIN [User] u ON o.User_ID = u.User_ID
      LEFT JOIN Delivery d ON o.Order_ID = d.Order_ID
      LEFT JOIN [User] shipper ON d.User_ID = shipper.User_ID
      WHERE 1=1
    `;
    
    const request = pool.request();
    
    if (filters.status) {
      query += ' AND o.Status = @status';
      request.input('status', sql.NVarChar, filters.status);
    }
    
    if (filters.userId) {
      query += ' AND o.User_ID = @userId';
      request.input('userId', sql.Int, filters.userId);
    }
    
    query += ' ORDER BY o.OrderDate DESC';
    
    if (filters.limit) {
      query += ' OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
      request.input('offset', sql.Int, ((filters.page || 1) - 1) * filters.limit);
      request.input('limit', sql.Int, filters.limit);
    }

    const result = await request.query(query);
    
    // Get order details for each order
    for (let order of result.recordset) {
      order.items = await this.getOrderDetails(order.Order_ID);
    }
    
    return result.recordset;
  }

  static async findById(orderId) {
    const pool = getPool();
    const result = await pool.request()
      .input('orderId', sql.Int, orderId)
      .query(`
        SELECT 
          o.*,
          u.User_Name,
          u.Email,
          u.Full_Name,
          u.Phone,
          u.Address,
          d.User_ID as Shipper_ID,
          shipper.User_Name as Shipper_Name,
          shipper.Phone as Shipper_Phone
        FROM [Order] o
        INNER JOIN [User] u ON o.User_ID = u.User_ID
        LEFT JOIN Delivery d ON o.Order_ID = d.Order_ID
        LEFT JOIN [User] shipper ON d.User_ID = shipper.User_ID
        WHERE o.Order_ID = @orderId
      `);
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    const order = result.recordset[0];
    order.items = await this.getOrderDetails(orderId);
    
    return order;
  }

  static async getOrderDetails(orderId) {
    const pool = getPool();
    const result = await pool.request()
      .input('orderId', sql.Int, orderId)
      .query(`
        SELECT 
          od.*,
          p.Name as Product_Name,
          p.ImageURL as Product_Image
        FROM Order_Details od
        INNER JOIN Product p ON od.Product_ID = p.Product_ID
        WHERE od.Order_ID = @orderId
      `);
    return result.recordset;
  }

  static async create(orderData) {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Create order
      const orderResult = await transaction.request()
        .input('userId', sql.Int, orderData.customer)
        .input('totalAmount', sql.Int, orderData.total)
        .input('status', sql.NVarChar, orderData.status || 'pending')
        .query(`
          INSERT INTO [Order] (User_ID, TotalAmount, Status)
          OUTPUT INSERTED.*
          VALUES (@userId, @totalAmount, @status)
        `);
      
      const order = orderResult.recordset[0];
      
      // Create order details
      for (const item of orderData.items) {
        await transaction.request()
          .input('orderId', sql.Int, order.Order_ID)
          .input('productId', sql.Int, item.product)
          .input('quantity', sql.Int, item.quantity)
          .input('unitPrice', sql.Int, item.price)
          .input('shipAddress', sql.NVarChar, orderData.shippingAddress || '')
          .query(`
            INSERT INTO Order_Details (Order_ID, Product_ID, Quantity, UnitPrice, ShipAddress)
            VALUES (@orderId, @productId, @quantity, @unitPrice, @shipAddress)
          `);
        
        // Update inventory
        await transaction.request()
          .input('productId', sql.Int, item.product)
          .input('quantity', sql.Int, item.quantity)
          .query(`
            UPDATE Inventory
            SET Stock = Stock - @quantity, LastUpdate = GETDATE()
            WHERE Product_ID = @productId
          `);
      }
      
      await transaction.commit();
      
      return await this.findById(order.Order_ID);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async update(orderId, orderData) {
    const pool = getPool();
    const updates = [];
    const request = pool.request().input('orderId', sql.Int, orderId);

    if (orderData.status) {
      updates.push('Status = @status');
      request.input('status', sql.NVarChar, orderData.status);
    }
    if (orderData.totalAmount !== undefined) {
      updates.push('TotalAmount = @totalAmount');
      request.input('totalAmount', sql.Int, orderData.totalAmount);
    }

    if (updates.length > 0) {
      await request.query(`
        UPDATE [Order]
        SET ${updates.join(', ')}
        WHERE Order_ID = @orderId
      `);
    }

    // Update delivery if shipper is provided
    if (orderData.shipper) {
      const deliveryResult = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query('SELECT Delivery_ID FROM Delivery WHERE Order_ID = @orderId');
      
      if (deliveryResult.recordset.length > 0) {
        await pool.request()
          .input('deliveryId', sql.Int, deliveryResult.recordset[0].Delivery_ID)
          .input('userId', sql.Int, orderData.shipper)
          .input('status', sql.NVarChar, orderData.status || 'confirmed')
          .query(`
            UPDATE Delivery
            SET User_ID = @userId, Status = @status, UpdatedAt = GETDATE()
            WHERE Delivery_ID = @deliveryId
          `);
      } else {
        await pool.request()
          .input('orderId', sql.Int, orderId)
          .input('userId', sql.Int, orderData.shipper)
          .input('status', sql.NVarChar, orderData.status || 'confirmed')
          .query(`
            INSERT INTO Delivery (Order_ID, User_ID, Status)
            VALUES (@orderId, @userId, @status)
          `);
      }
    }

    return await this.findById(orderId);
  }

  static async cancel(orderId) {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Get order details to restore stock
      const detailsResult = await transaction.request()
        .input('orderId', sql.Int, orderId)
        .query('SELECT Product_ID, Quantity FROM Order_Details WHERE Order_ID = @orderId');
      
      // Restore stock
      for (const detail of detailsResult.recordset) {
        await transaction.request()
          .input('productId', sql.Int, detail.Product_ID)
          .input('quantity', sql.Int, detail.Quantity)
          .query(`
            UPDATE Inventory
            SET Stock = Stock + @quantity, LastUpdate = GETDATE()
            WHERE Product_ID = @productId
          `);
      }
      
      // Update order status
      await transaction.request()
        .input('orderId', sql.Int, orderId)
        .query('UPDATE [Order] SET Status = \'cancelled\' WHERE Order_ID = @orderId');
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = Order;
