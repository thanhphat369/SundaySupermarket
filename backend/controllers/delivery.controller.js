const Order = require('../models/Order.model');
const User = require('../models/User.model');

// Get delivery orders (Shipper)
exports.getDeliveryOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filters = {
      shipperId: req.user.User_ID,
      page: parseInt(page),
      limit: parseInt(limit),
    };

    if (status) filters.status = status;

    // Get orders where user is assigned as shipper
    const orders = await Order.findAll(filters);
    const shipperOrders = orders.filter(o => o.Shipper_ID === req.user.User_ID);

    res.json({
      success: true,
      data: {
        orders: shipperOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: shipperOrders.length,
          pages: Math.ceil(shipperOrders.length / limit),
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

// Get delivery order by ID
exports.getDeliveryOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if shipper has permission
    if (order.Shipper_ID && order.Shipper_ID !== req.user.User_ID) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update delivery status
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if shipper has permission
    if (order.Shipper_ID && order.Shipper_ID !== req.user.User_ID) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Validate status transition
    const validTransitions = {
      'confirmed': ['processing', 'shipping'],
      'processing': ['shipping'],
      'shipping': ['delivered'],
    };

    const currentStatus = order.Status?.toLowerCase();
    if (!validTransitions[currentStatus]?.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${order.Status} to ${status}`,
      });
    }

    const updatedOrder = await Order.update(req.params.id, { status });

    res.json({
      success: true,
      message: 'Delivery status updated successfully',
      data: { order: updatedOrder },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Assign shipper (Admin)
exports.assignShipper = async (req, res) => {
  try {
    const { shipperId } = req.body;

    // Check if shipper exists and has shipper role
    const shipper = await User.findById(shipperId);
    if (!shipper || shipper.Role?.toLowerCase() !== 'shipper') {
      return res.status(400).json({
        success: false,
        message: 'Invalid shipper',
      });
    }

    const order = await Order.update(req.params.id, {
      shipper: shipperId,
      status: 'confirmed',
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      message: 'Shipper assigned successfully',
      data: { order },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
