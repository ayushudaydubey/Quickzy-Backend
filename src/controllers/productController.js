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

    const order = new orderModel({
      userId: req.user.id,
      productId,
      quantity,
      customer,
      total,
      status: 'pending',
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
      .populate('productId', 'title description image price') 
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

// Wishlist controllers
export const getWishlistController = async (req, res) => {
  try {
    const userId = req.user.id;
  const user = await User.findById(userId).populate('wishlist', 'title price images description');
    if (!user) return res.status(200).json({ items: [] });
    return res.status(200).json({ items: user.wishlist || [] });
  } catch (err) {
    console.error('getWishlistController error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const addToWishlistController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const exists = (user.wishlist || []).some((p) => String(p) === String(productId));
    if (!exists) {
      user.wishlist = user.wishlist || [];
      user.wishlist.push(productId);
      await user.save();
    }

  const populated = await User.findById(userId).populate('wishlist', 'title price images description');
    return res.status(200).json({ items: populated.wishlist || [] });
  } catch (err) {
    console.error('addToWishlistController error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const removeFromWishlistController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    if (!productId) return res.status(400).json({ message: 'productId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.wishlist = (user.wishlist || []).filter((p) => String(p) !== String(productId));
    await user.save();

  const populated = await User.findById(userId).populate('wishlist', 'title price images description');
    return res.status(200).json({ items: populated.wishlist || [] });
  } catch (err) {
    console.error('removeFromWishlistController error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};