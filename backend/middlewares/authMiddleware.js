const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming you have a User model

// Middleware to verify JWT token and fetch the user
const verifyToken = async (req, res, next) => {

    console.log(req.user);

  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from the database based on the decoded user ID
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' }); // Not found in the database
    }

    // Attach the user object (or just the user ID) to the request object
    req.user = {
      id: user.user_id,       // Assuming your user object has a 'user_id' field
      username: user.username, // Example: Add other properties as needed
      email: user.email,        // Example
      role_id: user.role_id      // Example
    };

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Error in verifyToken middleware:", error);
    res.status(401).json({ message: 'Invalid token.' }); // 401 for invalid token
  }
};

module.exports = { verifyToken };