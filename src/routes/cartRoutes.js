
import express from 'express'
import { verifyTokenMiddleware } from '../middelware/Auth.js';
import { cartController, createOrderController, myOrder, getCartController } from '../controllers/productController.js';
// import { createOrder } from '../controllers/orderController.js';
  const cartRoutes = express.Router();

cartRoutes.post("/add-to-cart",verifyTokenMiddleware,cartController)

// Remove single product from cart
cartRoutes.delete('/item/:productId', verifyTokenMiddleware, async (req, res) => {
  try {
    const controller = (await import('../controllers/productController.js'));
    return controller.removeFromCartController(req, res);
  } catch (err) {
    console.error('remove cart route error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

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



 export default cartRoutes