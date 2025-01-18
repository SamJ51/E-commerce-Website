const express = require('express');
const { verifyToken } = require('../../middlewares/authMiddleware');
const db = require('../../config/db');
const router = express.Router();

// GET /addresses: List all user addresses
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query('SELECT * FROM Addresses WHERE user_id = $1', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching addresses:', err);
        res.status(500).json({ message: 'Failed to fetch addresses' });
    }
});

// POST /addresses: Add a new address
router.post('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { street, city, state, zip_code, country, is_billing, is_shipping } = req.body;

        if (!street || !city || !state || !zip_code || !country) {
            return res.status(400).json({ message: 'Street, city, state, zip code, and country are required' });
        }

        // Basic validation for is_billing and is_shipping (must be boolean)
        if (typeof is_billing !== 'boolean' || typeof is_shipping !== 'boolean') {
            return res.status(400).json({ message: 'is_billing and is_shipping must be boolean values' });
        }
        
        const result = await db.query(
            'INSERT INTO Addresses (user_id, street, city, state, zip_code, country, is_billing, is_shipping) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [userId, street, city, state, zip_code, country, is_billing, is_shipping]
        );
        res.status(201).json({ message: 'Address added successfully', address: result.rows[0] });
    } catch (err) {
        console.error('Error adding address:', err);
        res.status(500).json({ message: 'Failed to add address' });
    }
});

// PATCH /addresses/:id: Update an address
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const addressId = parseInt(req.params.id);
        const { street, city, state, zip_code, country, is_billing, is_shipping } = req.body;

        let updates = [];
        let values = [];
        let valueIndex = 1;

        // Build the update query dynamically based on provided fields
        if (street) {
            updates.push(`street = $${valueIndex++}`);
            values.push(street);
        }
        if (city) {
            updates.push(`city = $${valueIndex++}`);
            values.push(city);
        }
        if (state) {
            updates.push(`state = $${valueIndex++}`);
            values.push(state);
        }
        if (zip_code) {
            updates.push(`zip_code = $${valueIndex++}`);
            values.push(zip_code);
        }
        if (country) {
            updates.push(`country = $${valueIndex++}`);
            values.push(country);
        }
        if (typeof is_billing === 'boolean') {
            updates.push(`is_billing = $${valueIndex++}`);
            values.push(is_billing);
        }
        if (typeof is_shipping === 'boolean') {
            updates.push(`is_shipping = $${valueIndex++}`);
            values.push(is_shipping);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No valid fields provided for update' });
        }

        values.push(addressId, userId); // Add addressId and userId for WHERE clause

        const query = `UPDATE Addresses SET ${updates.join(', ')} WHERE address_id = $${valueIndex++} AND user_id = $${valueIndex++} RETURNING *`;

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Address not found or unauthorized' });
        }

        res.json({ message: 'Address updated successfully', address: result.rows[0] });
    } catch (err) {
        console.error('Error updating address:', err);
        res.status(500).json({ message: 'Failed to update address' });
    }
});

// DELETE /addresses/:id: Delete an address
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const addressId = parseInt(req.params.id);

        const result = await db.query('DELETE FROM Addresses WHERE address_id = $1 AND user_id = $2 RETURNING *', [addressId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Address not found or unauthorized' });
        }

        res.json({ message: 'Address deleted successfully' });
    } catch (err) {
        console.error('Error deleting address:', err);
        res.status(500).json({ message: 'Failed to delete address' });
    }
});

module.exports = router;