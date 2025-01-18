// authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

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
    res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = { verifyToken };