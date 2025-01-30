const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middlewares/authMiddleware');
const User = require('../../models/User');

// Get current user's profile
router.get('/', verifyToken, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // If user is found, return their details
      res.status(200).json({
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Update user profile
router.patch('/', verifyToken, async (req, res) => {
    const { username, email } = req.body;
  
    // 1) If no fields were passed in the request:
    if (!username && !email) {
      return res.status(400).json({
        message: 'At least one field (username or email) is required to update.',
      });
    }
  
    try {
      const updatedUser = await User.update(req.user.id, { username, email });
  
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found!' });
      }
  
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

module.exports = router;