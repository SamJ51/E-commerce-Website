// order.js (inside routes/order directory)
const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { verifyToken } = require('../../middlewares/authMiddleware');

// POST /checkout: Create a new order
router.post('/checkout', verifyToken, async (req, res) => {
  const userId = req.user.id;

  // Assume the client sends shipping_address_id, billing_address_id and cart_id in the request body
  const { shipping_address_id, billing_address_id, cart_id } = req.body;

  if (!shipping_address_id || !billing_address_id || !cart_id) {
    return res.status(400).json({ message: 'Missing required fields: shipping_address_id, billing_address_id, and cart_id' });
  }

  try {
    // Start a transaction
    await db.query('BEGIN');

    // Fetch cart items
    const cartItemsResult = await db.query('SELECT ci.product_id, ci.quantity, p.price FROM Cart_Items ci JOIN Products p ON ci.product_id = p.product_id WHERE ci.cart_id = $1', [cart_id]);
    const cartItems = cartItemsResult.rows;

    // Calculate total amount
    let totalAmount = 0;
    for (const item of cartItems) {
      totalAmount += item.quantity * item.price;
    }

    // Create the order
    const orderResult = await db.query(
      'INSERT INTO Orders (user_id, shipping_address_id, billing_address_id, total_amount) VALUES ($1, $2, $3, $4) RETURNING order_id',
      [userId, shipping_address_id, billing_address_id, totalAmount]
    );
    const orderId = orderResult.rows[0].order_id;

    // Create order items
    for (const item of cartItems) {
      await db.query(
        'INSERT INTO Order_Items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    // Clear the cart
    await db.query('DELETE FROM Cart_Items WHERE cart_id = $1', [cart_id]);
    await db.query('DELETE FROM Cart WHERE cart_id = $1', [cart_id]);

    // Commit the transaction
    await db.query('COMMIT');

    res.status(201).json({ message: 'Order created successfully', orderId });
  } catch (error) {
    // Rollback the transaction in case of error
    await db.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// GET /orders: Fetch orders for the current user
router.get('/orders', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const ordersResult = await db.query('SELECT * FROM Orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    const orders = ordersResult.rows;

    // Fetch order items for each order
    for (let i = 0; i < orders.length; i++) {
      const orderItemsResult = await db.query('SELECT oi.quantity, oi.price, p.name, p.main_image_url FROM Order_Items oi JOIN Products p ON oi.product_id = p.product_id WHERE oi.order_id = $1', [orders[i].order_id]);
      orders[i].items = orderItemsResult.rows;
    }

    res.status(200).json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// GET /orders/:id: Fetch details of a specific order
router.get('/orders/:id', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const orderId = parseInt(req.params.id);

  try {
    const orderResult = await db.query('SELECT * FROM Orders WHERE order_id = $1 AND user_id = $2', [orderId, userId]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = orderResult.rows[0];

    // Fetch order items
    const orderItemsResult = await db.query('SELECT oi.quantity, oi.price, p.name, p.main_image_url FROM Order_Items oi JOIN Products p ON oi.product_id = p.product_id WHERE oi.order_id = $1', [orderId]);
    order.items = orderItemsResult.rows;

    res.status(200).json({ order });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Failed to fetch order details' });
  }
});

// PATCH /orders/:id: Update order status (Admin only)
router.patch('/orders/:id', verifyToken, async (req, res) => {
  // Check if the user is an admin
  if (req.user.role_id !== 2) {
    return res.status(403).json({ message: 'Forbidden: Admin only' });
  }

  const orderId = parseInt(req.params.id);
  const { order_status } = req.body;

  if (!order_status) {
    return res.status(400).json({ message: 'Order status is required' });
  }

  try {
    const updateResult = await db.query(
      'UPDATE Orders SET order_status = $1 WHERE order_id = $2 RETURNING *',
      [order_status, orderId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Order status updated', order: updateResult.rows[0] });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

module.exports = router;