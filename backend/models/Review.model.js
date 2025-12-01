const { getPool, sql } = require('../config/database');

// Using Feedback table as Review
class Review {
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT 
        f.*,
        u.User_Name,
        u.Full_Name,
        u.Avatar,
        p.Name as Product_Name,
        p.ImageURL as Product_Image
      FROM Feedback f
      INNER JOIN [User] u ON f.User_ID = u.User_ID
      INNER JOIN Product p ON f.Product_ID = p.Product_ID
      WHERE 1=1
    `;
    
    const request = pool.request();
    
    if (filters.productId) {
      query += ' AND f.Product_ID = @productId';
      request.input('productId', sql.Int, filters.productId);
    }
    
    query += ' ORDER BY f.CreatedAt DESC';
    
    if (filters.limit) {
      query += ' OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
      request.input('offset', sql.Int, ((filters.page || 1) - 1) * filters.limit);
      request.input('limit', sql.Int, filters.limit);
    }

    const result = await request.query(query);
    return result.recordset;
  }

  static async findById(reviewId) {
    const pool = getPool();
    const result = await pool.request()
      .input('reviewId', sql.Int, reviewId)
      .query(`
        SELECT 
          f.*,
          u.User_Name,
          u.Full_Name,
          u.Avatar,
          p.Name as Product_Name,
          p.ImageURL as Product_Image
        FROM Feedback f
        INNER JOIN [User] u ON f.User_ID = u.User_ID
        INNER JOIN Product p ON f.Product_ID = p.Product_ID
        WHERE f.Feedback_ID = @reviewId
      `);
    return result.recordset[0] || null;
  }

  static async create(reviewData) {
    const pool = getPool();
    const result = await pool.request()
      .input('userId', sql.Int, reviewData.customer)
      .input('productId', sql.Int, reviewData.product)
      .input('rating', sql.Int, reviewData.rating)
      .input('content', sql.NVarChar, reviewData.comment || null)
      .query(`
        INSERT INTO Feedback (User_ID, Product_ID, Rating, Content)
        OUTPUT INSERTED.*
        VALUES (@userId, @productId, @rating, @content)
      `);
    
    // Update product rating average
    await this.updateProductRating(reviewData.product);
    
    return await this.findById(result.recordset[0].Feedback_ID);
  }

  static async update(reviewId, reviewData) {
    const pool = getPool();
    const updates = [];
    const request = pool.request().input('reviewId', sql.Int, reviewId);

    if (reviewData.rating !== undefined) {
      updates.push('Rating = @rating');
      request.input('rating', sql.Int, reviewData.rating);
    }
    if (reviewData.comment !== undefined) {
      updates.push('Content = @content');
      request.input('content', sql.NVarChar, reviewData.comment);
    }

    if (updates.length > 0) {
      const result = await request.query(`
        UPDATE Feedback
        SET ${updates.join(', ')}
        OUTPUT INSERTED.*
        WHERE Feedback_ID = @reviewId
      `);
      
      if (result.recordset.length > 0) {
        await this.updateProductRating(result.recordset[0].Product_ID);
      }
    }

    return await this.findById(reviewId);
  }

  static async delete(reviewId) {
    const pool = getPool();
    // Get product ID before deleting
    const review = await this.findById(reviewId);
    
    await pool.request()
      .input('reviewId', sql.Int, reviewId)
      .query('DELETE FROM Feedback WHERE Feedback_ID = @reviewId');
    
    if (review) {
      await this.updateProductRating(review.Product_ID);
    }
    
    return true;
  }

  static async updateProductRating(productId) {
    const pool = getPool();
    const result = await pool.request()
      .input('productId', sql.Int, productId)
      .query(`
        SELECT 
          AVG(CAST(Rating AS FLOAT)) as AverageRating,
          COUNT(*) as Count
        FROM Feedback
        WHERE Product_ID = @productId
      `);
    
    // Note: Product table doesn't have rating fields in SQL schema
    // You may need to add them or handle this differently
    return result.recordset[0];
  }
}

module.exports = Review;
