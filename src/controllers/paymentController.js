// ...existing code...
import crypto from 'crypto';
import razorpay from '../services/razorpayService.js';
import Payment from '../models/paymentModel.js';

// Create Razorpay order
export const createOrderController = async (req, res) => {
  try {
    const { amount, currency = 'INR', meta } = req.body;
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // amount expected in rupees from client -> convert to paise
    const amountInPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency,
      payment_capture: 1,
      notes: meta || {},
    };

    const order = await razorpay.orders.create(options);

    await Payment.create({
      orderId: order.id,
      userId: req.user?.id || undefined,
      amount: order.amount / 100,
      currency: order.currency,
      status: 'pending',
      meta,
    });

    // Return the order and the public key_id so the frontend uses the same key
    return res.status(201).json({ order, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('createOrderController error', err);
    // Include any Razorpay error details when available to aid debugging
    const details = err && (err.error || err.description || err.message) ? (err.error || err.description || err.message) : err;
    return res.status(500).json({ error: 'Could not create order', details });
  }
};

// Verify payment signature and update DB
export const verifyPaymentController = async (req, res) => {
  try {
    // Accept multiple key names for compatibility with different clients
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpayOrderId,
      razorpayPaymentId,
      signature,
    } = req.body;

    const orderId = razorpay_order_id || razorpayOrderId;
    const paymentId = razorpay_payment_id || razorpayPaymentId;
    const sig = razorpay_signature || signature;

    if (!orderId || !paymentId || !sig) {
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(orderId + '|' + paymentId);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== sig) {
      // mark payment failed
      await Payment.findOneAndUpdate({ orderId }, { status: 'failed', paymentId, signature: sig }, { new: true });
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const payment = await Payment.findOneAndUpdate(
      { orderId },
      { paymentId, signature: sig, status: 'completed' },
      { new: true }
    );

    return res.status(200).json({ status: 'success', payment });
  } catch (err) {
    console.error('verifyPaymentController error', err);
    return res.status(500).json({ error: 'Verification failed', details: err.message });
  }
};

// Optional: get payment status
export const getPaymentStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({ orderId });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    return res.status(200).json(payment);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};
// ...existing code...