import CartModel from "../models/cart.js";
import orderModel from "../models/orderModel.js";
import Product from "../models/products.js";

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