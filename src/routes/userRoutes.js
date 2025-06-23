import express from 'express'
import { 
  loginUserController, 
  registerUserController,
  logoutController,
  adminController,
  getUserProfile,
 
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

// Express.js example

routes.get('/me', verifyTokenMiddleware, async (req, res) => {
  try {
  
    const user = await userModel.findById(req.userId).select('username email admin mobile gender');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Transform the admin boolean to role string for frontend compatibility
    const userData = {
      ...user.toObject(),
      role: user.admin ? 'admin' : 'user'
    };
    
    res.json(userData);
  } catch (error) {
    console.error('Error in /me route:', error);
    res.status(500).json({ error: "Server error" });
  }
});




// routes.post("/product", verifyTokenMiddleware, productController)

export default routes