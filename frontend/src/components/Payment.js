// Payment.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../pages/CheckoutForm';

const stripePromise = loadStripe('pk_test_51J3J9bJ9J9bJ9J9bJ9');

function Payment() {
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  // We'll still pass a dummy client secret (in demo mode)
  const [clientSecret] = useState('dummy_client_secret_123');
  const [loadingCart, setLoadingCart] = useState(true);

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    async function fetchCart() {
      try {
        const response = await axios.get('http://localhost:5000/cart', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const items = response.data.items || [];
        setCartItems(items);
        const total = items.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0);
        setTotalPrice(total);
      } catch (error) {
        console.error('Error fetching cart items', error);
      } finally {
        setLoadingCart(false);
      }
    }
    fetchCart();
  }, [token]);

  // Clear the cart by deleting each cart item
  const clearCart = async () => {
    try {
      for (const item of cartItems) {
        await axios.delete(`http://localhost:5000/cart/items/${item.cart_item_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart', error);
    }
  };

  // Callback passed to CheckoutForm to be called on successful (fake) payment
  const handlePaymentSuccess = () => {
    clearCart();
  };

  if (loadingCart) {
    return <div>Loading checkout details...</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm 
        clientSecret={clientSecret} 
        totalPrice={totalPrice} 
        onPaymentSuccess={handlePaymentSuccess}
        demoMode={true} 
      />
    </Elements>
  );
}

export default Payment;

