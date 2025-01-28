// Required modules
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../../models/User')

// Registration endpoint
router.post('/register', async (req, res) => {
    const { username, email, password , role_id } = req.body;    

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const existingUser = await User.findByUsernameOrEmail(username, email);

        if (existingUser) {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username,
            email,
            password_hash: hashedPassword,
            role_id: role_id || 1,
        });

        res.status(201).json({
            message: 'User registered successfully.',
            user: newUser,
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;