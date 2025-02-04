// ViewProductsPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../components/NavBar';
import { Link } from 'react-router-dom';

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
      const response = await axios.get('http://localhost:5000/products', {
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

      // The backend sends the products and pagination info
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortBy, sortOrder]);

  // Handler for the filter/search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Reset page to 1 on new search/filters
    setCurrentPage(1);
    fetchProducts();
  };

  // Handler for pagination
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
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
          {/*
          <div style={styles.formRow}>
            <label style={styles.label}>Category:</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category"
              style={styles.input}
            />
          </div>
          */}
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
            <div style={styles.productsGrid}>
              {products.length > 0 ? (
                products.map((product) => (
                  <div key={product.product_id} style={styles.card}>
                    <img
                      src={product.main_image_url || 'https://via.placeholder.com/200'}
                      alt={product.name}
                      style={styles.image}
                    />
                    <h3 style={styles.productName}>{product.name}</h3>
                    <p style={styles.price}>${parseFloat(product.price).toFixed(2)}</p>
                    {/* Button container to match the HomePage layout */}
                    <div style={styles.buttonContainer}>
                      <Link to={`/products/${product.product_id}`} style={{ textDecoration: 'none' }}>
                        <button style={styles.button}>View Details</button>
                      </Link>
                      <Link to={`/products/${product.product_id}/edit`} style={{ textDecoration: 'none' }}>
                        <button style={styles.editButton}>Edit</button>
                      </Link>
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
  },
  heading: {
    textAlign: 'center',
    fontSize: '32px',
    marginBottom: '20px',
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
    borderRadius: '4px',
    cursor: 'pointer',
    height: 'fit-content',
    marginTop: '25px',
  },
  // Fixed width grid for cards
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, 250px)', // Each card is 250px wide
    gap: '20px',
    justifyContent: 'center', // Center grid when there are few cards
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
  image: {
    width: '100%',
    height: '200px',
    objectFit: 'contain',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  productName: {
    fontSize: '18px',
    color: '#333',
    margin: '10px 0 5px 0',
  },
  price: {
    fontSize: '16px',
    color: 'green',
    fontWeight: 'bold',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: 'auto', // Sticks the buttons to the bottom of the card
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
  noResults: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    fontSize: '18px',
    color: '#555',
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