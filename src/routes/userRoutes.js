import express from 'express'
import { 
  loginUserController, 
  registerUserController,
  logoutController,
  adminController,
  getUserProfile,
  updateUserProfile,
} from '../controllers/userController.js'
import { verifyTokenMiddleware } from '../middelware/Auth.js'
import { validateLogin, validateRegister } from '../middelware/validateInput.js'
import { loginLimiter, registerLimiter } from '../middelware/rateLimiter.js'
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const routes = express.Router()

// Public routes
routes.post("/register", registerLimiter, validateRegister, registerUserController)
routes.post("/login", loginLimiter, validateLogin, loginUserController)

// Protected routes
routes.post("/logout", verifyTokenMiddleware, logoutController)
routes.post("/admin",verifyTokenMiddleware,adminController)
// routes.get("/profile", verifyTokenMiddleware, getUserProfile)

routes.get('/profile', verifyTokenMiddleware, getUserProfile);

// Update the authenticated user's profile
routes.put('/profile', verifyTokenMiddleware, async (req, res) => {
  // delegate to controller method
  try {
    // reuse controller function
    await updateUserProfile(req, res);
  } catch (err) {
    console.error('PUT /profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Express.js example

routes.get('/me', verifyTokenMiddleware, async (req, res) => {
  try {
    console.log('[/me] Fetching user profile:', {
      userId: req.user?.id,
      cookies: req.cookies ? Object.keys(req.cookies) : 'no cookies',
      tokenExists: !!req.cookies?.token,
    });

    const user = await userModel.findById(req.user.id).select('-password');
    
    if (!user) {
      console.error('[/me] User not found in database:', req.user.id);
      return res.status(404).json({ error: "User not found" });
    }

    const responseData = {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        admin: user.admin,
      }
    };

    console.log('[/me] Returning user:', responseData);
    return res.status(200).json(responseData);
  } catch (error) {
    console.error("[/me] Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});





// routes.post("/product", verifyTokenMiddleware, productController)

export default routes