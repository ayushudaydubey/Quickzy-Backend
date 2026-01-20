import jwt from 'jsonwebtoken';

export const verifyTokenMiddleware = (req, res, next) => {
  // Support token from cookie OR Authorization header (Bearer) to avoid cross-site cookie issues in dev
  let token = null;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('[Auth] Token found in cookies');
  }
  else if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('[Auth] Token found in Authorization header');
  }

  if (!token) {
    console.error('[Auth] No token provided - cookies:', Object.keys(req.cookies || {}), 'headers:', req.headers?.authorization ? 'present' : 'absent');
    return res.status(401).json({ error: "Access denied: No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = decoded;
    req.userId = decoded.id || decoded.userId || decoded._id;
    console.log('[Auth] Token verified for user:', req.userId);
    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};
