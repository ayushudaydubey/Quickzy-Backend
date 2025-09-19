
import express from 'express';
import {
  createOrderController,
  verifyPaymentController,
  getPaymentStatusController,
} from '../controllers/paymentController.js';
import { verifyTokenMiddleware } from '../middelware/Auth.js';

const router = express.Router();


router.post('/create-order', verifyTokenMiddleware, createOrderController);
router.post('/verify', verifyTokenMiddleware, verifyPaymentController);
router.get('/status/:orderId', verifyTokenMiddleware, getPaymentStatusController);

export default router;
