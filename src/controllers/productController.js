import CartModel from "../models/cart.js";
import orderModel from "../models/orderModel.js";
import Product from "../models/products.js";
import User from "../models/userModel.js";

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

    // support passing payment metadata to make order creation idempotent
    const paymentOrderId = req.body.payment?.orderId || req.body.paymentOrderId || req.body.payment_order_id;

    // if paymentOrderId is provided, check whether an order for this payment already exists
    if (paymentOrderId) {
      const existing = await orderModel.findOne({ paymentOrderId });
      if (existing) {
        return res.status(200).json({ message: 'Order already exists for this payment', order: existing });
      }
    }

    // Defensive duplicate check: if user recently created the same order within a short window,
    // return the existing order instead of creating a duplicate (prevents double-click/double-submit)
    try {
      const recentWindowMs = 30 * 1000; // 30 seconds
      const recentDuplicate = await orderModel.findOne({
        userId: req.user.id,
        productId,
        total,
        status: 'pending',
        createdAt: { $gte: new Date(Date.now() - recentWindowMs) },
      });
      if (recentDuplicate) {
        return res.status(200).json({ message: 'Duplicate order prevented', order: recentDuplicate });
      }
    } catch (dupErr) {
      console.error('Duplicate order check failed', dupErr);
    }

    // compute expected delivery date:
    // - if admin explicitly provided `expectedDeliveryDate`, use that
    // - else if this request includes `payment` (quick checkout), default to 3 days
    // - else prefer product.estimatedDeliveryDays, fallback to 7 days
    let expectedDeliveryDate = null;
    const adminProvidedDate = req.body.expectedDeliveryDate;
    if (adminProvidedDate) {
      expectedDeliveryDate = new Date(req.body.expectedDeliveryDate);
    } else if (req.body.payment) {
      // quick checkout via payment -> promise delivery in 3 days
      expectedDeliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
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
      paymentOrderId: paymentOrderId || undefined,
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

    // normalize response so frontend receives product details and a clear orderId
    const result = orders.map((o) => {
      const prod = o.productId || null;
      const product = prod ? {
        _id: prod._id,
        title: prod.title,
        description: prod.description,
        images: prod.images || [],
        price: prod.price,
      } : null;

      return {
        orderId: o._id,
        product,
        quantity: o.quantity,
        customer: o.customer,
        total: o.total,
        status: o.status,
        expectedDeliveryDate: o.expectedDeliveryDate,
        createdAt: o.createdAt,
        deliveryLogs: o.deliveryLogs,
      };
    });

    res.status(200).json({ orders: result });
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