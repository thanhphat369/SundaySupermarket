const { getPool, sql } = require('../config/database');

class Category {
  static async findAll() {
    const pool = getPool();
    // Get all categories first
    const result = await pool.request().query(`
      SELECT 
        c.*,
        p.Category_Name as Parent_Name
      FROM Category c
      LEFT JOIN Category p ON c.ParentCategoryID = p.Category_ID
      ORDER BY ISNULL(c.ParentCategoryID, c.Category_ID), c.Category_Name
    `);
    
    const categories = result.recordset;
    
    // Calculate ProductCount for each category (including child categories)
    // Use Promise.all for better performance
    await Promise.all(categories.map(async (category) => {
      const categoryIds = await this.getAllChildCategoryIds(category.Category_ID);
      
      if (categoryIds.length > 0) {
        // Build query with parameters
        const placeholders = categoryIds.map((_, index) => `@cat${category.Category_ID}_${index}`).join(', ');
        const countRequest = pool.request();
        categoryIds.forEach((id, index) => {
          countRequest.input(`cat${category.Category_ID}_${index}`, sql.Int, id);
        });
        
        const countResult = await countRequest.query(`
          SELECT COUNT(*) as ProductCount
          FROM Product
          WHERE CategoryID IN (${placeholders})
        `);
        
        category.ProductCount = countResult.recordset[0].ProductCount || 0;
      } else {
        category.ProductCount = 0;
      }
    }));
    
    return categories;
  }

  static async findById(categoryId) {
    const pool = getPool();
    const result = await pool.request()
      .input('categoryId', sql.Int, categoryId)
      .query(`
        SELECT 
          c.*,
          p.Category_Name as Parent_Name
        FROM Category c
        LEFT JOIN Category p ON c.ParentCategoryID = p.Category_ID
        WHERE c.Category_ID = @categoryId
      `);
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
    const request = pool.request()
      .input('name', sql.NVarChar, categoryData.name);
    
    let query = `INSERT INTO Category (Category_Name`;
    let values = `VALUES (@name`;
    
    // Check if ParentCategoryID exists and add it if provided
    if (categoryData.parentCategoryId !== undefined && categoryData.parentCategoryId !== null && categoryData.parentCategoryId !== '') {
      query += `, ParentCategoryID`;
      values += `, @parentCategoryId`;
      request.input('parentCategoryId', sql.Int, parseInt(categoryData.parentCategoryId));
    }
    
    // Add ImageURL if provided
    if (categoryData.image) {
      query += `, ImageURL`;
      values += `, @imageURL`;
      request.input('imageURL', sql.NVarChar, categoryData.image);
    }
    
    query += `) OUTPUT INSERTED.* ${values})`;
    
    const result = await request.query(query);
    return result.recordset[0];
  }

  static async update(categoryId, categoryData) {
    const pool = getPool();
    const request = pool.request()
      .input('categoryId', sql.Int, categoryId)
      .input('name', sql.NVarChar, categoryData.name);
    
    let query = `UPDATE Category SET Category_Name = @name`;
    
    // Check if ParentCategoryID exists and update it if provided
    if (categoryData.parentCategoryId !== undefined) {
      if (categoryData.parentCategoryId === null || categoryData.parentCategoryId === '') {
        query += `, ParentCategoryID = NULL`;
      } else {
        query += `, ParentCategoryID = @parentCategoryId`;
        request.input('parentCategoryId', sql.Int, parseInt(categoryData.parentCategoryId));
      }
    }
    
    // Update ImageURL if provided
    if (categoryData.image !== undefined) {
      query += `, ImageURL = @imageURL`;
      request.input('imageURL', sql.NVarChar, categoryData.image || null);
    }
    
    query += ` OUTPUT INSERTED.* WHERE Category_ID = @categoryId`;
    
    const result = await request.query(query);
    return result.recordset[0] || null;
  }

  static async delete(categoryId) {
    const pool = getPool();
    // Check if category has children
    const checkResult = await pool.request()
      .input('categoryId', sql.Int, categoryId)
      .query('SELECT COUNT(*) as count FROM Category WHERE ParentCategoryID = @categoryId');
    
    if (checkResult.recordset[0].count > 0) {
      throw new Error('Cannot delete category with subcategories. Please delete subcategories first.');
    }
    
    await pool.request()
      .input('categoryId', sql.Int, categoryId)
      .query('DELETE FROM Category WHERE Category_ID = @categoryId');
    return true;
  }

  // Get all child category IDs recursively (including the category itself)
  static async getAllChildCategoryIds(categoryId) {
    const pool = getPool();
    const result = await pool.request()
      .input('categoryId', sql.Int, categoryId)
      .query(`
        WITH CategoryTree AS (
          -- Anchor: Start with the given category
          SELECT Category_ID, ParentCategoryID
          FROM Category
          WHERE Category_ID = @categoryId
          
          UNION ALL
          
          -- Recursive: Get all children
          SELECT c.Category_ID, c.ParentCategoryID
          FROM Category c
          INNER JOIN CategoryTree ct ON c.ParentCategoryID = ct.Category_ID
        )
        SELECT Category_ID FROM CategoryTree
      `);
    
    return result.recordset.map(row => row.Category_ID);
  }
}

module.exports = Category;
