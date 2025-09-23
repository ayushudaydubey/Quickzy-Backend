import express from 'express';
import { verifyTokenMiddleware } from '../middelware/Auth.js';
import isAdmin from '../middelware/isAdmin.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Product from '../models/products.js';

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

export default admin_router;