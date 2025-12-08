const { getPool, sql } = require('../config/database');
const Category = require('./Category.model');

class Product {
  // Helper function to format images for storage (comma-separated, max 255 chars)
  static formatImagesForStorage(images) {
    if (!images || images.length === 0) return null;
    
    let result = '';
    for (const img of images) {
      const newResult = result ? `${result},${img}` : img;
      if (newResult.length <= 255) {
        result = newResult;
      } else {
        break; // Stop if adding this image would exceed 255 chars
      }
    }
    return result || null;
  }
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT 
        p.*,
        c.Category_Name,
        b.Brand_Name,
        b.Description as Brand_Description,
        s.Supplier_Name,
        i.Stock,
        i.MinStock,
        (SELECT TOP 1 st.UnitCost 
         FROM Stock_Transactions st
         WHERE st.Product_ID = p.Product_ID 
           AND st.Type = 'import'
           AND st.UnitCost IS NOT NULL
         ORDER BY st.CreatedAt DESC) as CostPrice
      FROM Product p
      INNER JOIN Category c ON p.CategoryID = c.Category_ID
      INNER JOIN Brand b ON p.Brand_ID = b.Brand_ID
      LEFT JOIN Supplier s ON b.Supplier_ID = s.Supplier_ID
      LEFT JOIN Inventory i ON p.Product_ID = i.Product_ID
      WHERE 1=1
    `;
    
    const request = pool.request();
    
    if (filters.category) {
      // Get all child category IDs (including the category itself)
      const categoryIds = await Category.getAllChildCategoryIds(filters.category);
      
      if (categoryIds.length > 0) {
        // Use IN clause to include products from parent and all child categories
        const placeholders = categoryIds.map((_, index) => `@category${index}`).join(', ');
        query += ` AND p.CategoryID IN (${placeholders})`;
        categoryIds.forEach((id, index) => {
          request.input(`category${index}`, sql.Int, id);
        });
      } else {
        // If no categories found, return no results
        query += ' AND 1=0';
      }
    }
    
    if (filters.brand) {
      query += ' AND p.Brand_ID = @brand';
      request.input('brand', sql.Int, filters.brand);
    }
    
    if (filters.minPrice) {
      query += ' AND p.UnitPrice >= @minPrice';
      request.input('minPrice', sql.Int, filters.minPrice);
    }
    
    if (filters.maxPrice) {
      query += ' AND p.UnitPrice <= @maxPrice';
      request.input('maxPrice', sql.Int, filters.maxPrice);
    }
    
    if (filters.search) {
      query += ' AND (p.Name LIKE @search OR p.Description LIKE @search)';
      request.input('search', sql.NVarChar, `%${filters.search}%`);
    }
    
    query += ' ORDER BY p.Product_ID DESC';
    
    if (filters.limit) {
      query += ' OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
      request.input('offset', sql.Int, ((filters.page || 1) - 1) * filters.limit);
      request.input('limit', sql.Int, filters.limit);
    }

    const result = await request.query(query);
    return result.recordset;
  }

  static async findById(productId) {
    const pool = getPool();
    const result = await pool.request()
      .input('productId', sql.Int, productId)
      .query(`
        SELECT 
          p.*,
          c.Category_Name,
          b.Brand_Name,
          b.Description as Brand_Description,
          s.Supplier_Name,
          i.Stock,
          i.MinStock,
          (SELECT TOP 1 st.UnitCost
           FROM Stock_Transactions st
           WHERE st.Product_ID = p.Product_ID 
             AND st.Type = 'import'
             AND st.UnitCost IS NOT NULL
           ORDER BY st.CreatedAt DESC) as CostPrice
        FROM Product p
        INNER JOIN Category c ON p.CategoryID = c.Category_ID
        INNER JOIN Brand b ON p.Brand_ID = b.Brand_ID
        LEFT JOIN Supplier s ON b.Supplier_ID = s.Supplier_ID
        LEFT JOIN Inventory i ON p.Product_ID = i.Product_ID
        WHERE p.Product_ID = @productId
      `);
    return result.recordset[0] || null;
  }

  static async create(productData) {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Insert product
      const productResult = await transaction.request()
        .input('name', sql.NVarChar, productData.name)
        .input('description', sql.NVarChar, productData.description || null)
        .input('categoryId', sql.Int, productData.category)
        .input('brandId', sql.Int, productData.brand)
        .input('unitPrice', sql.Int, productData.price)
        .input('imageURL', sql.NVarChar(255), Product.formatImagesForStorage(productData.images))
        .query(`
          INSERT INTO Product (Name, Description, CategoryID, Brand_ID, UnitPrice, ImageURL)
          OUTPUT INSERTED.*
          VALUES (@name, @description, @categoryId, @brandId, @unitPrice, @imageURL)
        `);
      
      const product = productResult.recordset[0];
      
      // Insert inventory
      await transaction.request()
        .input('productId', sql.Int, product.Product_ID)
        .input('stock', sql.Int, productData.stock || 0)
        .input('minStock', sql.Int, productData.minStock || 0)
        .query(`
          INSERT INTO Inventory (Product_ID, Stock, MinStock)
          VALUES (@productId, @stock, @minStock)
        `);
      
      await transaction.commit();
      
      return await this.findById(product.Product_ID);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async update(productId, productData) {
    const pool = getPool();
    const updates = [];
    const request = pool.request().input('productId', sql.Int, productId);

    if (productData.name) {
      updates.push('Name = @name');
      request.input('name', sql.NVarChar, productData.name);
    }
    if (productData.description !== undefined) {
      updates.push('Description = @description');
      request.input('description', sql.NVarChar, productData.description);
    }
    if (productData.category) {
      updates.push('CategoryID = @categoryId');
      request.input('categoryId', sql.Int, productData.category);
    }
    if (productData.brand) {
      updates.push('Brand_ID = @brandId');
      request.input('brandId', sql.Int, productData.brand);
    }
    if (productData.price !== undefined) {
      updates.push('UnitPrice = @unitPrice');
      request.input('unitPrice', sql.Int, productData.price);
    }
    if (productData.images !== undefined) {
      updates.push('ImageURL = @imageURL');
      request.input('imageURL', sql.NVarChar(255), Product.formatImagesForStorage(productData.images));
    }

    if (updates.length > 0) {
      await request.query(`
        UPDATE Product
        SET ${updates.join(', ')}
        WHERE Product_ID = @productId
      `);
    }

    // Update inventory if stock is provided
    if (productData.stock !== undefined) {
      await pool.request()
        .input('productId', sql.Int, productId)
        .input('stock', sql.Int, productData.stock)
        .query(`
          UPDATE Inventory
          SET Stock = @stock, LastUpdate = GETDATE()
          WHERE Product_ID = @productId
        `);
    }

    return await this.findById(productId);
  }

  static async delete(productId) {
    const pool = getPool();
    
    // Check if product is used in Order_Details
    const orderDetailsCheck = await pool.request()
      .input('productId', sql.Int, productId)
      .query('SELECT COUNT(*) as count FROM Order_Details WHERE Product_ID = @productId');
    
    if (orderDetailsCheck.recordset[0].count > 0) {
      throw new Error('Không thể xóa sản phẩm đã được sử dụng trong đơn hàng');
    }
    
    // Check if product is used in PurchaseOrder_Details
    const purchaseOrderCheck = await pool.request()
      .input('productId', sql.Int, productId)
      .query('SELECT COUNT(*) as count FROM PurchaseOrder_Details WHERE Product_ID = @productId');
    
    if (purchaseOrderCheck.recordset[0].count > 0) {
      throw new Error('Không thể xóa sản phẩm đã được sử dụng trong đơn mua hàng');
    }
    
    // Check if product is in ShoppingCart
    const shoppingCartCheck = await pool.request()
      .input('productId', sql.Int, productId)
      .query('SELECT COUNT(*) as count FROM ShoppingCart WHERE Product_ID = @productId');
    
    if (shoppingCartCheck.recordset[0].count > 0) {
      // Delete from shopping cart first
      await pool.request()
        .input('productId', sql.Int, productId)
        .query('DELETE FROM ShoppingCart WHERE Product_ID = @productId');
    }
    
    // Delete Stock_Transactions (transaction history can be deleted)
    await pool.request()
      .input('productId', sql.Int, productId)
      .query('DELETE FROM Stock_Transactions WHERE Product_ID = @productId');
    
    // Delete Feedback (reviews can be deleted)
    await pool.request()
      .input('productId', sql.Int, productId)
      .query('DELETE FROM Feedback WHERE Product_ID = @productId');
    
    // Delete inventory first
    await pool.request()
      .input('productId', sql.Int, productId)
      .query('DELETE FROM Inventory WHERE Product_ID = @productId');
    
    // Delete product
    await pool.request()
      .input('productId', sql.Int, productId)
      .query('DELETE FROM Product WHERE Product_ID = @productId');
    
    return true;
  }

  static async count(filters = {}) {
    const pool = getPool();
    let query = 'SELECT COUNT(*) as total FROM Product p WHERE 1=1';
    const request = pool.request();
    
    if (filters.category) {
      // Get all child category IDs (including the category itself)
      const categoryIds = await Category.getAllChildCategoryIds(filters.category);
      
      if (categoryIds.length > 0) {
        // Use IN clause to include products from parent and all child categories
        const placeholders = categoryIds.map((_, index) => `@category${index}`).join(', ');
        query += ` AND p.CategoryID IN (${placeholders})`;
        categoryIds.forEach((id, index) => {
          request.input(`category${index}`, sql.Int, id);
        });
      } else {
        // If no categories found, return 0
        query += ' AND 1=0';
      }
    }
    if (filters.brand) {
      query += ' AND p.Brand_ID = @brand';
      request.input('brand', sql.Int, filters.brand);
    }
    
    const result = await request.query(query);
    return result.recordset[0].total;
  }
}

module.exports = Product;
