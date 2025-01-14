const express = require('express');
const router = express.Router();
const db = require('../../config/db');

// GET /products: List all products
router.get('/', async (req, res) => {
    try {
        // 1. Extract query parameters
        console.log("Request Query Parameters:", req.query);
        const {
            page = 1,
            limit = 10,
            sort_by = 'created_at',
            sort_order = 'desc',
            category,
            price_min,
            price_max,
            search
        } = req.query;

        // 2. Validate parameters (Example: Basic validation)
        if (isNaN(page) || page < 1) throw new Error("Invalid page number.");
        if (isNaN(limit) || limit < 1) throw new Error("Invalid limit.");
        // ... Add more validation as needed

        // 3. Pagination calculations
        const offset = (page - 1) * limit;
        console.log(`Pagination - Page: ${page}, Limit: ${limit}, Offset: ${offset}`);

        // 4. Build base query
        let query = `SELECT p.* FROM Products p`;
        let countQuery = `SELECT COUNT(*) FROM Products p`;
        const queryParams = [];
        const filters = [];

        // 5. Join with categories if filtering by category
        if (category) {
            console.log("Filtering by category:", category);
            query += ` JOIN Product_Categories pc ON p.product_id = pc.product_id
                       JOIN Categories c ON pc.category_id = c.category_id`;
            countQuery += ` JOIN Product_Categories pc ON p.product_id = pc.product_id
                             JOIN Categories c ON pc.category_id = c.category_id`;
            filters.push(`c.category_name = $${queryParams.length + 1}`);
            queryParams.push(category);
        }

        // 6. Filtering by price range
        if (price_min) {
            console.log("Filtering by price_min:", price_min);
            filters.push(`p.price >= $${queryParams.length + 1}`);
            queryParams.push(price_min);
        }

        if (price_max) {
            console.log("Filtering by price_max:", price_max);
            filters.push(`p.price <= $${queryParams.length + 1}`);
            queryParams.push(price_max);
        }

        // 7. Search by name or description
        if (search) {
            console.log("Searching for:", search);
            filters.push(`(p.name ILIKE $${queryParams.length + 1} OR p.description ILIKE $${queryParams.length + 1})`);
            queryParams.push(`%${search}%`);
        }

        // 8. Append filters to the queries
        if (filters.length > 0) {
            const filterQuery = filters.join(' AND ');
            console.log("Filters applied:", filterQuery);
            query += ` WHERE ${filterQuery}`;
            countQuery += ` WHERE ${filterQuery}`;
        }

        // 9. Add sorting
        console.log(`Sorting by: ${sort_by} ${sort_order}`);
        query += ` ORDER BY ${sort_by} ${sort_order}`;

        // 10. Add pagination
        query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);
        console.log("Final Query:", query);
        console.log("Query Parameters:", queryParams);
        console.log("Count Query:", countQuery);

        // 11. Execute queries
        const productsPromise = db.query(query, queryParams);
        const countPromise = db.query(countQuery, queryParams.slice(0, -2)); // Remove limit and offset for count

        const [productsResult, countResult] = await Promise.all([productsPromise, countPromise]);

        console.log("Products Result Rows:", productsResult.rows);
        console.log("Count Result:", countResult.rows[0]?.count);

        // 12. Total products and total pages
        const totalProducts = parseInt(countResult.rows[0]?.count || 0, 10); // Handle potential undefined count
        const totalPages = Math.ceil(totalProducts / limit);

        // 13. Respond with data and pagination info
        res.status(200).json({
            products: productsResult.rows,
            pagination: {
                totalProducts,
                totalPages,
                currentPage: parseInt(page, 10),
                pageSize: parseInt(limit, 10),
            },
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        if (error.message.includes("Invalid")) {
          res.status(400).json({ message: error.message }); // Bad Request for validation errors
        } else {
          res.status(500).json({ message: 'Failed to fetch products' });
        }
    }
});

module.exports = router;