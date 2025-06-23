import jwt from 'jsonwebtoken'

export const verifyTokenMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: "Access denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = decoded;
    req.userId = decoded.userId || decoded.id || decoded._id; // Add this line
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}