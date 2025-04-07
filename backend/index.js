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
//const addressRoutes = require('./routes/address/address');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// API routes (all under /api)
app.use('/api/auth', registerRoute);
app.use('/api/auth', loginRoute);
app.use('/api/user/profile', profileRoute);
app.use('/api/products', productRoute);
app.use('/api/products', getProductDetails);
app.use('/api/products', productAdminRoute);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes); // Adjust orderRoutes if needed
//app.use('/api/addresses', addressRoutes);
app.use('/api/stripe', require('./routes/order/payment'));

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

module.exports = app;