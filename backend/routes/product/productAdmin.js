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
// Adds a new product (Admin only)
router.post('/', verifyToken, adminCheck, async (req, res) => {
    try {
        // Basic validation
        const { name, description, price, stock, main_image_url } = req.body;
        if (!name || !description || !price || !stock) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        // Insert product into DB
        const insertQuery = `
            INSERT INTO Products (name, description, price, stock, main_image_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING product_id AS id, name, description, price, stock, main_image_url, created_at, updated_at
        `;
        const values = [name, description, price, stock, main_image_url || null];
        const result = await db.query(insertQuery, values);

        return res.status(201).json({
            message: 'Product created successfully.',
            product: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ message: 'Failed to create product.' });
    }
});

// --------------- PATCH /products/:id ---------------
// Updates an existing product (Admin only)
router.patch('/:id', verifyToken, adminCheck, async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: 'Invalid product ID.' });
        }

        // At least one field must be updatable
        const updatableFields = ['name', 'description', 'price', 'stock', 'main_image_url'];
        const fieldsToUpdate = {};
        for (let field of updatableFields) {
            if (req.body[field] !== undefined) {
                fieldsToUpdate[field] = req.body[field];
            }
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            return res.status(400).json({
                message: 'No valid fields provided for update.'
            });
        }

        // Build dynamic SET clause
        const setClauses = [];
        const values = [];
        let index = 1;
        for (let field in fieldsToUpdate) {
            setClauses.push(`${field} = $${index}`);
            values.push(fieldsToUpdate[field]);
            index++;
        }
        // Add id for WHERE clause
        values.push(id);

        const updateQuery = `
            UPDATE Products
            SET ${setClauses.join(', ')}
            WHERE product_id = $${index}
            RETURNING product_id AS id, name, description, price, stock, main_image_url, created_at, updated_at
        `;

        const result = await db.query(updateQuery, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        return res.status(200).json({
            message: 'Product updated successfully.',
            product: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ message: 'Failed to update product.' });
    }
});

// --------------- DELETE /products/:id ---------------
// Deletes an existing product (Admin only)
router.delete('/:id', verifyToken, adminCheck, async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ message: 'Invalid product ID.' });
        }

        const deleteQuery = `
            DELETE FROM Products
            WHERE product_id = $1
            RETURNING product_id
        `;
        const result = await db.query(deleteQuery, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        return res.status(200).json({
            message: 'Product deleted successfully.'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ message: 'Failed to delete product.' });
    }
});

module.exports = router;
