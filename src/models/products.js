import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  images: {
    type: [String],
    required: true,
    validate: v => Array.isArray(v) && v.length > 0,
  },
  price: {
    type: Number,
    required: true,
  },

  // New field for category
  category: {
    type: String,
    enum: [
      'Fashion',
      'Technology',
      'Home & Living',
      'Food & Wellness',
      'Accessories',
      'Beauty',
      'Other'
    ],
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model('Product', productSchema);

export default Product;
