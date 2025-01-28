const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  let token;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7, authHeader.length); // Extract after "Bearer "
  }

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = {
      id: user.user_id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
    };

    console.log(req.user); // Log after req.user is set

    next();
  } catch (error) {
    console.error('Error in verifyToken middleware:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    } else {
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }
};

module.exports = { verifyToken };