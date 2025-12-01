const Review = require('../models/Review.model');
const Order = require('../models/Order.model');

// Get all reviews
exports.getReviews = async (req, res) => {
  try {
    const { product, page = 1, limit = 10 } = req.query;
    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    if (product) filters.productId = parseInt(product);

    const reviews = await Review.findAll(filters);

    res.json({
      success: true,
      data: {
        reviews: reviews.map(r => ({
          _id: r.Feedback_ID,
          product: {
            _id: r.Product_ID,
            name: r.Product_Name,
            images: r.Product_Image ? [r.Product_Image] : [],
          },
          customer: {
            _id: r.User_ID,
            username: r.User_Name,
            fullName: r.Full_Name,
            avatar: r.Avatar,
          },
          rating: r.Rating,
          comment: r.Content,
          createdAt: r.CreatedAt,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: reviews.length,
          pages: Math.ceil(reviews.length / limit),
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

// Get review by ID
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.json({
      success: true,
      data: { review },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get product reviews
exports.getProductReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const filters = {
      productId: req.params.productId,
      page: parseInt(page),
      limit: parseInt(limit),
    };

    const reviews = await Review.findAll(filters);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: reviews.length,
          pages: Math.ceil(reviews.length / limit),
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

// Create review
exports.createReview = async (req, res) => {
  try {
    const { product, order, rating, comment } = req.body;
    const customerId = req.user.User_ID;

    // Check if customer has purchased this product (optional validation)
    if (order) {
      const orderDoc = await Order.findById(order);
      if (!orderDoc || orderDoc.User_ID !== customerId) {
        return res.status(403).json({
          success: false,
          message: 'You can only review products from your orders',
        });
      }
    }

    const review = await Review.create({
      customer: customerId,
      product,
      order,
      rating,
      comment,
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check permission
    if (review.User_ID !== req.user.User_ID && req.user.Role?.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const { rating, comment } = req.body;
    const updatedReview = await Review.update(req.params.id, { rating, comment });

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review: updatedReview },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check permission
    if (review.User_ID !== req.user.User_ID && req.user.Role?.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    await Review.delete(req.params.id);

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
