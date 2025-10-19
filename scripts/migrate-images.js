import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../src/models/products.js';

dotenv.config();

const MONGO = process.env.MONGO_DB_URL;

async function migrate() {
  if (!MONGO) {
    console.error('MONGO_DB_URL not set in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  const products = await Product.find({ $or: [ { images: { $exists: false } }, { images: { $size: 0 } } ] });
  console.log(`Found ${products.length} products to migrate`);

  for (const p of products) {
    if (p.image) {
      p.images = [p.image];
      p.image = undefined;
      await p.save();
      console.log(`Migrated product ${p._id}`);
    }
  }

  console.log('Migration complete');
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});