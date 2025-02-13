const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { verifyToken } = require('../../middlewares/authMiddleware');

// GET /cart: Fetch the user's cart
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await db.query('SELECT * FROM Cart WHERE user_id = $1', [userId]);
        if (cart.rows.length === 0) {
            return res.status(404).json({ message: 'No Items in Cart!' });
        }
        const cartId = cart.rows[0].cart_id;

        // Include stock in the selection
        const cartItems = await db.query(`
        SELECT ci.cart_item_id, ci.quantity, p.product_id, p.name, p.price, p.main_image_url, p.stock
        FROM Cart_Items ci
        JOIN Products p ON ci.product_id = p.product_id
        WHERE ci.cart_id = $1
      `, [cartId]);

        res.status(200).json({
            cart_id: cartId,
            user_id: userId,
            items: cartItems.rows
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: 'An error occurred while fetching the cart' });
    }
});

// POST /cart/items: Add an item to the cart
router.post('/items', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, quantity } = req.body;

        if (!product_id || !quantity) {
            return res.status(400).json({ error: 'Product ID and quantity are required' });
        }

        // Check if the product exists and get its stock
        const productQuery = await db.query('SELECT * FROM Products WHERE product_id = $1', [product_id]);
        if (productQuery.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const availableStock = productQuery.rows[0].stock;
        if (quantity > availableStock) {
            return res.status(400).json({ message: 'Requested quantity exceeds available stock' });
        }

        // Find or create a cart for the user
        let cart = await db.query('SELECT * FROM Cart WHERE user_id = $1', [userId]);
        let cartId;
        if (cart.rows.length === 0) {
            const newCart = await db.query('INSERT INTO Cart (user_id) VALUES ($1) RETURNING cart_id', [userId]);
            cartId = newCart.rows[0].cart_id;
        } else {
            cartId = cart.rows[0].cart_id;
        }

        // Check if the item is already in the cart
        const existingCartItem = await db.query('SELECT * FROM Cart_Items WHERE cart_id = $1 AND product_id = $2', [cartId, product_id]);

        if (existingCartItem.rows.length > 0) {
            const updatedQuantity = existingCartItem.rows[0].quantity + quantity;
            if (updatedQuantity > availableStock) {
                return res.status(400).json({ message: 'Total quantity exceeds available stock' });
            }
            await db.query('UPDATE Cart_Items SET quantity = $1 WHERE cart_item_id = $2', [updatedQuantity, existingCartItem.rows[0].cart_item_id]);
            res.status(200).json({ message: 'Cart item quantity updated' });
        } else {
            await db.query('INSERT INTO Cart_Items (cart_id, product_id, quantity) VALUES ($1, $2, $3)', [cartId, product_id, quantity]);
            res.status(201).json({ message: 'Item added to cart' });
        }
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ error: 'An error occurred while adding the item to the cart' });
    }
});

// PATCH /cart/items/:id: Update the quantity of a cart item
router.patch('/items/:id', verifyToken, async (req, res) => {
    try {
        const cartItemId = req.params.id;
        const { quantity } = req.body;
        const userId = req.user.id;

        if (quantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be greater than zero' });
        }

        // Verify that the cart item exists and belongs to the user's cart
        const cartItem = await db.query(`
        SELECT ci.* 
        FROM Cart_Items ci
        JOIN Cart c ON ci.cart_id = c.cart_id
        WHERE ci.cart_item_id = $1 AND c.user_id = $2
      `, [cartItemId, userId]);

        if (cartItem.rows.length === 0) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        // Get the product's available stock
        const productId = cartItem.rows[0].product_id;
        const productQuery = await db.query('SELECT stock FROM Products WHERE product_id = $1', [productId]);
        if (productQuery.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const availableStock = productQuery.rows[0].stock;
        if (quantity > availableStock) {
            return res.status(400).json({ message: 'Quantity exceeds available stock' });
        }

        // Update the quantity if all is good
        await db.query('UPDATE Cart_Items SET quantity = $1 WHERE cart_item_id = $2', [quantity, cartItemId]);
        res.status(200).json({ message: 'Cart item updated' });
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ error: 'An error occurred while updating the cart item' });
    }
});

// DELETE /cart/items/:id: Remove an item from the cart
router.delete('/items/:id', verifyToken, async (req, res) => {
    try {
        const cartItemId = req.params.id;
        const userId = req.user.id;

        // Verify that the cart item exists and belongs to the user's cart
        const cartItem = await db.query(`
            SELECT ci.* 
            FROM Cart_Items ci
            JOIN Cart c ON ci.cart_id = c.cart_id
            WHERE ci.cart_item_id = $1 AND c.user_id = $2
        `, [cartItemId, userId]);

        if (cartItem.rows.length === 0) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        // Remove the item from the cart
        await db.query('DELETE FROM Cart_Items WHERE cart_item_id = $1', [cartItemId]);

        res.status(200).json({ message: 'Cart item removed' });
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ error: 'An error occurred while removing the cart item' });
    }
});

module.exports = router;