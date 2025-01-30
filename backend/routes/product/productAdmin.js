const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { verifyToken } = require('../../middlewares/authMiddleware');

// --------------- MIDDLEWARE ---------------
function adminCheck(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    if (req.user.role_id !== 2) {
        return res.status(403).json({ message: 'Forbidden: Admins only.' });
    }
    next();
}

// --------------- POST /products ---------------
router.post('/', verifyToken, adminCheck, async (req, res) => {
    try {
        const { name, price, stock } = req.body;
        if (!name || !price || !stock) {
            return res.status(400).json({ 
                message: 'Missing required fields: name, price, stock' 
            });
        }

        const insertQuery = `
            INSERT INTO Products (name, price, stock)
            VALUES ($1, $2, $3)
            RETURNING product_id, name, price, stock
        `;
        const values = [name, price, stock];
        const result = await db.query(insertQuery, values);

        return res.status(201).json({
            message: 'Product created successfully.',
            product: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ 
            message: 'Failed to create product.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// --------------- PATCH /products/:id ---------------
router.patch('/:id', verifyToken, adminCheck, async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({ message: 'Invalid product ID format.' });
        }

        const updatableFields = ['name', 'price', 'stock', 'description', 'main_image_url'];
        const updates = {};
        for (const field of updatableFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ 
                message: 'No valid fields provided for update.' 
            });
        }

        const setClauses = [];
        const values = [];
        let paramIndex = 1;
        for (const [field, value] of Object.entries(updates)) {
            setClauses.push(`${field} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
        values.push(productId);

        const updateQuery = `
            UPDATE Products
            SET ${setClauses.join(', ')}
            WHERE product_id = $${paramIndex}
            RETURNING product_id, name, price, stock, description, main_image_url
        `;

        const result = await db.query(updateQuery, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        return res.json({
            message: 'Product updated successfully.',
            product: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ 
            message: 'Failed to update product.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// --------------- DELETE /products/:id ---------------
router.delete('/:id', verifyToken, adminCheck, async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({ message: 'Invalid product ID format.' });
        }

        const deleteQuery = `
            DELETE FROM Products
            WHERE product_id = $1
            RETURNING product_id
        `;
        const result = await db.query(deleteQuery, [productId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        return res.json({
            message: 'Product deleted successfully.'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ 
            message: 'Failed to delete product.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;