import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import session from "express-session";
import passport from "passport";
import jwt from 'jsonwebtoken';
import userModel from './models/userModel.js';

import "./services/googleAuthService.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "https://quickzy-real-2026.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname,"../public")));

app.use("/", userRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/payment", paymentRoutes);
app.use("/admin", adminRoutes);

app.get(
  "/auth/google",
  (req, res, next) => {
    const redirect = req.query.redirect;
    if (redirect) {
      req.session.oauthRedirect = redirect;
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`
  }),
  async (req, res) => {
    try {
      const profile = req.user;
      const email = profile?.emails?.[0]?.value;

      if (!email) {
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login`);
      }

      const username =
        profile.displayName ||
        profile.username ||
        email.split("@")[0];

      let user = await userModel.findOne({ email });

      if (!user) {
        user = await userModel.create({
          username,
          email,
          admin: false,
          cart: []
        });
      }

      const token = jwt.sign(
        { id: user._id, role: user.admin ? 'admin' : 'user' },
        process.env.JWT_KEY,
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
      let redirectTo = req.session?.oauthRedirect || frontend;

      if (req.session) req.session.oauthRedirect = null;

      if (typeof redirectTo === 'string' && redirectTo.startsWith('/')) {
        const base = frontend.replace(/\/$/, '');
        redirectTo = base + redirectTo;
      }

      return res.redirect(redirectTo);
    } catch (err) {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login`);
    }
  }
);

app.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect(process.env.FRONTEND_URL || "/");
  });
});

app.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login");
  res.send(`Hello ${req.user.displayName}`);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname,"../index.html"));
});

export default app;
