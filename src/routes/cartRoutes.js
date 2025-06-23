
import express from 'express'
import { verifyTokenMiddleware } from '../middelware/Auth.js';
import { cartController, createOrderController, myOrder } from '../controllers/productController.js';
// import { createOrder } from '../controllers/orderController.js';
  const cartRoutes = express.Router();

 cartRoutes.post("/add-to-cart",verifyTokenMiddleware,cartController)
 
cartRoutes.post('/create', verifyTokenMiddleware, createOrderController);

cartRoutes.get('/orders', verifyTokenMiddleware,myOrder)



 export default cartRoutes