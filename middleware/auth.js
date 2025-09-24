const { auth } = require('../config/firebase');
const db = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    const decodedToken = await auth.verifyIdToken(token);

    // Get the user record from our database to include the internal user ID
    const users = await db.findBy('users', { uid: decodedToken.uid });
    const dbUser = users.length > 0 ? users[0] : null;

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      id: dbUser ? dbUser.id : null,
      role: dbUser ? dbUser.role : null,
      name: dbUser ? dbUser.name : null
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};