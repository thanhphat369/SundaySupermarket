const Category = require('../models/Category.model');

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();

    res.json({
      success: true,
      data: {
        categories: categories.map(c => ({
          _id: c.Category_ID,
          name: c.Category_Name,
          parentCategoryId: c.ParentCategoryID || null,
          parentName: c.Parent_Name || null,
          image: c.ImageURL || null,
          productCount: c.ProductCount || 0,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: {
        category: {
          _id: category.Category_ID,
          name: category.Category_Name,
          parentCategoryId: category.ParentCategoryID || null,
          parentName: category.Parent_Name || null,
          image: category.ImageURL || null,
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

// Create category
exports.createCategory = async (req, res) => {
  try {
    const categoryData = req.body;
    
    // Handle uploaded image
    if (req.file) {
      categoryData.image = `/uploads/categories/${req.file.filename}`;
    }

    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { 
        category: {
          _id: category.Category_ID,
          name: category.Category_Name,
          parentCategoryId: category.ParentCategoryID || null,
          image: category.ImageURL || null,
        }
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const categoryData = req.body;
    
    // Handle uploaded image
    if (req.file) {
      categoryData.image = `/uploads/categories/${req.file.filename}`;
    }

    const category = await Category.update(req.params.id, categoryData);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { 
        category: {
          _id: category.Category_ID,
          name: category.Category_Name,
          parentCategoryId: category.ParentCategoryID || null,
          image: category.ImageURL || null,
        }
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    await Category.delete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
