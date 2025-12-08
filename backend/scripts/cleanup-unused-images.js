const { getPool, sql } = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Script to cleanup unused product images
 * Removes images from uploads/products that are not referenced in the database
 * Also removes images older than 1 day that are not in use
 */
async function cleanupUnusedImages() {
  const pool = getPool();
  const uploadsDir = path.join(__dirname, '../uploads/products');
  
  try {
    console.log('🧹 Starting image cleanup...');
    
    // Check if directory exists
    if (!fs.existsSync(uploadsDir)) {
      console.log('📁 Uploads directory does not exist. Creating...');
      fs.mkdirSync(uploadsDir, { recursive: true });
      return { deleted: 0, errors: [] };
    }

    // Get all image URLs from database
    const result = await pool.request().query(`
      SELECT ImageURL 
      FROM Product 
      WHERE ImageURL IS NOT NULL AND ImageURL != ''
    `);

    // Extract all image file paths from database
    const usedImages = new Set();
    result.recordset.forEach(row => {
      if (row.ImageURL) {
        // ImageURL format: "/uploads/products/image-123.jpg" or "image-123.jpg,image-456.jpg"
        const images = row.ImageURL.split(',').map(img => img.trim());
        images.forEach(img => {
          // Extract filename from path
          const filename = path.basename(img);
          if (filename) {
            usedImages.add(filename);
          }
        });
      }
    });

    console.log(`📊 Found ${usedImages.size} images in use in database`);

    // Get all files in uploads/products directory
    const files = fs.readdirSync(uploadsDir);
    console.log(`📁 Found ${files.length} files in uploads/products directory`);

    const deleted = [];
    const errors = [];
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000); // 1 day in milliseconds

    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      
      try {
        // Skip if not a file
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) {
          return;
        }

        // Check if file is used in database
        const isUsed = usedImages.has(file);
        
        // Check if file is older than 1 day
        const fileAge = stats.mtimeMs;
        const isOld = fileAge < oneDayAgo;

        // Delete if: not used OR (old and not used)
        // Only delete if file is older than 1 day to avoid deleting files that were just uploaded
        if (!isUsed && isOld) {
          fs.unlinkSync(filePath);
          deleted.push({
            file,
            reason: 'old_and_not_used',
            age: Math.round((Date.now() - fileAge) / (1000 * 60 * 60)) + ' hours'
          });
          console.log(`🗑️  Deleted: ${file} (old and not used, age: ${Math.round((Date.now() - fileAge) / (1000 * 60 * 60))} hours)`);
        } else if (!isUsed && !isOld) {
          // File is not used but less than 1 day old - keep it for now
          console.log(`⏳ Keeping: ${file} (not used but less than 1 day old)`);
        }
      } catch (error) {
        errors.push({ file, error: error.message });
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    });

    console.log(`✅ Cleanup complete! Deleted ${deleted.length} files`);
    
    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} errors occurred`);
    }

    return {
      deleted: deleted.length,
      errors: errors.length,
      details: deleted,
      errorsList: errors
    };
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    // Close database connection if needed
    // pool.close();
  }
}

// Run if called directly
if (require.main === module) {
  cleanupUnusedImages()
    .then(result => {
      console.log('\n📊 Cleanup Summary:');
      console.log(`   Deleted: ${result.deleted} files`);
      console.log(`   Errors: ${result.errors}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = cleanupUnusedImages;
