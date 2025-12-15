
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  // throw during import so server fails fast and logs clear guidance
  const msg = 'Missing Razorpay credentials: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env';
  console.error(msg);
  throw new Error(msg);
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export default razorpay;
