const Product = require('../models/Product.model');
const path = require('path');

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      featured,
      search,
      page = 1,
      limit = 12,
      sort = '-createdAt',
    } = req.query;

    const filters = {};
    if (category) filters.category = parseInt(category);
    if (brand) filters.brand = parseInt(brand);
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (search) filters.search = search;
    filters.page = parseInt(page);
    filters.limit = parseInt(limit);

    const products = await Product.findAll(filters);
    const total = await Product.count(filters);

    res.json({
      success: true,
      data: {
        products: products.map(p => ({
          _id: p.Product_ID,
          name: p.Name,
          description: p.Description,
          price: p.UnitPrice,
          costPrice: p.CostPrice || null,
          images: p.ImageURL ? p.ImageURL.split(',').map(img => img.trim()).filter(img => img) : [],
          category: {
            _id: p.CategoryID,
            name: p.Category_Name,
          },
          brand: {
            _id: p.Brand_ID,
            name: p.Brand_Name,
            supplier: p.Supplier_Name ? {
              name: p.Supplier_Name,
            } : null,
          },
          supplier: p.Supplier_Name ? {
            name: p.Supplier_Name,
          } : null,
          stock: p.Stock || 0,
          isActive: true,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: {
        product: {
          _id: product.Product_ID,
          name: product.Name,
          description: product.Description,
          price: product.UnitPrice,
          costPrice: product.CostPrice || null,
          images: product.ImageURL ? product.ImageURL.split(',').map(img => img.trim()).filter(img => img) : [],
          category: {
            _id: product.CategoryID,
            name: product.Category_Name,
          },
          brand: {
            _id: product.Brand_ID,
            name: product.Brand_Name,
            supplier: product.Supplier_Name ? {
              name: product.Supplier_Name,
            } : null,
          },
          supplier: product.Supplier_Name ? {
            name: product.Supplier_Name,
          } : null,
          stock: product.Stock || 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;
    
    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => 
        `/uploads/products/${file.filename}`
      );
      
      // Validate: require at least 2 images
      if (productData.images.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng upload ít nhất 2 ảnh cho sản phẩm',
        });
      }
      
      // Limit to 5 images
      if (productData.images.length > 5) {
        productData.images = productData.images.slice(0, 5);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng upload ít nhất 2 ảnh cho sản phẩm',
      });
    }

    const product = await Product.create({
      name: productData.name,
      description: productData.description,
      category: productData.category,
      brand: productData.brand,
      price: productData.price,
      images: productData.images,
      stock: productData.stock || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const productData = req.body;
    let finalImages = [];

    // Get existing images if provided (from formData)
    if (req.body.existingImages) {
      const existingImages = Array.isArray(req.body.existingImages) 
        ? req.body.existingImages 
        : [req.body.existingImages];
      finalImages = existingImages.filter(img => img && img.trim() !== '');
    }

    // Handle uploaded new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => 
        `/uploads/products/${file.filename}`
      );
      // Merge: existing images first, then new images
      finalImages = [...finalImages, ...newImages].slice(0, 5); // Limit to 5 images
    }

    // Only update images if we have final images or new files uploaded
    if (finalImages.length > 0 || (req.files && req.files.length > 0)) {
      // Validate: require at least 2 images when updating
      if (finalImages.length > 0 && finalImages.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Sản phẩm phải có ít nhất 2 ảnh',
        });
      }
      
      productData.images = finalImages;
    }
    // If no images provided at all, don't update images field (keep existing)

    const product = await Product.update(req.params.id, productData);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Format response similar to getProductById
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product: {
          _id: product.Product_ID,
          name: product.Name,
          description: product.Description,
          price: product.UnitPrice,
          images: product.ImageURL ? product.ImageURL.split(',').map(img => img.trim()).filter(img => img) : [],
          category: {
            _id: product.CategoryID,
            name: product.Category_Name,
          },
          brand: {
            _id: product.Brand_ID,
            name: product.Brand_Name,
            supplier: product.Supplier_Name ? {
              name: product.Supplier_Name,
            } : null,
          },
          supplier: product.Supplier_Name ? {
            name: product.Supplier_Name,
          } : null,
          stock: product.Stock || 0,
          costPrice: product.CostPrice || null,
          isActive: true,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    await Product.delete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const products = await Product.findAll({ search: q, limit: 20 });

    res.json({
      success: true,
      data: { products },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cleanup unused images
exports.cleanupUnusedImages = async (req, res) => {
  try {
    const cleanupUnusedImages = require('../scripts/cleanup-unused-images');
    const result = await cleanupUnusedImages();
    
    res.json({
      success: true,
      message: `Cleanup completed. Deleted ${result.deleted} unused image files.`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
