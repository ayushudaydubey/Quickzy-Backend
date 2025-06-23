import express  from 'express'
const app = express();
import dotenv from 'dotenv'
dotenv.config()
import cors from 'cors'
import routes from './routes/userRoutes.js';
import cookieParser from 'cookie-parser';
import product_routes from './routes/productRoutes.js';
import cart_routes from './routes/cartRoutes.js'
import jwt from 'jsonwebtoken'



app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "http://localhost:5173",
  credentials:true,
}))
app.use(cookieParser());




app.use("/",routes)
app.use("/products",product_routes)
app.use("/cart",cart_routes)


export default app