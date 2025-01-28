// index.js
const express = require('express');
const cors = require('cors');
const registerRoute = require('./routes/authorisation/register');
const loginRoute = require('./routes/authorisation/login');
const profileRoute = require('./routes/user/profile');
const productRoute = require('./routes/product/getProducts');
const getProductDetails = require('./routes/product/getProductDetails');
const productAdminRoute = require('./routes/product/productAdmin');
const cartRoutes = require('./routes/cart/cart');
const orderRoutes = require('./routes/order/order');
const addressRoutes = require('./routes/address/address');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Authentication / user routes
app.use('/auth', registerRoute);
app.use('/auth', loginRoute);
app.use('/user/profile', profileRoute);

// Product routes
app.use('/products', productRoute);
app.use('/products', getProductDetails);
app.use('/products', productAdminRoute);

// Cart routes
app.use('/cart', cartRoutes);

// Order routes
app.use('/api', orderRoutes);

// Address routes
app.use('/addresses', addressRoutes);

const PORT = process.env.PORT || 5000;

// Only listen if NOT in test environment
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;