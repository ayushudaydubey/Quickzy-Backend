
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

// Acknowledge ETA notification for an order (user calls this to mark notified)
cartRoutes.put('/orders/:id/ack-eta', verifyTokenMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await (await import('../models/orderModel.js')).default.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // ensure the order belongs to the current user
    if (String(order.userId) !== String(req.user.id)) return res.status(403).json({ message: 'Not authorized' });

    order.etaNotified = true;
    await order.save();
    return res.status(200).json({ message: 'Acknowledged' });
  } catch (err) {
    console.error('ack-eta error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


// Cancel an order (user) within 24 hours
cartRoutes.put('/orders/:id/cancel', verifyTokenMiddleware, async (req, res) => {
  try {
    const controller = (await import('../controllers/productController.js'));
    return controller.cancelOrderController(req, res);
  } catch (err) {
    console.error('cancel order route error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


 export default cartRoutes