import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useLikedProducts } from '../../context/LikedProductsContext';
import { useTheme } from '../../context/ThemeContext';

const TestPage = () => {
  const { likedProducts, toggleLike } = useLikedProducts();
  const { isDarkMode } = useTheme();
  const [savedFilters, setSavedFilters] = useState([]);
  const [contextWorking, setContextWorking] = useState(false);
  const [localStorageWorking, setLocalStorageWorking] = useState(false);

  useEffect(() => {
    // Test if context is working
    try {
      if (likedProducts !== undefined) {
        setContextWorking(true);
      }
    } catch (e) {
      console.error('Context error:', e);
    }

    // Test if localStorage is working
    try {
      const liked = localStorage.getItem('likedProducts');
      const filters = localStorage.getItem('savedFilters');

      if (liked !== null || filters !== null) {
        setLocalStorageWorking(true);
      }

      if (filters) {
        setSavedFilters(JSON.parse(filters));
      }
    } catch (e) {
      console.error('localStorage error:', e);
    }
  }, [likedProducts]);

  const addTestData = () => {
    // Add test liked product
    const testProduct = {
      _id: 'test_' + Date.now(),
      title: 'Test Product ' + Date.now(),
      price: 50000,
      currentBid: 50000,
      images: [{ url: '/default.png', isPrimary: true }],
      category: 'Test Category',
      description: 'This is a test product'
    };
    toggleLike(testProduct);

    // Add test saved filter
    const testFilter = {
      id: 'filter_' + Date.now(),
      name: 'Test Filter ' + Date.now(),
      filters: {
        selectedCategories: [],
        priceMin: '10000',
        priceMax: '50000'
      },
      createdAt: new Date().toISOString()
    };

    const existingFilters = localStorage.getItem('savedFilters');
    const filters = existingFilters ? JSON.parse(existingFilters) : [];
    filters.push(testFilter);
    localStorage.setItem('savedFilters', JSON.stringify(filters));
    setSavedFilters(filters);

    alert('Test data added! Check MyList now.');
  };

  return (
    <div className="container my-5">
      <div className="row">
        <div className="col-12 col-lg-10 mx-auto">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">
                <i className="bi bi-clipboard-check me-2"></i>
                Test Page - MyList Features
              </h3>
            </div>
            <div className="card-body">

              {/* Test Results */}
              <div className="mb-4">
                <h5 className="mb-3">
                  <i className="bi bi-bug me-2"></i>
                  Test Results
                </h5>

                <div className="list-group">
                  <div className={`list-group-item ${contextWorking ? 'list-group-item-success' : 'list-group-item-danger'}`}>
                    <i className={`bi ${contextWorking ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-2`}></i>
                    LikedProductsContext is {contextWorking ? 'loaded ' : 'NOT working L'}
                  </div>

                  <div className={`list-group-item ${likedProducts.length > 0 ? 'list-group-item-success' : 'list-group-item-warning'}`}>
                    <i className={`bi ${likedProducts.length > 0 ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                    likedProducts in localStorage: {likedProducts.length > 0 ? ` (Count: ${likedProducts.length})` : '  Empty'}
                  </div>

                  <div className={`list-group-item ${savedFilters.length > 0 ? 'list-group-item-success' : 'list-group-item-warning'}`}>
                    <i className={`bi ${savedFilters.length > 0 ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                    savedFilters in localStorage: {savedFilters.length > 0 ? ` (Count: ${savedFilters.length})` : '  Empty'}
                  </div>
                </div>
              </div>

              {/* Add Test Data Button */}
              <div className="mb-4">
                <button
                  className="btn btn-primary btn-lg w-100"
                  onClick={addTestData}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Add Test Data
                </button>
                <p className="text-muted small mt-2 mb-0">
                  This will add one test product to liked products and one test filter to saved filters
                </p>
              </div>

              {/* Liked Products Preview */}
              <div className="mb-4">
                <h5 className="mb-3">
                  <i className="bi bi-heart-fill text-danger me-2"></i>
                  Liked Products ({likedProducts.length})
                </h5>
                {likedProducts.length === 0 ? (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    No liked products yet. Click "Add Test Data" or like some products on the product page.
                  </div>
                ) : (
                  <div className="list-group">
                    {likedProducts.slice(0, 5).map(product => (
                      <div key={product._id} className="list-group-item">
                        <div className="d-flex align-items-center">
                          <img
                            src={product.images?.[0]?.url || '/default.png'}
                            alt={product.title}
                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                            className="rounded me-3"
                          />
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{product.title}</h6>
                            <p className="mb-0 text-primary fw-bold">®{product.price || product.currentBid}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {likedProducts.length > 5 && (
                      <div className="list-group-item text-muted text-center">
                        And {likedProducts.length - 5} more...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Saved Filters Preview */}
              <div className="mb-4">
                <h5 className="mb-3">
                  <i className="bi bi-bookmark-fill text-warning me-2"></i>
                  Saved Filters ({savedFilters.length})
                </h5>
                {savedFilters.length === 0 ? (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    No saved filters yet. Click "Add Test Data" or save some filters on the product page.
                  </div>
                ) : (
                  <div className="list-group">
                    {savedFilters.slice(0, 5).map(filter => (
                      <div key={filter.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">
                              <i className="bi bi-bookmark me-1"></i>
                              {filter.name}
                            </h6>
                            <p className="mb-0 text-muted small">
                              Created: {new Date(filter.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {savedFilters.length > 5 && (
                      <div className="list-group-item text-muted text-center">
                        And {savedFilters.length - 5} more...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <div className="row g-2">
                <div className="col-md-6">
                  <Link to="/mylist" className="btn btn-outline-primary w-100">
                    <i className="bi bi-heart me-2"></i>
                    Go to MyList
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link to="/allproduct" className="btn btn-outline-secondary w-100">
                    <i className="bi bi-grid me-2"></i>
                    Go to Products
                  </Link>
                </div>
              </div>

              {/* Debug Info */}
              <div className="mt-4">
                <details className="border rounded p-3">
                  <summary className="fw-bold" style={{ cursor: 'pointer' }}>
                    <i className="bi bi-code-square me-2"></i>
                    Debug Information
                  </summary>
                  <div className="mt-3">
                    <h6>localStorage Contents:</h6>
                    <pre className="bg-light p-3 rounded small" style={{ maxHeight: '200px', overflow: 'auto' }}>
                      <code>
                        likedProducts: {localStorage.getItem('likedProducts') || 'null'}{'\n\n'}
                        savedFilters: {localStorage.getItem('savedFilters') || 'null'}
                      </code>
                    </pre>
                  </div>
                </details>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
