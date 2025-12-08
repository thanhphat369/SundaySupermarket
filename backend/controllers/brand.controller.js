const Brand = require('../models/Brand.model');

// Get all brands
exports.getBrands = async (req, res) => {
  try {
    const brands = await Brand.findAll();

    res.json({
      success: true,
      data: {
        brands: brands.map(b => ({
          _id: b.Brand_ID,
          name: b.Brand_Name,
          description: b.Description || null,
          supplierId: b.Supplier_ID || null,
          supplier: b.Supplier_Name ? {
            _id: b.Supplier_ID,
            name: b.Supplier_Name,
            phone: b.Supplier_Phone || null,
            address: b.Supplier_Address || null,
          } : null,
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

// Get brand by ID
exports.getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found',
      });
    }

    res.json({
      success: true,
      data: {
        brand: {
          _id: brand.Brand_ID,
          name: brand.Brand_Name,
          description: brand.Description || null,
          supplierId: brand.Supplier_ID || null,
          supplier: brand.Supplier_Name ? {
            _id: brand.Supplier_ID,
            name: brand.Supplier_Name,
            phone: brand.Supplier_Phone || null,
            address: brand.Supplier_Address || null,
          } : null,
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

// Create brand
exports.createBrand = async (req, res) => {
  try {
    const brandData = req.body;

    const brand = await Brand.create(brandData);

    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: { brand },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update brand
exports.updateBrand = async (req, res) => {
  try {
    const brandData = req.body;

    const brand = await Brand.update(req.params.id, brandData);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found',
      });
    }

    res.json({
      success: true,
      message: 'Brand updated successfully',
      data: { brand },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete brand
exports.deleteBrand = async (req, res) => {
  try {
    await Brand.delete(req.params.id);

    res.json({
      success: true,
      message: 'Brand deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
