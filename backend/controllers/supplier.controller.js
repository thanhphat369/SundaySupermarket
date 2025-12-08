const Supplier = require('../models/Supplier.model');

// Get all suppliers
exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll();

    res.json({
      success: true,
      data: {
        suppliers: suppliers.map(s => ({
          _id: s.Supplier_ID,
          name: s.Supplier_Name,
          phone: s.PhoneContact || null,
          address: s.Address || null,
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

// Get supplier by ID
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    res.json({
      success: true,
      data: {
        supplier: {
          _id: supplier.Supplier_ID,
          name: supplier.Supplier_Name,
          phone: supplier.PhoneContact || null,
          address: supplier.Address || null,
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

// Create supplier
exports.createSupplier = async (req, res) => {
  try {
    const supplierData = req.body;

    const supplier = await Supplier.create({
      name: supplierData.name,
      phone: supplierData.phone,
      address: supplierData.address,
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: {
        supplier: {
          _id: supplier.Supplier_ID,
          name: supplier.Supplier_Name,
          phone: supplier.PhoneContact || null,
          address: supplier.Address || null,
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

// Update supplier
exports.updateSupplier = async (req, res) => {
  try {
    const supplierData = req.body;

    const supplier = await Supplier.update(req.params.id, supplierData);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: {
        supplier: {
          _id: supplier.Supplier_ID,
          name: supplier.Supplier_Name,
          phone: supplier.PhoneContact || null,
          address: supplier.Address || null,
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

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    await Supplier.delete(req.params.id);

    res.json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
