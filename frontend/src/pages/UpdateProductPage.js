import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';

const UpdateProductPage = () => {
    const { id } = useParams();          // The product ID from the URL
    const navigate = useNavigate();       // For optional navigation after update

    // Local state for the product form
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        main_image_url: '',
    });
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // 1. Fetch the existing product info to prefill the form
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/products?id=${id}`);
                /*
                  Because your back end returns:
                     {
                       products: [...],
                       pagination: {...}
                     }
                  we do res.data.products[0] if the product is in an array of length 1.
                */
                const product = res.data.products[0];
                if (!product) {
                    setErrorMessage('Product not found.');
                } else {
                    setFormData({
                        name: product.name || '',
                        description: product.description || '',
                        price: product.price || '',
                        stock: product.stock || '',
                        main_image_url: product.main_image_url || '',
                    });
                }
            } catch (error) {
                setErrorMessage(error?.response?.data?.message || 'Failed to load product');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    // 2. Handle form changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // 3. Send PATCH request on form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        try {
            await axios.patch(`http://localhost:5000/products/${id}`, formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                },
            });
            setSuccessMessage('Product updated successfully!');
            // Optionally navigate somewhere else, e.g. back to home:
            // navigate('/');
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Failed to update product');
        }
    };

    // 4. Render
    if (loading) {
        return <div>Loading product info...</div>;
    }

    return (
        <><NavBar />
            <div style={styles.container}>

                <h1 style={styles.heading}>Update Product (ID {id})</h1>
                {successMessage && <p style={styles.success}>{successMessage}</p>}
                {errorMessage && <p style={styles.error}>{errorMessage}</p>}
                <form style={styles.form} onSubmit={handleSubmit}>
                    <input
                        style={styles.input}
                        type="text"
                        name="name"
                        placeholder="Product Name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                    />
                    <textarea
                        style={styles.textarea}
                        name="description"
                        placeholder="Product Description"
                        value={formData.description}
                        onChange={handleInputChange}
                    />
                    <input
                        style={styles.input}
                        type="number"
                        name="price"
                        placeholder="Price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                    />
                    <input
                        style={styles.input}
                        type="number"
                        name="stock"
                        placeholder="Stock Quantity"
                        value={formData.stock}
                        onChange={handleInputChange}
                        required
                    />
                    <input
                        style={styles.input}
                        type="text"
                        name="main_image_url"
                        placeholder="Main Image URL"
                        value={formData.main_image_url}
                        onChange={handleInputChange}
                    />
                    <button type="submit" style={styles.button}>
                        Update Product
                    </button>
                </form>
            </div></>
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
        fontSize: '40px',
        marginBottom: '20px',
    },
    success: {
        color: 'green',
        fontSize: '18px',
        marginBottom: '20px',
    },
    error: {
        color: 'red',
        fontSize: '18px',
        marginBottom: '20px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '500px',
        gap: '15px',
    },
    input: {
        padding: '10px',
        fontSize: '16px',
        borderRadius: '5px',
        border: '1px solid #ccc',
    },
    textarea: {
        padding: '10px',
        fontSize: '16px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        resize: 'none',
    },
    button: {
        padding: '10px 20px',
        backgroundColor: 'black',
        color: '#fff',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '16px',
    },
};

export default UpdateProductPage;
