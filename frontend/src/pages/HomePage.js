import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NavBar from '../components/NavBar';
import { Link } from 'react-router-dom';

const HomePage = () => {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const abortController = new AbortController();

        const fetchProducts = async () => {
            try {
                const response = await axios.get('http://localhost:5000/products', {
                    signal: abortController.signal
                });
                setProducts(response.data.products);
            } catch (err) {
                if (!abortController.signal.aborted) {
                    setError(err.message || 'Failed to load products');
                }
            }
        };

        fetchProducts();

        return () => abortController.abort();
    }, []);

    return (
        <>
            <NavBar />
            <div style={styles.container}>
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
                                <div style={styles.bottomSection}>
                                    <p style={styles.price}>${product.price}</p>
                                    <div style={styles.buttonContainer}>
                                        <Link to={`/products/${product.product_id}`} style={{ textDecoration: 'none' }}>
                                            <button style={styles.button}>View Details</button>
                                        </Link>
                                        <Link to={`/products/${product.product_id}/edit`} style={{ textDecoration: 'none' }}>
                                            <button style={styles.editButton}>Edit</button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={styles.loading}>Loading products...</p>
                    )}
                </div>
            </div>
        </>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
    },
    heading: {
        color: 'black',
        textAlign: 'center',
        fontSize: '50px',
        marginBottom: '40px',
    },
    error: {
        color: 'red',
        fontSize: '18px',
        marginBottom: '20px',
    },
    carouselContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        rowGap: '20px',
        columnGap: '20px',
        width: '100%',
        maxWidth: '1500px',
        marginBottom: '20px',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        padding: '15px',
        textAlign: 'center',
        transition: 'transform 0.1s',
        display: 'flex',
        flexDirection: 'column',
    },
    image: {
        width: '100%',
        height: '200px',
        objectFit: 'contain',
        marginBottom: '0px',
    },
    productName: {
        fontSize: '16px',
        color: '#333',
        margin: '0px',
    },
    bottomSection: {
        marginTop: 'auto',
        paddingTop: '5px',
    },
    price: {
        fontSize: '18px',
        color: 'green',
        margin: '5px 0',
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'space-around',
        marginTop: '10px',
    },
    button: {
        padding: '10px 20px',
        backgroundColor: 'black',
        color: '#fff',
        border: 'none',
        borderRadius: '30px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'transform 0.1s ease',
    },
    editButton: {
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '30px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'transform 0.1s ease',
    },
    loading: {
        color: '#555',
        fontSize: '18px',
    },
};

export default HomePage;
