import "bootstrap/dist/css/bootstrap.min.css";
import "../../index.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { buildApiUrl } from '../../config/api';
import { useToast } from '../../components/common/Toast';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { MercariProductCard } from '../../components/MercariProductCard';

export const MyList = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('filters');
  const [savedFilters, setSavedFilters] = useState([]);
  const [followedUsers, setFollowedUsers] = useState([]);
  const [filterProducts, setFilterProducts] = useState({});
  const [followedProducts, setFollowedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState({});

  useEffect(() => {
    loadMyList();
  }, []);

  const loadMyList = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        navigate('/login');
        return;
      }

      const user = JSON.parse(userData);
      const token = user.token;

      const [filtersRes, followingRes, followedProductsRes] = await Promise.all([
        axios.get(buildApiUrl('/api/mylist/filters'), {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(buildApiUrl('/api/mylist/following'), {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(buildApiUrl('/api/mylist/following/products'), {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setSavedFilters(filtersRes.data);
      setFollowedUsers(followingRes.data);
      setFollowedProducts(followedProductsRes.data);
      setLoading(false);
      
      // Load products for each saved filter
      if (filtersRes.data.length > 0) {
        loadFilterProducts(filtersRes.data, user.token);
      }
    } catch (err) {
      console.error('Error loading my list:', err);
      setError(err.message || 'Failed to load your list');
      setLoading(false);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const loadFilterProducts = async (filters, token) => {
    const loadingStates = {};
    const productsMap = {};
    
    for (const filter of filters) {
      loadingStates[filter._id] = true;
      try {
        const response = await axios.get(buildApiUrl(`/api/mylist/filters/${filter._id}/products`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        productsMap[filter._id] = response.data || [];
      } catch (err) {
        console.error(`Error loading products for filter ${filter._id}:`, err);
        productsMap[filter._id] = [];
      } finally {
        loadingStates[filter._id] = false;
      }
    }
    
    setFilterProducts(productsMap);
    setLoadingProducts(loadingStates);
  };

  const deleteFilter = async (filterId) => {
    try {
      const userData = localStorage.getItem('user');
      const user = JSON.parse(userData);
      const token = user.token;

      await axios.delete(buildApiUrl(`/api/mylist/filters/${filterId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSavedFilters(savedFilters.filter(f => f._id !== filterId));
      // Remove products for deleted filter
      const newFilterProducts = { ...filterProducts };
      delete newFilterProducts[filterId];
      setFilterProducts(newFilterProducts);
    } catch (err) {
      console.error('Error deleting filter:', err);
      toast.error('Failed to delete filter');
    }
  };

  const unfollowUser = async (userId) => {
    try {
      const userData = localStorage.getItem('user');
      const user = JSON.parse(userData);
      const token = user.token;

      await axios.delete(buildApiUrl(`/api/mylist/follow/${userId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFollowedUsers(followedUsers.filter(f => f.following._id !== userId));
      // Refresh followed products
      const followedProductsRes = await axios.get(buildApiUrl('/api/mylist/following/products'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFollowedProducts(followedProductsRes.data);
    } catch (err) {
      console.error('Error unfollowing user:', err);
      toast.error('Failed to unfollow user');
    }
  };

  const viewFilterProducts = (filterId) => {
    const filter = savedFilters.find(f => f._id === filterId);
    if (filter && filter.filterData) {
      const params = new URLSearchParams();
      if (filter.filterData.category) params.append('category', filter.filterData.category);
      if (filter.filterData.brand) params.append('brand', filter.filterData.brand);
      if (filter.filterData.searchQuery) params.append('search', filter.filterData.searchQuery);
      if (filter.filterData.minPrice) params.append('minPrice', filter.filterData.minPrice);
      if (filter.filterData.maxPrice) params.append('maxPrice', filter.filterData.maxPrice);

      navigate(`/allproduct?${params.toString()}`);
    }
  };

  if (loading) {
    return (
      <div className="container my-5">
        <div className="text-center">
          <div className="spinner-border" role="status" style={{ color: '#FF6A00' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-octagon-fill me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">
            <i className="bi bi-heart me-2" style={{ color: '#FF6A00' }}></i>
            My List
          </h2>

          {/* Tabs - Long List Format */}
          <div className="list-group mb-4">
            <div
              className={`list-group-item list-group-item-action ${isDarkMode ? 'theme-dark' : ''}`}
              style={{
                cursor: 'pointer',
                border: `1px solid ${isDarkMode ? 'var(--color-border)' : '#dee2e6'}`,
                marginBottom: '0.5rem',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                backgroundColor: activeTab === 'filters' ? (isDarkMode ? 'var(--color-hover)' : '#f8f9fa') : (isDarkMode ? 'var(--color-card-bg)' : '#ffffff'),
                borderColor: activeTab === 'filters' ? '#FF6A00' : (isDarkMode ? 'var(--color-border)' : '#dee2e6')
              }}
              onClick={() => setActiveTab('filters')}
              onMouseEnter={(e) => {
                if (activeTab !== 'filters') {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-hover)' : '#f8f9fa';
                  e.currentTarget.style.borderColor = '#FF6A00';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'filters') {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-card-bg)' : '#ffffff';
                  e.currentTarget.style.borderColor = isDarkMode ? 'var(--color-border)' : '#dee2e6';
                }
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      backgroundColor: isDarkMode ? 'var(--color-surface)' : 'rgba(255, 106, 0, 0.1)',
                      flexShrink: 0
                    }}
                  >
                    <i className="bi bi-funnel fs-4" style={{ color: '#FF6A00' }}></i>
                  </div>
                  <div>
                    <h5 className="mb-1 fw-semibold" style={{ 
                      color: isDarkMode ? 'var(--color-text)' : '#2c3e50',
                      fontSize: '1.1rem'
                    }}>
                      Saved Filters
                    </h5>
                    <p className="mb-0 text-muted small" style={{
                      color: isDarkMode ? 'var(--color-text-secondary)' : '#6c757d'
                    }}>
                      {savedFilters.length} saved filter{savedFilters.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <i className="bi bi-chevron-right fs-5" style={{ color: '#FF6A00' }}></i>
              </div>
            </div>

            <div
              className={`list-group-item list-group-item-action ${isDarkMode ? 'theme-dark' : ''}`}
              style={{
                cursor: 'pointer',
                border: `1px solid ${isDarkMode ? 'var(--color-border)' : '#dee2e6'}`,
                marginBottom: '0.5rem',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                backgroundColor: activeTab === 'following' ? (isDarkMode ? 'var(--color-hover)' : '#f8f9fa') : (isDarkMode ? 'var(--color-card-bg)' : '#ffffff'),
                borderColor: activeTab === 'following' ? '#FF6A00' : (isDarkMode ? 'var(--color-border)' : '#dee2e6')
              }}
              onClick={() => setActiveTab('following')}
              onMouseEnter={(e) => {
                if (activeTab !== 'following') {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-hover)' : '#f8f9fa';
                  e.currentTarget.style.borderColor = '#FF6A00';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'following') {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-card-bg)' : '#ffffff';
                  e.currentTarget.style.borderColor = isDarkMode ? 'var(--color-border)' : '#dee2e6';
                }
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      backgroundColor: isDarkMode ? 'var(--color-surface)' : 'rgba(255, 106, 0, 0.1)',
                      flexShrink: 0
                    }}
                  >
                    <i className="bi bi-people fs-4" style={{ color: '#FF6A00' }}></i>
                  </div>
                  <div>
                    <h5 className="mb-1 fw-semibold" style={{ 
                      color: isDarkMode ? 'var(--color-text)' : '#2c3e50',
                      fontSize: '1.1rem'
                    }}>
                      Following
                    </h5>
                    <p className="mb-0 text-muted small" style={{
                      color: isDarkMode ? 'var(--color-text-secondary)' : '#6c757d'
                    }}>
                      {followedUsers.length} user{followedUsers.length !== 1 ? 's' : ''} followed
                    </p>
                  </div>
                </div>
                <i className="bi bi-chevron-right fs-5" style={{ color: '#FF6A00' }}></i>
              </div>
            </div>

            <div
              className={`list-group-item list-group-item-action ${isDarkMode ? 'theme-dark' : ''}`}
              style={{
                cursor: 'pointer',
                border: `1px solid ${isDarkMode ? 'var(--color-border)' : '#dee2e6'}`,
                marginBottom: '0.5rem',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                backgroundColor: activeTab === 'products' ? (isDarkMode ? 'var(--color-hover)' : '#f8f9fa') : (isDarkMode ? 'var(--color-card-bg)' : '#ffffff'),
                borderColor: activeTab === 'products' ? '#FF6A00' : (isDarkMode ? 'var(--color-border)' : '#dee2e6')
              }}
              onClick={() => setActiveTab('products')}
              onMouseEnter={(e) => {
                if (activeTab !== 'products') {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-hover)' : '#f8f9fa';
                  e.currentTarget.style.borderColor = '#FF6A00';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'products') {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-card-bg)' : '#ffffff';
                  e.currentTarget.style.borderColor = isDarkMode ? 'var(--color-border)' : '#dee2e6';
                }
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      backgroundColor: isDarkMode ? 'var(--color-surface)' : 'rgba(255, 106, 0, 0.1)',
                      flexShrink: 0
                    }}
                  >
                    <i className="bi bi-box-seam fs-4" style={{ color: '#FF6A00' }}></i>
                  </div>
                  <div>
                    <h5 className="mb-1 fw-semibold" style={{ 
                      color: isDarkMode ? 'var(--color-text)' : '#2c3e50',
                      fontSize: '1.1rem'
                    }}>
                      New Products
                    </h5>
                    <p className="mb-0 text-muted small" style={{
                      color: isDarkMode ? 'var(--color-text-secondary)' : '#6c757d'
                    }}>
                      {followedProducts.length} new product{followedProducts.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <i className="bi bi-chevron-right fs-5" style={{ color: '#FF6A00' }}></i>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Saved Filters Tab */}
            {activeTab === 'filters' && (
              <div>
                {savedFilters.length === 0 ? (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    {t('noSavedFilters') || 'No saved filters yet. Save your search filters to get notified when new products match!'}
                  </div>
                ) : (
                  <div>
                    {savedFilters.map(filter => {
                      const products = filterProducts[filter._id] || [];
                      const isLoading = loadingProducts[filter._id];
                      const filterQuery = filter.filterData?.searchQuery || filter.name;
                      
                      return (
                        <div key={filter._id} className="mb-5">
                          {/* Filter Header - Similar to Mercari saved search */}
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                              <h4 className="mb-1 fw-bold" style={{ 
                                color: isDarkMode ? 'var(--color-text)' : '#2c3e50',
                                fontSize: '1.5rem'
                              }}>
                                {filter.name || filterQuery}
                              </h4>
                              {filter.filterData?.searchQuery && (
                                <p className="mb-0 text-muted" style={{
                                  color: isDarkMode ? 'var(--color-text-secondary)' : '#6c757d',
                                  fontSize: '1.1rem'
                                }}>
                                  {filter.filterData.searchQuery}
                                </p>
                              )}
                            </div>
                            <div className="d-flex gap-2">
                              {filter.notifyOnNewProducts && (
                                <span className="badge bg-success align-self-center">
                                  <i className="bi bi-bell-fill me-1"></i>
                                  {t('notificationsEnabled') || 'Notifications ON'}
                                </span>
                              )}
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deleteFilter(filter._id)}
                                title={t('delete') || 'Delete'}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                              <Link
                                to={`/allproduct?${new URLSearchParams({
                                  ...(filter.filterData?.category && { category: filter.filterData.category }),
                                  ...(filter.filterData?.brand && { brand: filter.filterData.brand }),
                                  ...(filter.filterData?.searchQuery && { search: filter.filterData.searchQuery }),
                                  ...(filter.filterData?.minPrice && { minPrice: filter.filterData.minPrice }),
                                  ...(filter.filterData?.maxPrice && { maxPrice: filter.filterData.maxPrice })
                                }).toString()}`}
                                className="btn btn-sm text-white"
                                style={{ backgroundColor: '#FF6A00', borderColor: '#FF6A00' }}
                              >
                                {t('viewAll') || 'See All'} &gt;
                              </Link>
                            </div>
                          </div>

                          {/* Filter Tags */}
                          {(filter.filterData?.category || filter.filterData?.brand || filter.filterData?.minPrice || filter.filterData?.maxPrice) && (
                            <div className="mb-3">
                              {filter.filterData.category && (
                                <span className="badge bg-secondary me-2 mb-2">
                                  <i className="bi bi-tag me-1"></i>{filter.filterData.category}
                                </span>
                              )}
                              {filter.filterData.brand && (
                                <span className="badge bg-secondary me-2 mb-2">
                                  <i className="bi bi-award me-1"></i>{filter.filterData.brand}
                                </span>
                              )}
                              {(filter.filterData.minPrice || filter.filterData.maxPrice) && (
                                <span className="badge bg-secondary me-2 mb-2">
                                  <i className="bi bi-currency-dollar me-1"></i>
                                  {filter.filterData.minPrice || '0'} - {filter.filterData.maxPrice || '∞'}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Products Grid - Mercari Style */}
                          {isLoading ? (
                            <div className="text-center py-4">
                              <div className="spinner-border spinner-border-sm" role="status" style={{ color: '#FF6A00' }}>
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </div>
                          ) : products.length > 0 ? (
                            <div className="mercari-product-grid">
                              {products.slice(0, 10).map(product => (
                                <MercariProductCard 
                                  key={product._id} 
                                  product={product}
                                  showLikeButton={false}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="alert alert-info mb-0">
                              <i className="bi bi-info-circle me-2"></i>
                              {t('noProductsInFilter') || 'No products found matching this filter.'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Following Tab */}
            {activeTab === 'following' && (
              <div>
                {followedUsers.length === 0 ? (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Not following anyone yet. Follow sellers to get notified when they post new products!
                  </div>
                ) : (
                  <div className="list-group">
                    {followedUsers.map(follow => (
                      <div
                        key={follow._id}
                        className={`list-group-item ${isDarkMode ? 'theme-dark' : ''}`}
                        style={{
                          border: `1px solid ${isDarkMode ? 'var(--color-border)' : '#dee2e6'}`,
                          marginBottom: '0.5rem',
                          borderRadius: '8px',
                          backgroundColor: isDarkMode ? 'var(--color-card-bg)' : '#ffffff'
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-3 flex-grow-1">
                            <div
                              className="d-flex align-items-center justify-content-center"
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: isDarkMode ? 'var(--color-surface)' : 'rgba(255, 106, 0, 0.1)',
                                flexShrink: 0
                              }}
                            >
                              <i className="bi bi-person-circle fs-3" style={{ color: '#FF6A00' }}></i>
                            </div>
                            <div className="flex-grow-1">
                              <h5 className="mb-1 fw-semibold" style={{ 
                                color: isDarkMode ? 'var(--color-text)' : '#2c3e50',
                                fontSize: '1.1rem'
                              }}>
                                {follow.following?.name || 'Unknown User'}
                              </h5>
                              <p className="mb-0 text-muted small" style={{
                                color: isDarkMode ? 'var(--color-text-secondary)' : '#6c757d'
                              }}>
                                {follow.following?.email}
                              </p>
                              {follow.notifyOnNewProducts && (
                                <span className="badge bg-success mt-2">
                                  <i className="bi bi-bell-fill me-1"></i>
                                  Notifications ON
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-danger ms-3"
                            onClick={() => unfollowUser(follow.following._id)}
                          >
                            Unfollow
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* New Products Tab */}
            {activeTab === 'products' && (
              <div>
                {followedProducts.length === 0 ? (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    {t('noNewProducts') || 'No new products from users you follow yet.'}
                  </div>
                ) : (
                  <div className="mercari-product-grid">
                    {followedProducts.map(product => (
                      <MercariProductCard 
                        key={product._id} 
                        product={product}
                        showLikeButton={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
