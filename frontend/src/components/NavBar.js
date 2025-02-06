import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NavBar = () => {
    const navigate = useNavigate();

    // Initialise login state by checking if a token exists in localStorage
    const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('authToken'));

    const handleLogout = () => {
        // Remove the token from localStorage
        localStorage.removeItem('authToken');
        setIsLoggedIn(false);
        // Redirect the user to the login page (or homepage if you prefer)
        navigate('/login');
    };

    return (
        <nav style={styles.navBar}>
            <div style={styles.logo}>Samuel Eleveld</div>
            <div style={styles.navLinks}>
                <Link to="/" style={styles.navLink}>Home</Link>
                <Link to="/viewproducts" style={styles.navLink}>Products</Link>
                <Link to="/cart" style={styles.navLink}>Cart</Link>
                <Link to="/profile" style={styles.navLink}>Profile</Link>
                {/* Conditionally render the Login link or Logout button */}
                {isLoggedIn ? (
                    <button onClick={handleLogout} style={styles.navButtonRed}>Logout</button>
                ) : (
                    <Link to="/login" style={styles.navButtonGreen}>Login</Link>
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
    // Updated logout button style to remove underlining and use a visible colour
    navButtonRed: {
        marginTop: '2px',
        backgroundColor: 'transparent',
        border: 'none',
        fontSize: '16px',
        fontWeight: 500,
        color: 'red', // Changed from '#fff' to 'red' for visibility on white background
        cursor: 'pointer',
        textDecoration: 'none', // Ensure no underline
    },
    navButtonGreen: {
        backgroundColor: 'transparent',
        border: 'none',
        fontSize: '16px',
        fontWeight: 500,
        color: 'green',
        cursor: 'pointer',
        textDecoration: 'none', // Remove underline from the login link
    },
    '@media (max-width: 768px)': {
        navBar: {
            padding: '15px 5%',
            flexDirection: 'column',
            gap: '15px',
        },
        navLinks: {
            gap: '15px',
            justifyContent: 'center',
        },
    },
    '@media (max-width: 480px)': {
        navLinks: {
            gap: '10px',
            flexWrap: 'wrap',
        },
        navLink: {
            fontSize: '14px',
        },
    },
};

export default NavBar;
