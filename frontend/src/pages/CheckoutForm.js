// CheckoutForm.js
import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import NavBar from '../components/NavBar';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: "Arial, sans-serif",
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#a0aec0",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
};

function CheckoutForm({ clientSecret, totalPrice, onPaymentSuccess, demoMode = false }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // State for shipping address fields
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    // (Optional) Validate that required address fields are filled
    if (
      !shippingAddress.fullName ||
      !shippingAddress.addressLine1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zip ||
      !shippingAddress.country
    ) {
      setError("Please fill in all required shipping address fields.");
      setLoading(false);
      return;
    }

    if (demoMode) {
      // Simulate fake payment
      setTimeout(() => {
        setSuccess(true);
        setLoading(false);
        console.log('Shipping Address:', shippingAddress);
        if (onPaymentSuccess) onPaymentSuccess();
      }, 1000);
      return;
    }

    // Real payment flow (won't run in demo mode)
    const card = elements.getElement(CardElement);
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card,
        billing_details: { name: shippingAddress.fullName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setSuccess(true);
      setLoading(false);
      if (onPaymentSuccess) onPaymentSuccess();
    }
  };

  return (
    <>
      <NavBar />
      <div style={styles.container}>
        <h2 style={styles.header}>Stripe Checkout</h2>
        <p style={styles.subheader}>
          Enter your shipping address and card details below to complete your purchase.
        </p>

        {/* Display the total price */}
        <div style={styles.totalPrice}>Total Price: ${totalPrice.toFixed(2)}</div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.addressContainer}>
            <h3 style={styles.sectionHeader}>Shipping Address</h3>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={shippingAddress.fullName}
              onChange={handleAddressChange}
              style={styles.input}
              required
            />
            <input
              type="text"
              name="addressLine1"
              placeholder="Address Line 1"
              value={shippingAddress.addressLine1}
              onChange={handleAddressChange}
              style={styles.input}
              required
            />
            <input
              type="text"
              name="addressLine2"
              placeholder="Address Line 2"
              value={shippingAddress.addressLine2}
              onChange={handleAddressChange}
              style={styles.input}
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={shippingAddress.city}
              onChange={handleAddressChange}
              style={styles.input}
              required
            />
            <input
              type="text"
              name="state"
              placeholder="State"
              value={shippingAddress.state}
              onChange={handleAddressChange}
              style={styles.input}
              required
            />
            <input
              type="text"
              name="zip"
              placeholder="Zip Code"
              value={shippingAddress.zip}
              onChange={handleAddressChange}
              style={styles.input}
              required
            />
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={shippingAddress.country}
              onChange={handleAddressChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.cardElementContainer}>
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>Payment successful!</div>}
          <button type="submit" style={styles.button} disabled={!stripe || loading}>
            {loading ? "Processing..." : "Pay"}
          </button>
        </form>
      </div></>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "50px auto",
    padding: "20px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  header: {
    marginBottom: "10px",
    fontSize: "28px",
    color: "#333",
  },
  subheader: {
    marginBottom: "20px",
    fontSize: "16px",
    color: "#666",
  },
  totalPrice: {
    marginBottom: "20px",
    fontSize: "20px",
    fontWeight: "bold",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  addressContainer: {
    marginBottom: "20px",
    textAlign: "left",
    padding: "0 20px", // Added padding so the fields don't touch the container's edge
  },
  sectionHeader: {
    fontSize: "20px",
    marginBottom: "10px",
    color: "#333",
  },
  input: {
    boxSizing: "border-box", // Ensure padding is included in the width
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  cardElementContainer: {
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "10px",
    marginBottom: "20px",
  },
  button: {
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "4px",
    fontSize: "16px",
    cursor: "pointer",
  },
  error: {
    color: "#fa755a",
    marginBottom: "10px",
  },
  success: {
    color: "#4BB543",
    marginBottom: "10px",
  },
};

export default CheckoutForm;