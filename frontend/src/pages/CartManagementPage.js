import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NavBar from '../components/NavBar';
import { useNavigate } from 'react-router-dom';

const CartManagementPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getAuthToken = () => localStorage.getItem('authToken');

    const navigate = useNavigate();

    // Fetch cart items from the backend
    const fetchCartItems = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getAuthToken();
            const response = await axios.get('http://localhost:5000/cart', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCartItems(response.data.items);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch cart items.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCartItems();
    }, []);

    // Update item quantity
    const updateQuantity = async (cartItemId, newQuantity) => {
        if (newQuantity < 1) return; // Prevent negative or zero quantities
        try {
            const token = getAuthToken();
            await axios.patch(
                `http://localhost:5000/cart/items/${cartItemId}`,
                { quantity: newQuantity },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Refresh the cart items after update
            fetchCartItems();
        } catch (err) {
            alert('Error updating quantity: ' + (err.response?.data?.message || ''));
        }
    };

    // Remove an item from the cart
    const removeItem = async (cartItemId) => {
        try {
            const token = getAuthToken();
            await axios.delete(`http://localhost:5000/cart/items/${cartItemId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh the cart items after removal
            fetchCartItems();
        } catch (err) {
            alert('Error removing item: ' + (err.response?.data?.message || ''));
        }
    };

    // Calculate total price
    const totalPrice = cartItems.reduce(
        (total, item) => total + parseFloat(item.price) * item.quantity,
        0
    );

    return (
        <>
            <NavBar />
            <div style={styles.container}>
                <h1 style={styles.heading}>Your Shopping Cart</h1>
                {loading ? (
                    <p style={styles.loading}>Loading cart items...</p>
                ) : error ? (
                    <p style={styles.error}>{error}</p>
                ) : cartItems.length === 0 ? (
                    <p>Your cart is empty.</p>
                ) : (
                    <>
                        <div style={styles.cartList}>
                            {cartItems.map((item) => (
                                <div key={item.cart_item_id} style={styles.cartItem}>
                                    <img
                                        src={item.main_image_url || 'https://via.placeholder.com/100'}
                                        alt={item.name}
                                        style={styles.image}
                                    />
                                    <div style={styles.itemDetails}>
                                        <h3 style={styles.itemName}>{item.name}</h3>
                                        <p style={styles.itemPrice}>
                                            Price: ${parseFloat(item.price).toFixed(2)}
                                        </p>
                                        <div style={styles.quantityControls}>
                                            <button
                                                style={styles.quantityButton}
                                                onClick={() =>
                                                    updateQuantity(item.cart_item_id, item.quantity - 1)
                                                }
                                                disabled={item.quantity <= 1}
                                            >
                                                –
                                            </button>
                                            <span style={styles.quantityValue}>{item.quantity}</span>
                                            <button
                                                style={styles.quantityButton}
                                                onClick={() => {
                                                    if (item.quantity < item.stock) {
                                                        updateQuantity(item.cart_item_id, item.quantity + 1);
                                                    } else {
                                                        alert('No more stock available for this product.');
                                                    }
                                                }}
                                                disabled={item.quantity >= item.stock}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            style={styles.removeButton}
                                            onClick={() => removeItem(item.cart_item_id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={styles.totalContainer}>
                            <h2>Total: ${totalPrice.toFixed(2)}</h2>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <button
                                style={styles.checkoutButton}
                                onClick={() => navigate('/checkout')}
                            >
                                Proceed to Checkout
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

const styles = {
    container: {
        padding: '20px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
    },
    heading: {
        textAlign: 'center',
        fontSize: '32px',
        marginBottom: '40px'
    },
    loading: {
        textAlign: 'center',
        fontSize: '18px'
    },
    error: {
        textAlign: 'center',
        fontSize: '18px',
        color: 'red'
    },
    cartList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        maxWidth: '800px',
        margin: '0 auto' // This centres the cart list horizontally
    },
    cartItem: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    image: {
        width: '100px',
        height: '100px',
        objectFit: 'cover',
        borderRadius: '8px',
        marginRight: '20px'
    },
    itemDetails: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1
    },
    itemName: {
        fontSize: '20px',
        margin: '0 0 5px 0'
    },
    itemPrice: {
        fontSize: '16px',
        margin: '0 0 10px 0'
    },
    quantityControls: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '10px'
    },
    quantityButton: {
        padding: '5px 10px',
        backgroundColor: '#ccc',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    quantityValue: {
        fontSize: '16px'
    },
    removeButton: {
        padding: '8px 12px',
        backgroundColor: 'red',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        width: '120px'
    },
    totalContainer: {
        marginTop: '30px',
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: 'bold'
    },
    checkoutButton: {
        padding: '20px 20px',
        backgroundColor: 'black',
        color: '#fff',
        border: 'none',
        borderRadius: '100px',
        cursor: 'pointer',
        fontSize: '22px',
        transition: 'transform 0.1s ease',
        width: '250px',
        marginBottom: '20px',
    }
};

export default CartManagementPage;