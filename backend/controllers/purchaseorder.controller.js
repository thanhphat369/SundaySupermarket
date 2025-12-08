const PurchaseOrder = require('../models/PurchaseOrder.model');

// Get all purchase orders
exports.getPurchaseOrders = async (req, res) => {
  try {
    const { supplier, status, page = 1, limit = 20 } = req.query;
    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    if (supplier) filters.supplierId = parseInt(supplier);
    if (status) filters.status = status;

    const purchaseOrders = await PurchaseOrder.findAll(filters);
    const total = await PurchaseOrder.count(filters);

    res.json({
      success: true,
      data: {
        purchaseOrders,
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

// Get purchase order by ID
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found',
      });
    }

    res.json({
      success: true,
      data: { purchaseOrder },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create purchase order
exports.createPurchaseOrder = async (req, res) => {
  try {
    const { supplierId, status, items } = req.body;

    if (!supplierId) {
      return res.status(400).json({
        success: false,
        message: 'Supplier ID is required',
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required',
      });
    }

    const purchaseOrder = await PurchaseOrder.create({
      supplierId,
      status: status || 'pending',
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
    });

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: { purchaseOrder },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update purchase order
exports.updatePurchaseOrder = async (req, res) => {
  try {
    const { supplierId, status, items } = req.body;

    const purchaseOrder = await PurchaseOrder.update(req.params.id, {
      supplierId,
      status,
      items: items ? items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })) : undefined,
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found',
      });
    }

    res.json({
      success: true,
      message: 'Purchase order updated successfully',
      data: { purchaseOrder },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete purchase order
exports.deletePurchaseOrder = async (req, res) => {
  try {
    await PurchaseOrder.delete(req.params.id);

    res.json({
      success: true,
      message: 'Purchase order deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
