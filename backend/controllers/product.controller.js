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
          images: p.ImageURL ? [p.ImageURL] : [],
          category: {
            _id: p.CategoryID,
            name: p.Category_Name,
          },
          brand: {
            _id: p.Brand_ID,
            name: p.Brand_Name,
          },
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
          images: product.ImageURL ? [product.ImageURL] : [],
          category: {
            _id: product.CategoryID,
            name: product.Category_Name,
          },
          brand: {
            _id: product.Brand_ID,
            name: product.Brand_Name,
          },
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

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => 
        `/uploads/products/${file.filename}`
      );
    }

    const product = await Product.update(req.params.id, productData);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product },
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
