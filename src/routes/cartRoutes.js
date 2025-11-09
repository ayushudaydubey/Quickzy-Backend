
import express from 'express'
import { verifyTokenMiddleware } from '../middelware/Auth.js';
import { cartController, createOrderController, myOrder, getCartController, getWishlistController, addToWishlistController, removeFromWishlistController } from '../controllers/productController.js';
// import { createOrder } from '../controllers/orderController.js';
  const cartRoutes = express.Router();

cartRoutes.post("/add-to-cart",verifyTokenMiddleware,cartController)

// Get current user's cart
cartRoutes.get('/', verifyTokenMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await (await import('../models/cart.js')).default.findOne({ userId }).populate('items.productId', 'title price images');
    if (!cart) return res.status(200).json({ items: [] });
    return res.status(200).json({ items: cart.items });
  } catch (err) {
    console.error('Get cart error', err);
    return res.status(500).json({ message: 'Failed to get cart' });
  }
});
 
cartRoutes.post('/create', verifyTokenMiddleware, createOrderController);

cartRoutes.get('/orders', verifyTokenMiddleware,myOrder)

// Wishlist routes
cartRoutes.get('/wishlist', verifyTokenMiddleware, getWishlistController);
cartRoutes.post('/wishlist/add', verifyTokenMiddleware, addToWishlistController);
cartRoutes.delete('/wishlist/:productId', verifyTokenMiddleware, removeFromWishlistController);



 export default cartRoutes