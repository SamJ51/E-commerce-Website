import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../pages/CartContext';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const NavBar = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('authToken'));
    const { cartItemCount, setCartItemCount } = useCart();

    useEffect(() => {
        const fetchCartItemCount = async () => {
            if (isLoggedIn) {
                try {
                    const token = localStorage.getItem('authToken');
                    const response = await axios.get(`${API_URL}/cart`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const totalItems = response.data.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0
                    );
                    setCartItemCount(totalItems);
                } catch (err) {
                    console.error('Failed to fetch cart item count:', err);
                    setCartItemCount(0); // Reset on error
                }
            } else {
                setCartItemCount(0); // No items if not logged in
            }
        };

        fetchCartItemCount();
    }, [isLoggedIn, setCartItemCount]);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setIsLoggedIn(false);
        setCartItemCount(0); // Reset cart count on logout
        navigate('/login');
    };

    return (
        <nav style={styles.navBar}>
            <Link to="/" style={{ ...styles.logo, textDecoration: 'none' }}>
                Samuel Eleveld
            </Link>
            <div style={styles.navLinks}>
                <Link to="/" style={styles.navLink}>
                    Home
                </Link>
                <Link to="/viewproducts" style={styles.navLink}>
                    Products
                </Link>
                <Link to="/cart" style={styles.navLink}>
                    Cart {cartItemCount > 0 && `(${cartItemCount})`}
                </Link>
                <Link to="/profile" style={styles.navLink}>
                    Profile
                </Link>
                {isLoggedIn ? (
                    <button onClick={handleLogout} style={styles.navButtonRed}>
                        Logout
                    </button>
                ) : (
                    <Link to="/login" style={styles.navButtonGreen}>
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
};

const styles = {
    navBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: '20px 5%',
        width: '100%',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxSizing: 'border-box',
        maxWidth: '100%',
    },
    logo: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
    },
    navLinks: {
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
    },
    navLink: {
        textDecoration: 'none',
        color: '#333',
        fontSize: '16px',
        fontWeight: 500,
        transition: 'color 0.3s ease',
    },
    navButtonRed: {
        marginTop: '2px',
        backgroundColor: 'transparent',
        border: 'none',
        fontSize: '16px',
        fontWeight: 500,
        color: 'red',
        cursor: 'pointer',
        textDecoration: 'none',
    },
    navButtonGreen: {
        backgroundColor: 'transparent',
        border: 'none',
        fontSize: '16px',
        fontWeight: 500,
        color: 'green',
        cursor: 'pointer',
        textDecoration: 'none',
    },
};

export default NavBar;