import "bootstrap/dist/css/bootstrap.min.css";
import "../../index.css";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { MercariProductCard } from '../../components/MercariProductCard';
import axios from 'axios';
import { buildApiUrl } from '../../config/api';

export const MyListSimple = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState('liked');
  const [likedProducts, setLikedProducts] = useState([]);
  const [savedFilters, setSavedFilters] = useState([]);
  const [previewProducts, setPreviewProducts] = useState([]);

  // Load data from localStorage on mount
  useEffect(() => {
    loadData();
    loadPreviewProducts();
  }, []);

  const loadPreviewProducts = async () => {
    try {
      const response = await axios.get(buildApiUrl('/api/product'), {
        params: { limit: 12, sort: '-createdAt' }
      });
      const products = response.data?.data || response.data?.products || [];
      setPreviewProducts(products.slice(0, 12));
    } catch (err) {
      console.error('Error loading preview products:', err);
    }
  };

  const loadData = () => {
    // Load liked products
    try {
      const liked = localStorage.getItem('likedProducts');
      if (liked) {
        setLikedProducts(JSON.parse(liked));
      }
    } catch (e) {
      console.error('Error loading liked products:', e);
    }

    // Load saved filters (user-specific)
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const userId = user._id || user.id;
        const filters = localStorage.getItem(`savedFilters_${userId}`);
        if (filters) {
          setSavedFilters(JSON.parse(filters));
        }
      }
    } catch (e) {
      console.error('Error loading saved filters:', e);
    }
  };

  const removeLikedProduct = (productId) => {
    const updated = likedProducts.filter(p => p._id !== productId);
    setLikedProducts(updated);
    localStorage.setItem('likedProducts', JSON.stringify(updated));
  };

  const deleteFilter = (filterId) => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      const userId = user._id || user.id;
      const updated = savedFilters.filter(f => f.id !== filterId);
      setSavedFilters(updated);
      localStorage.setItem(`savedFilters_${userId}`, JSON.stringify(updated));
    }
  };

  // Check if user is logged in
  const userData = localStorage.getItem('user');
  const isGuest = !userData;
  const displayProducts = isGuest ? previewProducts : likedProducts;

  return (
    <div className="container my-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">
            <i className="bi bi-eye me-2" style={{ color: '#FF6A00' }}></i>
            My Watchlist
          </h2>

          {/* Simple Tab Buttons */}
          <div className="btn-group mb-4 w-100" role="group">
            <button
              type="button"
              className={`btn ${activeTab === 'liked' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('liked')}
            >
              👁️ Watchlist ({displayProducts.length})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'filters' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('filters')}
            >
              🔖 Saved Filters ({savedFilters.length})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'following' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('following')}
            >
              👥 Following (0)
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('products')}
            >
              📦 New Products (0)
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">

            {/* LIKED PRODUCTS TAB */}
            {activeTab === 'liked' && (
              <div className="card" style={{ position: 'relative' }}>
                <div className="card-header">
                  <h4 className="mb-0">
                    <i className="bi bi-eye-fill me-2" style={{ color: '#FF6A00' }}></i>
                    Watchlist
                  </h4>
                </div>
                <div className="card-body" style={isGuest ? { filter: 'blur(4px)', pointerEvents: 'none', opacity: 0.7 } : {}}>
                  {displayProducts.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-eye fs-1 text-muted mb-3 d-block"></i>
                      <h5>No items in watchlist yet</h5>
                      <p className="text-muted">
                        Click the 👁️ button on products to add them to your watchlist!
                      </p>
                      <Link to="/allproduct" className="btn btn-primary mt-3">
                        <i className="bi bi-search me-2"></i>
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {displayProducts.map((product) => (
                        <div key={product._id} className="col-md-3">
                          <div className="card h-100">
                            <img
                              src={product.images?.[0]?.url || '/default.png'}
                              className="card-img-top"
                              alt={product.title}
                              style={{ height: '150px', objectFit: 'cover' }}
                            />
                            <div className="card-body">
                              <h6 className="card-title">{product.title}</h6>
                              <p className="text-primary fw-bold">₮{product.price || product.currentBid}</p>
                              <button
                                className="btn btn-sm btn-danger w-100"
                                onClick={() => {
                                  if (confirm('Remove from liked products?')) {
                                    removeLikedProduct(product._id);
                                  }
                                }}
                              >
                                <i className="bi bi-trash me-1"></i> Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Guest Overlay */}
                {isGuest && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(2px)',
                      borderRadius: '0.375rem',
                      zIndex: 10
                    }}
                  >
                    <div
                      className={`text-center p-4 rounded shadow-lg ${isDarkMode ? 'bg-dark text-light' : 'bg-white'}`}
                      style={{ maxWidth: '400px', margin: '0 1rem' }}
                    >
                      <i className="bi bi-eye-fill mb-3 d-block" style={{ fontSize: '3rem', color: '#FF6A00' }}></i>
                      <h4 className="mb-3 fw-bold">{t("myWatchlist") || "My Watchlist"}</h4>
                      <p className="text-muted mb-4">
                        {t("loginToViewWatchlist") || "Хайж байгаа барааны жагсаалтаа харахын тулд нэвтэрнэ үү"}
                      </p>
                      <div className="d-flex gap-2 justify-content-center">
                        <Link to="/login" className="btn btn-primary px-4" style={{ backgroundColor: '#FF6A00', borderColor: '#FF6A00' }}>
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          {t("login") || "Нэвтрэх"}
                        </Link>
                        <Link to="/register" className="btn btn-outline-secondary px-4">
                          {t("signup") || "Бүртгүүлэх"}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SAVED FILTERS TAB */}
            {activeTab === 'filters' && (
              <div className="card">
                <div className="card-header">
                  <h4 className="mb-0">
                    <i className="bi bi-bookmark-fill me-2" style={{ color: '#FF6A00' }}></i>
                    Saved Filters
                  </h4>
                </div>
                <div className="card-body">
                  {savedFilters.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-bookmark fs-1 text-muted mb-3 d-block"></i>
                      <h5>No saved filters yet</h5>
                      <p className="text-muted">
                        Save your filter combinations to quickly find products later!
                      </p>
                      <Link to="/allproduct" className="btn btn-primary mt-3">
                        <i className="bi bi-search me-2"></i>
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {savedFilters.map((filter) => {
                        const filterCount = Object.keys(filter.filters || {}).filter(key => {
                          const val = filter.filters[key];
                          if (Array.isArray(val)) return val.length > 0;
                          return val && val !== '';
                        }).length;

                        return (
                          <div key={filter.id} className="col-md-6">
                            <div className="card h-100">
                              <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h5 className="card-title mb-0">
                                    <i className="bi bi-bookmark-fill me-2" style={{ color: '#FF6A00' }}></i>
                                    {filter.name}
                                  </h5>
                                  <button
                                    className="btn btn-sm btn-link text-danger p-0"
                                    onClick={() => {
                                      if (confirm('Delete this filter?')) {
                                        deleteFilter(filter.id);
                                      }
                                    }}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                                <p className="small text-muted mb-2">
                                  <i className="bi bi-funnel me-1"></i>
                                  {filterCount} filters active
                                </p>
                                <p className="small text-muted mb-3">
                                  <i className="bi bi-clock me-1"></i>
                                  {new Date(filter.createdAt).toLocaleDateString()}
                                </p>

                                {/* Filter tags */}
                                <div className="mb-3">
                                  {filter.filters?.selectedCategories?.length > 0 && (
                                    <span className="badge bg-primary me-1 mb-1">
                                      {filter.filters.selectedCategories.length} categories
                                    </span>
                                  )}
                                  {filter.filters?.selectedBrands?.length > 0 && (
                                    <span className="badge bg-info me-1 mb-1">
                                      {filter.filters.selectedBrands.length} brands
                                    </span>
                                  )}
                                  {(filter.filters?.priceMin || filter.filters?.priceMax) && (
                                    <span className="badge bg-success me-1 mb-1">
                                      ₮{filter.filters.priceMin || '0'} - ₮{filter.filters.priceMax || '∞'}
                                    </span>
                                  )}
                                </div>

                                <Link
                                  to="/allproduct"
                                  className="btn btn-sm btn-primary w-100"
                                >
                                  <i className="bi bi-funnel me-1"></i>
                                  Apply Filter
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FOLLOWING TAB */}
            {activeTab === 'following' && (
              <div className="card">
                <div className="card-header">
                  <h4 className="mb-0">
                    <i className="bi bi-people-fill me-2"></i>
                    Following
                  </h4>
                </div>
                <div className="card-body">
                  <div className="text-center py-5">
                    <i className="bi bi-people fs-1 text-muted mb-3 d-block"></i>
                    <h5>No users followed yet</h5>
                    <p className="text-muted">
                      Follow sellers to get notified when they post new products!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* NEW PRODUCTS TAB */}
            {activeTab === 'products' && (
              <div className="card">
                <div className="card-header">
                  <h4 className="mb-0">
                    <i className="bi bi-box-seam-fill me-2"></i>
                    New Products
                  </h4>
                </div>
                <div className="card-body">
                  <div className="text-center py-5">
                    <i className="bi bi-box-seam fs-1 text-muted mb-3 d-block"></i>
                    <h5>No new products</h5>
                    <p className="text-muted">
                      New products from users you follow will appear here!
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default MyListSimple;
