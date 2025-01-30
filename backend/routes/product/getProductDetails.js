const express = require('express');
const router = express.Router();
const db = require('../../config/db');

// GET /products/:id: Get details of a specific product
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Validate product ID
        if (!id || isNaN(id)) {
            console.error('Error: Invalid product ID provided:', id); 
            return res.status(400).json({ message: 'Invalid product ID.' });
        }

        console.log(`Fetching details for Product ID: ${id}`);

        // 2. Query to fetch product details
        const productQuery = `
            SELECT p.*, ARRAY_AGG(DISTINCT c.category_name) AS categories, ARRAY_AGG(DISTINCT t.tag_name) AS tags
            FROM Products p
            LEFT JOIN Product_Categories pc ON p.product_id = pc.product_id
            LEFT JOIN Categories c ON pc.category_id = c.category_id
            LEFT JOIN Product_Tags pt ON p.product_id = pt.product_id
            LEFT JOIN Tags t ON pt.tag_id = t.tag_id
            WHERE p.product_id = $1
            GROUP BY p.product_id
        `;

        // 3. Execute query
        let productResult;
        try {
            productResult = await db.query(productQuery, [id]);
        } catch (queryError) {
            console.error('Error executing product query:', queryError);
            throw queryError; // Re-throw the error to be caught by the outer catch block
        }
        

        // 4. Check if the product exists
        if (productResult.rowCount === 0) {
            console.warn(`Warning: Product not found for ID: ${id}`);
            return res.status(404).json({ message: 'Product not found.' });
        }

        const product = productResult.rows[0];
        console.log("Fetched Product Details:", product);

        // 5. Respond with the product details
        res.status(200).json({
            product: {
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                stock: product.stock,
                mainImageUrl: product.main_image_url,
                createdAt: product.created_at,
                updatedAt: product.updated_at,
                categories: product.categories.filter(Boolean), // Remove null values if any
                tags: product.tags.filter(Boolean) // Remove null values if any
            }
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Failed to fetch product details.' });
    }
});

module.exports = router;