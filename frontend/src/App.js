import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import CreateProductPage from './pages/CreateProductPage';
import ProfilePage from './pages/ProfilePage';
import UpdateProductPage from './pages/UpdateProductPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import ViewProductsPage from './pages/ViewProductsPage';
import CartManagementPage from './pages/CartManagementPage';
import Payment from './components/Payment';
import CheckoutForm from './pages/CheckoutForm';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products" element={<CreateProductPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/products/:id/edit" element={<UpdateProductPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/viewproducts" element={<ViewProductsPage />} />
        <Route path="/cart" element={<CartManagementPage />} />
        <Route path="/checkout" element={<Payment />} />
      </Routes>
    </Router>
  );
}

export default App;

