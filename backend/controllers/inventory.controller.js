const InventoryTransaction = require('../models/InventoryTransaction.model');

// Get all inventory transactions
exports.getInventoryTransactions = async (req, res) => {
  try {
    const { product, type, page = 1, limit = 20 } = req.query;
    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    if (product) filters.productId = parseInt(product);
    if (type) filters.type = type;

    const transactions = await InventoryTransaction.findAll(filters);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: transactions.length,
          pages: Math.ceil(transactions.length / limit),
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

// Create inventory transaction
exports.createInventoryTransaction = async (req, res) => {
  try {
    const { product, type, quantity, reason, reference } = req.body;

    const transaction = await InventoryTransaction.create({
      product,
      type,
      quantity,
      reason,
      reference,
    });

    res.status(201).json({
      success: true,
      message: 'Inventory transaction created successfully',
      data: { transaction },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get product inventory history
exports.getProductInventoryHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filters = {
      productId: req.params.productId,
      page: parseInt(page),
      limit: parseInt(limit),
    };

    const transactions = await InventoryTransaction.findAll(filters);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: transactions.length,
          pages: Math.ceil(transactions.length / limit),
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
