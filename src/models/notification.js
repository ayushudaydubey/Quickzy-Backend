import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., 'cancellation', 'refund'
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  message: { type: String },
  status: { type: String, enum: ['new', 'read'], default: 'new' },
  expectedRefundDate: { type: Date },
  // refund processing tracking
  refundProcessed: { type: Boolean, default: false },
  refundProcessedAt: { type: Date },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
