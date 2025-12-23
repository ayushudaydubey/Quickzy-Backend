import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js'; // added
import session from "express-session";
import passport from "passport";
import jwt from 'jsonwebtoken';
import userModel from './models/userModel.js';
// Ensure passport strategies are registered before using them
import "./services/googleAuthService.js"; // registers GoogleStrategy with passport

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname,"../public")))

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
// Start Google Auth - this redirects the browser to Google's OAuth consent page
// Accept an optional `redirect` query param and save it to session before starting OAuth
app.get(
  "/auth/google",
  (req, res, next) => {
    const redirect = req.query.redirect;
    if (redirect) {
      // store the frontend path to return to after successful auth
      req.session.oauthRedirect = redirect;
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Callback
app.get(
  "/auth/google/callback",
  // if authentication fails, redirect user to the frontend login page instead of a backend route
  passport.authenticate("google", { failureRedirect: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/login' }),
  async (req, res) => {
    // passport put profile on req.user
    try {
      const profile = req.user;
      const email = profile?.emails?.[0]?.value;
      const username = profile?.displayName || profile?.username || email?.split('@')[0];

      if (!email) {
        return res.status(400).send('No email from provider');
      }

      // find or create user in DB (omit password for OAuth-only users)
      let user = await userModel.findOne({ email });
      if (!user) {
        user = await userModel.create({
          username,
          email,
          admin: false,
          cart: []
        });
      }

      // issue JWT token (same as login route)
      const token = jwt.sign({ id: user._id, role: user.admin ? 'admin' : 'user' }, process.env.JWT_KEY, { expiresIn: '7d' });

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      };

      res.cookie('token', token, cookieOptions);

  // Redirect back to frontend (prefer the originally requested path stored in session)
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
      let redirectTo = req.session?.oauthRedirect || frontend;
      // clear it from session
      if (req.session) req.session.oauthRedirect = null;

      // If redirectTo is a relative path (starts with '/'), send user to frontend + that path
      if (typeof redirectTo === 'string' && redirectTo.startsWith('/')) {
        // ensure frontend doesn't end with '/'
        const base = frontend.replace(/\/$/, '');
        redirectTo = base + redirectTo;
      }

      return res.redirect(redirectTo);
    } catch (err) {
      console.error('Google callback error:', err);
      return res.redirect('/login');
    }
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

app.get("*name",(req,res)=>{
  res.sendFile(path.join(__dirname,"../index.html"))
})



export default app;
