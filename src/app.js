import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import session from "express-session";
import passport from "passport";
import jwt from "jsonwebtoken";

import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userModel from "./models/userModel.js";
import "./services/googleAuthService.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = process.env.RENDER ? "production" : "development";
}

if (process.env.NODE_ENV === "production") {
  console.log("\n🚀 [PRODUCTION MODE] Starting server...");
  console.log(`[ENV] EMAIL: ${process.env.EMAIL ? "✓ SET" : "❌ NOT SET"}`);
  console.log(`[ENV] EMAIL_PASS: ${process.env.EMAIL_PASS ? "✓ SET" : "❌ NOT SET"}`);
  console.log(`[ENV] MONGO_DB_URL: ${process.env.MONGO_DB_URL ? "✓ SET" : "❌ NOT SET"}`);
  console.log(`[ENV] RAZORPAY_KEY_ID: ${process.env.RAZORPAY_KEY_ID ? "✓ SET" : "❌ NOT SET"}`);
  console.log(`[ENV] JWT_KEY: ${process.env.JWT_KEY ? "✓ SET" : "❌ NOT SET"}`);
  console.log(`[ENV] FRONTEND_URL: ${process.env.FRONTEND_URL}`);
}

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
  "https://quickzy-real-2026.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use("/", userRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/payment", paymentRoutes);
app.use("/admin", adminRoutes);

app.get(
  "/auth/google",
  (req, res, next) => {
    if (req.query.redirect) {
      req.session.oauthRedirect = req.query.redirect;
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect:
      (process.env.FRONTEND_URL || "http://localhost:5173") + "/login",
  }),
  async (req, res) => {
    try {
      const profile = req.user;
      const email = profile?.emails?.[0]?.value;
      const username = profile?.displayName || email?.split("@")[0];

      if (!email) return res.status(400).send("No email from provider");

      let user = await userModel.findOne({ email });
      if (!user) {
        user = await userModel.create({
          username,
          email,
          admin: false,
          cart: [],
        });
      }

      const token = jwt.sign(
        { id: user._id, role: user.admin ? "admin" : "user" },
        process.env.JWT_KEY,
        { expiresIn: "7d" }
      );

      const isProduction = process.env.NODE_ENV === "production";

      res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "Lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      const frontend = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
      let redirectTo = req.session.oauthRedirect || frontend;
      req.session.oauthRedirect = null;

      if (redirectTo.startsWith("/")) {
        redirectTo = frontend + redirectTo;
      }

      return res.redirect(redirectTo);
    } catch (err) {
      console.error(err);
      return res.redirect("/login");
    }
  }
);

app.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/test-email", async (req, res) => {
  try {
    const { sendDeliveryEmail } = await import("./services/nodemailer.js");

    await sendDeliveryEmail(
      process.env.EMAIL,
      "TEST-" + Date.now(),
      new Date(),
      { title: "Test Product", price: 999 }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
});

app.get("/debug-email", (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    EMAIL_SET: !!process.env.EMAIL,
    EMAIL_PASS_SET: !!process.env.EMAIL_PASS,
    EMAIL_PASS_LENGTH: process.env.EMAIL_PASS?.length || 0,
    timestamp: new Date().toISOString(),
  });
});

export default app;
