import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import CreateProductPage from './pages/CreateProductPage';
import ProfilePage from './pages/ProfilePage';
import UpdateProductPage from './pages/UpdateProductPage';

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
      </Routes>
    </Router>
  );
}

export default App;

