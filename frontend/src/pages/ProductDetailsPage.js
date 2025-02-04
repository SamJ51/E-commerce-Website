import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import NavBar from '../components/NavBar';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to retrieve token (ensure your token is stored under this key)
  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  useEffect(() => {
    const abortController = new AbortController();

    const fetchProduct = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/products/${id}`, {
          signal: abortController.signal,
        });
        // Use the nested "product" object from the response.
        setProduct(response.data.product);
        setError(null);
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err.response?.data?.message || 'Product not found');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    return () => abortController.abort();
  }, [id]);

  // Function to add product to cart
  const addToCart = async () => {
    console.log('Product Object: ', product);
    try {
      const token = getAuthToken();
      if (!token) {
        alert('You must be logged in to add items to your cart.');
        return;
      }
      // Send a POST request to add the item to the cart.
      await axios.post(
        'http://localhost:5000/cart/items',
        { product_id: id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Item added to cart!');
    } catch (err) {
      console.error('Error adding item to cart:', err);
      alert(err.response?.data?.message || 'Error adding item to cart.');
    }
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <div style={styles.container}>
          <p style={styles.loading}>Loading product details...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavBar />
        <div style={styles.container}>
          <p style={styles.error}>{error}</p>
        </div>
      </>
    );
  }

  if (!product) return null; // Fallback if no product is found

  return (
    <>
      <NavBar />
      <div style={styles.container}>
        <div style={styles.productContainer}>
          <div style={styles.imageContainer}>
            <img
              src={product.mainImageUrl || 'https://via.placeholder.com/400'}
              alt={product.name}
              style={styles.mainImage}
            />
          </div>
          <div style={styles.detailsContainer}>
            <h1 style={styles.productName}>{product.name}</h1>
            <p style={styles.price}>${parseFloat(product.price).toFixed(2)}</p>
            <p style={styles.description}>{product.description}</p>
            <div style={styles.metaData}>
              <p style={styles.metaItem}>
                <strong>Created:</strong> {new Date(product.createdAt).toLocaleDateString()}
              </p>
              <p style={styles.metaItem}>
                <strong>Updated:</strong> {new Date(product.updatedAt).toLocaleDateString()}
              </p>
            </div>
            {product.categories && product.categories.length > 0 && (
              <div style={styles.categories}>
                <strong>Categories:</strong> {product.categories.join(', ')}
              </div>
            )}
            {product.tags && product.tags.length > 0 && (
              <div style={styles.tags}>
                <strong>Tags:</strong> {product.tags.join(', ')}
              </div>
            )}
            <div style={styles.stockInfo}>
              {product.stock > 0 ? (
                <p style={styles.inStock}>In Stock ({product.stock} available)</p>
              ) : (
                <p style={styles.outOfStock}>Out of Stock</p>
              )}
            </div>
            <button style={styles.addToCartButton} onClick={addToCart}>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  productContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '30px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  imageContainer: {
    flex: 1,
    maxWidth: '500px',
  },
  mainImage: {
    width: '100%',
    height: 'auto',
    borderRadius: '8px',
    objectFit: 'contain',
  },
  detailsContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  productName: {
    fontSize: '32px',
    marginBottom: '10px',
    color: '#333',
  },
  price: {
    fontSize: '28px',
    color: 'green',
    fontWeight: 'bold',
  },
  description: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.6',
  },
  metaData: {
    display: 'flex',
    flexDirection: 'row',
    gap: '20px',
    fontSize: '14px',
    color: '#888',
  },
  metaItem: {},
  categories: {
    fontSize: '16px',
    color: '#555',
  },
  tags: {
    fontSize: '16px',
    color: '#555',
  },
  stockInfo: {
    marginTop: 'auto',
  },
  inStock: {
    color: 'green',
    fontSize: '16px',
  },
  outOfStock: {
    color: 'red',
    fontSize: '16px',
  },
  addToCartButton: {
    padding: '15px 30px',
    backgroundColor: 'black',
    color: 'white',
    border: 'none',
    borderRadius: '30px',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'transform 0.1s ease',
    width: '100%',
    marginTop: '20px',
  },
  loading: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#555',
    padding: '40px',
  },
  error: {
    textAlign: 'center',
    fontSize: '18px',
    color: 'red',
    padding: '40px',
  },
};

export default ProductDetailsPage;