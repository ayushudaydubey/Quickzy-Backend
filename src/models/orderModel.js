// models/orderModel.js
import mongoose from 'mongoose';

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
    enum: ['pending', 'paid', 'shipped', 'delivered'],
    default: 'pending',
  }
}, {
  timestamps: true,
});

export default mongoose.model('Order', orderSchema);
