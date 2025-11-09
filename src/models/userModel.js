import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  // password and mobile are optional to support OAuth-only users
  password: { type: String, required: false },
  mobile: { type: String, required: false },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
    dateOfBirth: { type: Date },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String },
    admin: { type: Boolean, default: false },
    cart: { type: Array, default: [] },
    // wishlist stores product ids the user has wishlisted
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

const userModel = mongoose.model('User', userSchema);
export default userModel;
