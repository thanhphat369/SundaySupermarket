const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const ShoppingCart = require('../models/ShoppingCart.model');
const InventoryTransaction = require('../models/InventoryTransaction.model');

// Get all orders (Admin)
exports.getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filters = {};

    if (status) filters.status = status;
    filters.page = parseInt(page);
    filters.limit = parseInt(limit);

    const orders = await Order.findAll(filters);
    const total = orders.length; // You may want to add a count method

    res.json({
      success: true,
      data: {
        orders: orders.map(o => ({
          _id: o.Order_ID,
          orderNumber: `SS${o.Order_ID}`,
          customer: {
            _id: o.User_ID,
            username: o.User_Name,
            email: o.Email,
            fullName: o.Full_Name,
            phone: o.Phone,
          },
          items: o.items || [],
          total: o.TotalAmount,
          status: o.Status,
          createdAt: o.OrderDate,
          shipper: o.Shipper_ID ? {
            _id: o.Shipper_ID,
            name: o.Shipper_Name,
          } : null,
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

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user has permission to view this order
    if (req.user.Role?.toLowerCase() !== 'admin' && order.User_ID !== req.user.User_ID) {
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

// Create order
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, contactPhone, paymentMethod, notes } = req.body;
    const customerId = req.user.User_ID;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must have at least one item',
      });
    }

    // Calculate totals and validate stock
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.product} not found`,
        });
      }

      if ((product.Stock || 0) < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.Name}`,
        });
      }

      const itemSubtotal = product.UnitPrice * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product: product.Product_ID,
        quantity: item.quantity,
        price: product.UnitPrice,
        subtotal: itemSubtotal,
      });
    }

    const shippingFee = 0; // Can be calculated based on distance
    const total = subtotal + shippingFee;

    // Create order
    const order = await Order.create({
      customer: customerId,
      items: orderItems,
      shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : null,
      contactPhone,
      paymentMethod: paymentMethod || 'cod',
      subtotal,
      shippingFee,
      total,
      notes,
      status: 'pending',
    });

    // Clear user cart
    await ShoppingCart.clear(customerId);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update order (Admin)
exports.updateOrder = async (req, res) => {
  try {
    const { status, shipper } = req.body;

    const order = await Order.update(req.params.id, {
      status,
      shipper,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: { order },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check permission
    if (req.user.Role?.toLowerCase() !== 'admin' && order.User_ID !== req.user.User_ID) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Only allow cancellation if order is pending or confirmed
    if (!['pending', 'confirmed'].includes(order.Status?.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage',
      });
    }

    await Order.cancel(req.params.id);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get my orders (Customer)
exports.getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filters = {
      userId: req.user.User_ID,
      page: parseInt(page),
      limit: parseInt(limit),
    };

    if (status) filters.status = status;

    const orders = await Order.findAll(filters);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: orders.length,
          pages: Math.ceil(orders.length / limit),
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
