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
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const routes = express.Router()

// Public routes
routes.post("/register", registerUserController)
routes.post("/login", loginUserController)

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
    const user = await userModel.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      admin: user.admin,
    });
  } catch (error) {
    console.error("Error in /me route:", error);
    return res.status(500).json({ error: "Server error" });
  }
});





// routes.post("/product", verifyTokenMiddleware, productController)

export default routes