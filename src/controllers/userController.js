import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import userModel from "../models/userModel.js";

dotenv.config();

export const registerUserController = async (req, res) => {
  try {
    const {
      username,
      gender,
      email,
      mobile,
      password,
      dateOfBirth,
      address,
      city,
      state,
      zipCode,
      country
    } = req.body;

    // Basic validations
    if (!username || !gender || !email || !mobile || !password) {
      return res.status(400).json({ error: "All required fields must be filled" });
    }

    if (!email.endsWith('@gmail.com')) {
      return res.status(400).json({ error: "Email must be a Gmail address" });
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ error: "Mobile must start with 6, 7, 8, or 9 and be 10 digits long" });
    }

    const existingEmail = await userModel.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ error: "This email is already registered" });
    }

    const existingUsername = await userModel.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
      username,
      gender,
      email,
      mobile,
      password: hashedPassword,
      dateOfBirth,
      address,
      city,
      state,
      zipCode,
      country,
      admin: false,
      cart: [],
    });
    // Issue JWT and set cookie so user is authenticated immediately after registration
    const token = jwt.sign(
      { id: newUser._id, role: newUser.admin ? 'admin' : 'user' },
      process.env.JWT_KEY,
      { expiresIn: '7d' }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        gender: newUser.gender,
        dateOfBirth: newUser.dateOfBirth,
        address: newUser.address,
        city: newUser.city,
        state: newUser.state,
        zipCode: newUser.zipCode,
        country: newUser.country,
        admin: newUser.admin,
      },
      token,
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const loginUserController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const userExist = await userModel.findOne({ email });
    if (!userExist) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user has a password (OAuth-only users won't have one)
    if (!userExist.password) {
      return res.status(401).json({ error: "This account uses social login. Please use Google Sign-In" });
    }

    const verifyUser = await bcrypt.compare(password, userExist.password);
    if (!verifyUser) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: userExist._id,
        role: userExist.admin ? 'admin' : 'user'
      },
      process.env.JWT_KEY,
      { expiresIn: '7d' }
    );


    res.cookie("token", token, {
      httpOnly: true,
      // only set secure cookies in production (localhost/http won't accept secure cookies)
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: userExist._id,
        username: userExist.username,
        email: userExist.email,
        admin: userExist.admin,
      },
      token,
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};


export const logoutController = (req, res) => {
  res.clearCookie("token")
  return res.status(200).json({ message: "Logged out successfully" });
}

export const getUserProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
}

// Update profile of authenticated user
export const updateUserProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updatableFields = ['username','email','mobile','dateOfBirth','gender','address','city','state','zipCode','country'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    // handle password update explicitly
    if (req.body.password) {
      const hashed = await bcrypt.hash(req.body.password, 10);
      user.password = hashed;
    }

    await user.save();

    const returned = user.toObject();
    delete returned.password;

    return res.status(200).json({ message: 'Profile updated', user: returned });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

export const adminController = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_KEY);

    const user = await userModel.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      id: user._id,
      username: user.username,
      role: user.admin ? 'admin' : 'user',
    });
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: 'Invalid token' });
  }
}