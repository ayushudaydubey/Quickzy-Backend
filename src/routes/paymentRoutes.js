
import express from 'express';
import {
  createOrderController,
  verifyPaymentController,
  getPaymentStatusController,
} from '../controllers/paymentController.js';
import { verifyTokenMiddleware } from '../middelware/Auth.js';

const router = express.Router();


router.post('/create-order', verifyTokenMiddleware, createOrderController);
// Dev-only: allow unauthenticated order creation for local debugging
if (process.env.NODE_ENV === 'development') {
  router.post('/debug/create-order', createOrderController);
}
router.post('/verify', verifyTokenMiddleware, verifyPaymentController);
router.get('/status/:orderId', verifyTokenMiddleware, getPaymentStatusController);

export default router;
