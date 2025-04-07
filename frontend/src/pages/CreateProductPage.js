import React, { useState } from 'react';
import axios from 'axios';
import NavBar from '../components/NavBar';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const CreateProductPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        main_image_url: '',
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_URL}/products`, formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                },
            });
            setSuccessMessage('Product created successfully!');
            setErrorMessage('');
            setFormData({
                name: '',
                description: '',
                price: '',
                stock: '',
                main_image_url: '',
            });
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Failed to create product');
            setSuccessMessage('');
        }
    };

    return (
        <><NavBar /><div style={styles.container}>
            <h1 style={styles.heading}>Create New Product</h1>
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
                    required />
                <textarea
                    style={styles.textarea}
                    name="description"
                    placeholder="Product Description"
                    value={formData.description}
                    onChange={handleInputChange} />
                <input
                    style={styles.input}
                    type="number"
                    name="price"
                    placeholder="Price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required />
                <input
                    style={styles.input}
                    type="number"
                    name="stock"
                    placeholder="Stock Quantity"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required />
                <input
                    style={styles.input}
                    type="text"
                    name="main_image_url"
                    placeholder="Main Image URL"
                    value={formData.main_image_url}
                    onChange={handleInputChange} />
                <button type="submit" style={styles.button}>
                    Create Product
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
        marginBottom: '40px',
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

export default CreateProductPage;
