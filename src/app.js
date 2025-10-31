import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js'; // added
import session from "express-session";
import passport from "passport";
// Ensure passport strategies are registered before using them
import "./services/googleAuthService.js"; // registers GoogleStrategy with passport

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());



const allowedOrigins = [
  "http://localhost:5173",
  "https://quickzy-frontend.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));



// app.use("/", userRoutes);
// app.use("/products", productRoutes);
// app.use("/cart", cartRoutes);


app.use("/", userRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/payment", paymentRoutes);
app.use("/admin", adminRoutes); // new admin routes

// Start Google Auth
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google Callback
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful login
    res.redirect("/profile");
  }
);

// Logout
app.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});

// Protected route
app.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login");
  res.send(`Hello ${req.user.displayName}`);
});



export default app;
