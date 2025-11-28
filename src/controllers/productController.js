import CartModel from "../models/cart.js";
import orderModel from "../models/orderModel.js";
import Product from "../models/products.js";
import User from "../models/userModel.js";
import Notification from "../models/notification.js";

export const cartController  =  async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity = 1 } = req.body;
  try {
    let cart = await CartModel.findOne({ userId });

    if (!cart) {

      cart = new CartModel({
        userId,
        items: [{ productId, quantity }],
      });
    } else {
     
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (itemIndex > -1) {
   
        cart.items[itemIndex].quantity += quantity;
      } else {
      
        cart.items.push({ productId, quantity });
      }
    }


    await cart.save();
    // populate product info for frontend convenience
    await cart.populate('items.productId', 'title price images');
    return res.status(200).json(cart);
  } catch (err) {
    console.error('cartController error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// controllers/orderController.js


export const createOrderController = async (req, res) => {
  try {
    const { productId, quantity, customer, total } = req.body;

    // compute expected delivery date: prefer explicit value from request, else product.estimatedDeliveryDays, else default 7 days
    let expectedDeliveryDate = null;
    const adminProvidedDate = req.body.expectedDeliveryDate;
    if (adminProvidedDate) {
      expectedDeliveryDate = new Date(req.body.expectedDeliveryDate);
    } else {
      try {
        const prod = await Product.findById(productId).select('estimatedDeliveryDays');
        const days = (prod && prod.estimatedDeliveryDays) ? Number(prod.estimatedDeliveryDays) : 7;
        expectedDeliveryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      } catch (err) {
        expectedDeliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
    }

    const order = new orderModel({
      userId: req.user.id,
      productId,
      quantity,
      customer,
      total,
      status: 'pending',
      expectedDeliveryDate,
      adminSetEta: !!adminProvidedDate,
      etaUpdatedAt: adminProvidedDate ? new Date() : undefined,
      etaNotified: false,
    });

    await order.save();

    return res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const myOrder = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.user.id })
      .populate('productId', 'title description images price') 
      .sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const searchProduct = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (search) {
      filter.title = { $regex: search, $options: 'i' }; // case-insensitive partial match
    }

    if (category) {
      filter.category = category;
    }

    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    console.error('Failed to fetch products', err);
    res.status(500).json({ message: "Failed to fetch products." });
  }
};

export const getCartController = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await CartModel.findOne({ userId }).populate('items.productId', 'title price images');
    if (!cart) return res.status(200).json({ items: [] });
    return res.status(200).json({ items: cart.items });
  } catch (err) {
    console.error('getCartController error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Remove product from cart (by productId)
export const removeFromCartController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    if (!productId) return res.status(400).json({ message: 'productId is required' });

    const cart = await CartModel.findOne({ userId });
    if (!cart) return res.status(200).json({ items: [] });

    // remove all entries matching productId
    cart.items = (cart.items || []).filter((it) => String(it.productId) !== String(productId));
    await cart.save();
    await cart.populate('items.productId', 'title price images');
    return res.status(200).json({ items: cart.items });
  } catch (err) {
    console.error('removeFromCartController error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// wishlist functionality removed

export const cancelOrderController = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const order = await orderModel.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // ensure the order belongs to the current user
    if (String(order.userId) !== String(req.user.id)) return res.status(403).json({ message: 'Not authorized' });

    if (order.canceled) return res.status(400).json({ message: 'Order already canceled' });

    // disallow cancellation after shipping/delivery
    if (['shipped', 'out-for-delivery', 'delivered'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel order after it has been shipped/delivered' });
    }

    // allow cancellation only within 24 hours of creation
    const createdAt = order.createdAt ? new Date(order.createdAt).getTime() : null;
    if (!createdAt) return res.status(400).json({ message: 'Invalid order date' });

    const msSince = Date.now() - createdAt;
    const windowMs = 24 * 60 * 60 * 1000; // 24 hours
    if (msSince > windowMs) return res.status(400).json({ message: 'Cancellation window (24 hours) has expired' });

    order.canceled = true;
    order.canceledAt = new Date();
    order.cancellationReason = reason || '';
    order.canceledBy = 'user';
    order.canceledById = req.user.id;
    order.status = 'canceled';

    order.deliveryLogs = order.deliveryLogs || [];
    order.deliveryLogs.push({
      status: 'canceled',
      note: reason || 'Canceled by user within allowed window',
      timestamp: new Date(),
    });

    await order.save();

    // Create a notification record for admins so they can process refunds
    try {
      const expectedRefundDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await Notification.create({
        type: 'cancellation',
        orderId: order._id,
        userId: order.userId,
        productId: order.productId,
        message: `User canceled order ${order._id}. Refund expected within 5-7 business days.`,
        expectedRefundDate,
      });
    } catch (notifyErr) {
      console.error('Failed to create admin notification for cancellation', notifyErr);
    }

    return res.status(200).json({ message: 'Order canceled successfully', order });
  } catch (err) {
    console.error('cancelOrderController error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};