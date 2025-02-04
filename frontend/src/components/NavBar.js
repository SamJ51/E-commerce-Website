const NavBar = () => {
    return (
        <nav style={styles.navBar}>
            <div style={styles.logo}>Samuel Eleveld</div>
            <div style={styles.navLinks}>
                <a href="/" style={styles.navLink}>Home</a>
                <a href="/products" style={styles.navLink}>Add Product</a>
                <a href="/profile" style={styles.navLink}>Profile</a>
                <a href="/login" style={styles.navLink}>Login</a>
                <a href="/register" style={styles.navLink}>Register</a>
                <a href="/viewproducts" style={styles.navLink}>View Products</a>
                <a href="/cart" style={styles.navLink}>Cart</a>
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
        ':hover': {
            color: '#007bff',
        },
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
        }
    },
    '@media (max-width: 480px)': {
        navLinks: {
            gap: '10px',
            flexWrap: 'wrap',
        },
        navLink: {
            fontSize: '14px',
        }
    }
}

export default NavBar;