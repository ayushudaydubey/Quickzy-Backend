
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';

dotenv.config();

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://quickzy-frontend.onrender.com"
  ],
  credentials: true,
}));


app.use("/", userRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);

export default app;
