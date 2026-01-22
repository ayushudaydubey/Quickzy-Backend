import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure NODE_ENV is set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = process.env.RENDER ? 'production' : 'development';
}

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

// =========================
// PRODUCTION DEBUG LOGGING
// =========================
if (process.env.NODE_ENV === 'production') {
  console.log('\n🚀 [PRODUCTION MODE] Starting server...');
  console.log(`[ENV] EMAIL: ${process.env.EMAIL ? '✓ SET' : '❌ NOT SET'}`);
  console.log(`[ENV] EMAIL_PASS: ${process.env.EMAIL_PASS ? '✓ SET' : '❌ NOT SET'}`);
  console.log(`[ENV] MONGO_DB_URL: ${process.env.MONGO_DB_URL ? '✓ SET' : '❌ NOT SET'}`);
  console.log(`[ENV] RAZORPAY_KEY_ID: ${process.env.RAZORPAY_KEY_ID ? '✓ SET' : '❌ NOT SET'}`);
  console.log(`[ENV] JWT_KEY: ${process.env.JWT_KEY ? '✓ SET' : '❌ NOT SET'}`);
  console.log(`[ENV] FRONTEND_URL: ${process.env.FRONTEND_URL}`);
}

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
  "https://quickzy-real-2026.vercel.app"
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

      console.log('[Google OAuth] User authenticated:', { email, username });

      if (!email) {
        return res.status(400).send('No email from provider');
      }

      // find or create user in DB (omit password for OAuth-only users)
      let user = await userModel.findOne({ email });
      if (!user) {
        console.log('[Google OAuth] Creating new user:', email);
        user = await userModel.create({
          username,
          email,
          admin: false,
          cart: []
        });
      } else {
        console.log('[Google OAuth] User already exists:', email);
      }

      // issue JWT token (same as login route)
      const token = jwt.sign({ id: user._id, role: user.admin ? 'admin' : 'user' }, process.env.JWT_KEY, { expiresIn: '7d' });

      const isProduction = process.env.NODE_ENV === 'production';
      
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction, // Only secure in production (requires HTTPS)
        sameSite: 'Lax', // Lax allows cookies in cross-site contexts like OAuth redirects
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/', // Ensure cookie is available to all routes
      };

      console.log(`[OAuth] Setting token cookie with options:`, {
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        isProduction,
        NODE_ENV: process.env.NODE_ENV,
      });

      res.cookie('token', token, cookieOptions);

      // Redirect back to frontend (prefer the originally requested path stored in session)
      const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
      let redirectTo = req.session?.oauthRedirect;
      
      // clear it from session
      if (req.session) req.session.oauthRedirect = null;

      // If no redirect path was stored, default to frontend home
      if (!redirectTo) {
        redirectTo = frontend;
      } else if (typeof redirectTo === 'string' && redirectTo.startsWith('/')) {
        // If redirectTo is a relative path, prepend the frontend URL
        redirectTo = frontend + redirectTo;
      }

      console.log('[OAuth] Redirecting to:', redirectTo);
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

// ===== HEALTH CHECK & DEBUG ENDPOINTS =====
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    envVarsLoaded: {
      EMAIL: !!process.env.EMAIL,
      EMAIL_PASS: !!process.env.EMAIL_PASS,
      MONGO_DB_URL: !!process.env.MONGO_DB_URL,
      RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
    }
  });
});

// Test email sending
app.get("/test-email", async (req, res) => {
  try {
    if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
      return res.status(400).json({ 
        error: "Email credentials not configured",
        details: {
          EMAIL_set: !!process.env.EMAIL,
          EMAIL_PASS_set: !!process.env.EMAIL_PASS
        }
      });
    }

    const { sendDeliveryEmail } = await import('./services/nodemailer.js');
    await sendDeliveryEmail(
      process.env.EMAIL, 
      'TEST-' + Date.now(), 
      new Date(Date.now() + 86400000),
      { title: 'Test Product', price: 999 }
    );
    res.json({ 
      success: true, 
      message: 'Test email sent to ' + process.env.EMAIL,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[TEST-EMAIL] Error:', err);
    res.status(500).json({ 
      error: err.message, 
      code: err.code,
      details: process.env.NODE_ENV === 'production' ? undefined : err.toString()
    });
  }
});

// Debug email configuration
app.get("/debug-email", (req, res) => {
  const emailSet = !!process.env.EMAIL;
  const passSet = !!process.env.EMAIL_PASS;
  
  res.json({
    environment: process.env.NODE_ENV,
    EMAIL_configured: emailSet ? 'YES ✓' : 'NO ✗',
    EMAIL_value: emailSet ? process.env.EMAIL : 'NOT SET',
    EMAIL_PASS_configured: passSet ? 'YES ✓' : 'NO ✗',
    EMAIL_PASS_length: passSet ? process.env.EMAIL_PASS.length : 0,
    FRONTEND_URL: process.env.FRONTEND_URL,
    timestamp: new Date().toISOString(),
    status: emailSet && passSet ? 'READY' : 'NOT_CONFIGURED',
    instructions: !emailSet || !passSet ? 'Add EMAIL and EMAIL_PASS to Render Environment variables' : 'Ready to send emails'
  });
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
