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
        padding: '20px 50px',
        width: '100%',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
    },
    logo: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
    },
    navLinks: {
        display: 'flex',
        gap: '30px',
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
}

export default NavBar;