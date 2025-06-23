import jwt from 'jsonwebtoken';

export const verifyTokenMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Access denied: No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = decoded;
    req.userId = decoded.id || decoded.userId || decoded._id;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
