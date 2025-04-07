import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../components/NavBar';
import { Link } from 'react-router-dom';
import './CardRowStyle.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const ViewProductsPage = () => {
  // Filter & Sorting state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // Data state
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    totalProducts: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: limit,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/products`, {
        params: {
          page: currentPage,
          limit,
          sort_by: sortBy,
          sort_order: sortOrder,
          category: category || undefined,
          price_min: priceMin || undefined,
          price_max: priceMax || undefined,
          search: search || undefined,
        },
      });

      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching products.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch products when query parameters change
  useEffect(() => {
    fetchProducts();
  }, [currentPage, sortBy, sortOrder]);

  // Handler for the filter/search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  // Handler for pagination
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  // Handler to delete a product
  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.product_id !== productId)
      );
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  return (
    <>
      <NavBar />
      <div style={styles.container}>
        <h1 style={styles.heading}>View Products</h1>

        {/* Search and Filters */}
        <form onSubmit={handleSearchSubmit} style={styles.filterForm}>
          <div style={styles.formRow}>
            <label style={styles.label}>Search:</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or description"
              style={styles.input}
            />
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>Price Min:</label>
            <input
              type="number"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="Min price"
              style={styles.input}
            />
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>Price Max:</label>
            <input
              type="number"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="Max price"
              style={styles.input}
            />
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.select}
            >
              <option value="created_at">Created Date</option>
              <option value="price">Price</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>Sort Order:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={styles.select}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          <button type="submit" style={styles.searchButton}>
            Search
          </button>
        </form>

        {/* Display Products */}
        {loading ? (
          <p style={styles.loading}>Loading products...</p>
        ) : error ? (
          <p style={styles.error}>{error}</p>
        ) : (
          <>
            <div className="carousel-container">
              {products.length > 0 ? (
                products.map((product) => (
                  <div key={product.product_id} style={styles.card}>
                    <div style={styles.imageContainer}>
                      <img
                        src={product.main_image_url || 'https://via.placeholder.com/200'}
                        alt={product.name}
                        style={styles.image}
                      />
                    </div>
                    <h3 style={styles.productName}>{product.name}</h3>
                    <div style={styles.bottomSection}>
                      <p style={styles.price}>
                        ${parseFloat(product.price).toFixed(2)}
                      </p>
                      <div style={styles.buttonContainer}>
                        <Link
                          to={`/products/${product.product_id}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <button style={styles.viewButton}>View</button>
                        </Link>
                        <Link
                          to={`/products/${product.product_id}/edit`}
                          style={{ textDecoration: 'none' }}
                        >
                          <button style={styles.editButton}>Edit</button>
                        </Link>
                        <button
                          style={styles.deleteButton}
                          onClick={() => handleDelete(product.product_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={styles.noResults}>No products found.</p>
              )}
            </div>

            {/* Pagination Controls */}
            <div style={styles.pagination}>
              <button
                style={styles.pageButton}
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span style={styles.pageInfo}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                style={styles.pageButton}
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
              >
                Next
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
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    margin: '0 auto',
  },
  heading: {
    textAlign: 'center',
    fontSize: '32px',
    marginBottom: '40px',
  },
  filterForm: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '15px',
    justifyContent: 'center',
    marginBottom: '30px',
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '1200px',
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '150px',
  },
  label: {
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  input: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  select: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  searchButton: {
    padding: '10px 20px',
    backgroundColor: 'black',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    height: 'fit-content',
    marginTop: '25px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    padding: '15px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '400px',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    paddingBottom: '75%', // 4:3 aspect ratio; adjust as needed (e.g., '100%' for 1:1, '56.25%' for 16:9)
    marginBottom: '10px',
  },
  image: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    borderRadius: '8px',
  },
  productName: {
    fontSize: '18px',
    color: '#333',
    margin: '10px 0 5px 0',
    flexGrow: 1,
  },
  bottomSection: {
    paddingTop: '5px',
    marginTop: 'auto',
  },
  price: {
    fontSize: '18px',
    color: 'green',
    margin: '5px 0',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '35px',
    marginTop: '10px',
  },
  viewButton: {
    width: '70px',
    height: '35px',
    backgroundColor: 'black',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    width: '70px',
    height: '35px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: '70px',
    height: '35px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResults: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#555',
    width: '100%',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '30px',
    gap: '15px',
  },
  pageButton: {
    padding: '8px 16px',
    backgroundColor: 'black',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  pageInfo: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#555',
  },
  error: {
    textAlign: 'center',
    fontSize: '18px',
    color: 'red',
  },
};

export default ViewProductsPage;