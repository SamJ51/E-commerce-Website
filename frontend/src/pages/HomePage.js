import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NavBar from '../components/NavBar';

const HomePage = () => {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('http://localhost:5000/products');
                setProducts(response.data.products);
            } catch (err) {
                setError(err.message || 'Failed to load products');
            }
        };

        fetchProducts();
    }, []);

    return (
        <div style={styles.container}>
            <NavBar />
            <h1 style={styles.heading}>Welcome to My Store</h1>
            {error && <p style={styles.error}>{error}</p>}
            <div style={styles.carouselContainer}>
                {products.length > 0 ? (
                    products.map((product, index) => (
                        <div key={index} style={styles.card}>
                            <img
                                src={product.main_image_url || 'https://via.placeholder.com/150'}
                                alt={product.name}
                                style={styles.image}
                            />
                            <h3 style={styles.productName}>{product.name}</h3>
                            <p style={styles.price}>${product.price}</p>
                            <button style={styles.button}>View Details</button>
                        </div>
                    ))
                ) : (
                    <p style={styles.loading}>Loading products...</p>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
    },
    heading: {
        color: 'black',
        textAlign: 'center',
        fontSize: '50px',
        marginBottom: '20px',
    },
    error: {
        color: 'red',
        fontSize: '18px',
        marginBottom: '20px',
    },
    carouselContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        width: '100%',
        maxWidth: '1200px',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        padding: '15px',
        textAlign: 'center',
        transition: 'transform 0.2s',
    },
    image: {
        width: '100%',
        height: '200px',
        objectFit: 'cover',
        borderRadius: '10px',
        marginBottom: '15px',
    },
    productName: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#333',
    },
    price: {
        fontSize: '18px',
        color: 'green',
        margin: '10px 0',
    },
    button: {
        padding: '10px 20px',
        backgroundColor: 'black',
        color: '#fff',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'transform 0.1s ease',
    },
    buttonHover: {
        transform: 'scale(1.05)',
    },
    loading: {
        color: '#555',
        fontSize: '18px',
    },
};

export default HomePage;
