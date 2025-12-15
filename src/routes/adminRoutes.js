import express from 'express';
import { verifyTokenMiddleware } from '../middelware/Auth.js';
import isAdmin from '../middelware/isAdmin.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Product from '../models/products.js';
import Payment from '../models/paymentModel.js';

const admin_router = express.Router();

// Get all orders (admin) with user and product info
admin_router.get('/orders', verifyTokenMiddleware, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('userId', 'username email mobile address city state zipCode')
      .populate('productId', 'title price image category')
      .sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (err) {
    console.error('admin /orders error', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get all users (admin)
admin_router.get('/users', verifyTokenMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('username email mobile admin createdAt updatedAt');
    res.status(200).json({ users });
  } catch (err) {
    console.error('admin /users error', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get all payments (admin) with user info
admin_router.get('/payments', verifyTokenMiddleware, isAdmin, async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate('userId', 'username email mobile')
      .sort({ createdAt: -1 });

    // attach product info when payment.meta.productId is present
    const paymentsWithProduct = await Promise.all(payments.map(async (p) => {
      const obj = p.toObject ? p.toObject() : p;
      try {
        const prodId = obj.meta && (obj.meta.productId || obj.meta.product_id);
        if (prodId) {
          const prod = await Product.findById(prodId).select('title images price category');
          obj.product = prod ? {
            _id: prod._id,
            title: prod.title,
            image: Array.isArray(prod.images) && prod.images.length > 0 ? prod.images[0] : prod.image || null,
            price: prod.price,
            category: prod.category,
          } : null;
        } else {
          obj.product = null;
        }
      } catch (err) {
        console.error('Failed to attach product to payment', err);
        obj.product = null;
      }
      return obj;
    }));

    res.status(200).json({ payments: paymentsWithProduct });
  } catch (err) {
    console.error('admin /payments error', err);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// Get single payment by orderId (optional)
admin_router.get('/payments/:orderId', verifyTokenMiddleware, isAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({ orderId }).populate('userId', 'username email mobile');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const result = payment.toObject ? payment.toObject() : payment;
    const prodId = result.meta && (result.meta.productId || result.meta.product_id);
    if (prodId) {
      try {
        const prod = await Product.findById(prodId).select('title images price category');
        result.product = prod ? {
          _id: prod._id,
          title: prod.title,
          image: Array.isArray(prod.images) && prod.images.length > 0 ? prod.images[0] : prod.image || null,
          price: prod.price,
          category: prod.category,
        } : null;
      } catch (err) {
        console.error('Failed to fetch product for payment detail', err);
        result.product = null;
      }
    } else {
      result.product = null;
    }

    res.status(200).json({ payment: result });
  } catch (err) {
    console.error('admin /payments/:orderId error', err);
    res.status(500).json({ message: 'Failed to fetch payment' });
  }
});

// Update order status and optionally increment delivery attempt
admin_router.put('/orders/:id/status', verifyTokenMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, location, incrementAttempt } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (typeof status === 'string') {
      order.status = status;
      if (status === 'delivered') order.deliveredAt = new Date();
    }

    if (incrementAttempt) {
      order.deliveryAttempts = (order.deliveryAttempts || 0) + 1;
    }

    order.deliveryLogs = order.deliveryLogs || [];
    order.deliveryLogs.push({
      status: status || order.status,
      note: note || '',
      location: location || '',
      timestamp: new Date(),
    });

    await order.save();

    const populated = await Order.findById(order._id)
      .populate('userId', 'username email mobile address city state zipCode')
      .populate('productId', 'title price image category');

    res.status(200).json({ message: 'Order updated', order: populated });
  } catch (err) {
    console.error('admin update order status error', err);
    res.status(500).json({ message: 'Failed to update order' });
  }
});

// Update expected delivery date for an order (admin)
admin_router.put('/orders/:id/delivery', verifyTokenMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { expectedDeliveryDate } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.expectedDeliveryDate = expectedDeliveryDate ? new Date(expectedDeliveryDate) : null;
    // mark that admin explicitly set ETA
    order.adminSetEta = !!expectedDeliveryDate;
    order.etaUpdatedAt = expectedDeliveryDate ? new Date() : undefined;
    order.etaNotified = false; // user not yet notified

    // add delivery log entry for admin ETA change
    order.deliveryLogs = order.deliveryLogs || [];
    order.deliveryLogs.push({
      status: 'eta-set',
      note: expectedDeliveryDate ? `Expected delivery set to ${new Date(expectedDeliveryDate).toLocaleString()}` : 'Expected delivery cleared',
      timestamp: new Date(),
    });

    await order.save();

    const populated = await Order.findById(order._id)
      .populate('userId', 'username email mobile address city state zipCode')
      .populate('productId', 'title price image category');

    res.status(200).json({ message: 'Expected delivery date updated', order: populated });
  } catch (err) {
    console.error('admin update expectedDeliveryDate error', err);
    res.status(500).json({ message: 'Failed to update expected delivery date' });
  }
});

export default admin_router;
