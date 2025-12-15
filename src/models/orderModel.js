// models/orderModel.js
import mongoose from 'mongoose';

const deliveryLogSchema = new mongoose.Schema({
  status: { type: String },
  note: { type: String },
  location: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 1 },
  customer: {
    name: String,
    address: String,
    phone: String,
  },
  total: Number,
  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'out-for-delivery', 'delivered', 'failed'],
    default: 'pending',
  },
  // Added fields for admin delivery tracking
  deliveryAttempts: { type: Number, default: 0 },
  deliveryLogs: [deliveryLogSchema],
  deliveredAt: { type: Date },
  expectedDeliveryDate: { type: Date },
  // Whether ETA was explicitly set by an admin
  adminSetEta: { type: Boolean, default: false },
  // When ETA was last updated by admin
  etaUpdatedAt: { type: Date },
  // Whether the user has been notified of the ETA change
  etaNotified: { type: Boolean, default: false },
  // Reference to external payment order (e.g. Razorpay order id) to make creation idempotent
  paymentOrderId: { type: String, index: true },
}, {
  timestamps: true,
});

export default mongoose.model('Order', orderSchema);
