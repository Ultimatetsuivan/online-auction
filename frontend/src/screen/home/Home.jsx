import "bootstrap/dist/css/bootstrap.min.css";
import "../../index.css";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { CountdownTimer } from '../../components/Timer';
import { useNavigate, useLocation } from 'react-router-dom';
import { buildApiUrl } from '../../config/api';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { MercariProductCard } from '../../components/MercariProductCard';
import { useToast } from '../../components/common/Toast';

export const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { isDarkMode } = useTheme();
  const toast = useToast();
  
  // Only show quick links on home page - ensure exact match
  const isHomePage = location.pathname === '/' || location.pathname === '';

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('recommended');
  const [myListProducts, setMyListProducts] = useState([]);
  const [loadingMyList, setLoadingMyList] = useState(false);
  const [savedFilters, setSavedFilters] = useState([]);
  const [followedUsers, setFollowedUsers] = useState([]);
  const [filterProducts, setFilterProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState({});

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          axios.get(buildApiUrl('/api/product/products')),
          axios.get(buildApiUrl('/api/category/'))
        ]);

        const products = Array.isArray(productsResponse.data)
          ? productsResponse.data
          : productsResponse.data?.data || [];
        const cats = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : categoriesResponse.data?.data || [];

        setAllProducts(products);
        setAllCategories(cats); // Store all categories
        setCategories(cats.filter(c => {
          // Filter parent categories - handle both null and populated null cases
          if (!c.parent) return true;
          if (typeof c.parent === 'object' && (c.parent === null || !c.parent._id)) return true;
          return false;
        })); // Only parent categories

        // Load recently viewed from localStorage
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        const viewedProducts = products.filter(p => viewed.includes(p._id));
        setRecentlyViewed(viewedProducts.slice(0, 6));

        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to fetch data");
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Trending products (most bids)
  const trendingProducts = useMemo(() => {
    if (!Array.isArray(allProducts) || allProducts.length === 0) return [];
    const sorted = [...allProducts].sort((a, b) => {
      const aBids = a.bids?.length || 0;
      const bBids = b.bids?.length || 0;
      return bBids - aBids;
    });
    return sorted.slice(0, 6);
  }, [allProducts]);

  // Recommended products
  const recommendedProducts = useMemo(() => {
    if (!Array.isArray(allProducts) || allProducts.length === 0) return [];
    return [...allProducts].slice(0, 6);
  }, [allProducts]);

  // Filtered products based on selectedFilter
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(allProducts) || allProducts.length === 0) return [];
    
    if (selectedFilter === 'recommended') {
      return [...allProducts].slice(0, 20);
    } else if (selectedFilter === 'mylist') {
      return myListProducts;
    } else {
      // For other filters, show all products (they navigate to allproduct page)
      return allProducts;
    }
  }, [allProducts, selectedFilter, myListProducts]);

  // Load My List data when filter is selected
  useEffect(() => {
    if (selectedFilter === 'mylist') {
      loadMyListData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter]);

  const loadMyListData = async () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      setMyListProducts([]);
      setSavedFilters([]);
      setFollowedUsers([]);
      setLoadingMyList(false);
      return;
    }

    setLoadingMyList(true);
    try {
      const user = JSON.parse(userData);
      const token = user.token;

      // Fetch all MyList data
      const [filtersRes, followingRes, followedProductsRes] = await Promise.all([
        axios.get(buildApiUrl('/api/mylist/filters'), {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get(buildApiUrl('/api/mylist/following'), {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get(buildApiUrl('/api/mylist/following/products'), {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);

      setSavedFilters(filtersRes.data || []);
      setFollowedUsers(followingRes.data || []);
      setMyListProducts(followedProductsRes.data || []);
      
      // Load products for each saved filter
      if (filtersRes.data && filtersRes.data.length > 0) {
        loadFilterProducts(filtersRes.data, token);
      }
    } catch (err) {
      console.error('Error loading my list data:', err);
      setMyListProducts([]);
      setSavedFilters([]);
      setFollowedUsers([]);
    } finally {
      setLoadingMyList(false);
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

  // Trending categories (most products)
  const trendingCategories = useMemo(() => {
    if (!categories.length || !allProducts.length) return [];
    return categories.map(cat => ({
      ...cat,
      count: allProducts.filter(p => p.category === cat.title || p.category === cat.titleMn).length
    })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [categories, allProducts]);

  const AuctionCard = ({ auction }) => {
    return (
      <div className="col-lg-3 col-md-4 col-sm-6 mb-3">
        <div className="card h-100 auction-card shadow-sm hover-effect">
          <div className="card-image-container">
            <img
              src={auction.images?.find(img => img.isPrimary)?.url || '/default.png'}
              className="card-img-top"
              alt={auction.title}
              loading="lazy"
              style={{ height: '160px', objectFit: 'cover' }}
            />
          </div>
          <div className="card-body d-flex flex-column p-3">
            <h6 className="card-title text-truncate mb-2">{auction.title}</h6>
            <p className="card-text text-muted small mb-2">{auction.description?.substring(0, 50)}...</p>

            <div className="mt-auto">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small">{t('currentBid')}</span>
                <span className="fw-bold" style={{ color: '#FF6A00', fontSize: '1rem' }}>
                  ₮{auction.currentBid || auction.price}
                </span>
              </div>

              <div className="time-remaining mb-2">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted small">{t('timeLeft')}</span>
                  <CountdownTimer deadline={auction.bidDeadline} />
                </div>
              </div>

              <Link
                to={`/products/${auction._id}`}
                className="btn w-100 btn-sm details-button hover-grow text-white fw-bold"
                style={{ backgroundColor: '#FF6A00', borderColor: '#FF6A00' }}
              >
                <i className="bi bi-arrow-right-circle me-1"></i>{t('placeBid')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CategoryCard = ({ category }) => {
    return (
      <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
        <Link to={`/allproduct?category=${category._id}`} className="text-decoration-none">
          <div className="card h-100 text-center p-3 hover-effect">
            {category.icon && (
              <div className="mb-2">
                <i className={`bi bi-${category.icon.replace('-outline', '')} fs-1`} style={{ color: '#FF6A00' }}></i>
              </div>
            )}
            <h6 className="mb-1 fw-semibold">{category.titleMn || category.title}</h6>
            <p className="text-muted small mb-0">{category.count || 0} {t('items')}</p>
          </div>
        </Link>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '80vh'}}>
        <div className="text-center">
          <div className="spinner-grow" role="status" style={{width: '3rem', height: '3rem', color: '#FF6A00'}}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 fs-5 text-muted">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-octagon-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Quick Links - Only show on home page */}
      {isHomePage && (
      <section className="quick-links-section py-4 border-bottom">
        <div className="container">
          <div className="d-flex flex-wrap gap-2 align-items-center justify-content-center">
            <button
              className={`btn btn-sm ${selectedFilter === 'recommended' ? 'text-white' : 'btn-outline-secondary'}`}
              style={selectedFilter === 'recommended' ? {
                backgroundColor: '#FF6A00',
                borderColor: '#FF6A00'
              } : {}}
              onClick={() => setSelectedFilter('recommended')}
            >
              <i className="bi bi-star me-1"></i> {t('recommended')}
            </button>
            <button
              className={`btn btn-sm ${selectedFilter === 'mylist' ? 'text-white' : 'btn-outline-secondary'}`}
              style={selectedFilter === 'mylist' ? {
                backgroundColor: '#FF6A00',
                borderColor: '#FF6A00'
              } : {}}
              onClick={() => setSelectedFilter('mylist')}
            >
              <i className="bi bi-heart me-1"></i> {t('myList')}
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                // Find Automotive category directly
                const automotiveCategory = allCategories.find(c => {
                  const isAutomotive = (c.title === 'Automotive' || c.titleMn === 'Тээврийн хэрэгсэл');
                  const hasNoParent = !c.parent ||
                    (typeof c.parent === 'object' && (c.parent === null || !c.parent._id));
                  return isAutomotive && hasNoParent;
                });

                if (automotiveCategory) {
                  navigate(`/allproduct?category=${automotiveCategory._id}`);
                } else {
                  console.warn('Automotive category not found, navigating to categories page');
                  navigate('/categories');
                }
              }}
            >
              <i className="bi bi-car-front me-1"></i> {language === 'MN' ? 'Машин' : 'Cars'}
            </button>
            {(() => {
              // Find categories dynamically for quick links
              const gamingCategory = allCategories.find(c => 
                (c.title === 'Gaming' || c.titleMn === 'Тоглоом') && !c.parent
              );
              const booksCategory = allCategories.find(c => 
                (c.title === 'Books' || c.titleMn === 'Ном') && !c.parent
              );
              
              return (
                <>
                  {gamingCategory && (
                    <Link
                      to={`/allproduct?category=${gamingCategory._id}`}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      <i className="bi bi-controller me-1"></i> {language === 'MN' ? (gamingCategory.titleMn || gamingCategory.title) : (gamingCategory.title || gamingCategory.titleMn)}
                    </Link>
                  )}
                  {booksCategory && (
                    <Link
                      to={`/allproduct?category=${booksCategory._id}`}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      <i className="bi bi-book me-1"></i> {language === 'MN' ? (booksCategory.titleMn || booksCategory.title) : (booksCategory.title || booksCategory.titleMn)}
                    </Link>
                  )}
                </>
              );
            })()}
            <Link
              to="/allproduct"
              className="btn btn-sm text-white"
              style={{ backgroundColor: '#FF6A00', borderColor: '#FF6A00' }}
              onClick={() => setSelectedFilter('all')}
            >
              <i className="bi bi-grid-3x3-gap me-1"></i> {t('viewAll')}
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* Trending Items - Hide when My List is selected */}
      {selectedFilter !== 'mylist' && (
      <section className="trending-items-section py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="section-title">
              <i className="bi bi-fire" style={{ color: '#FF6A00' }}></i>
              <span>{t('trendingItems')}</span>
            </h2>
            <Link to="/allproduct?filter=trending" className="view-all-link">
              {t('viewAll')} <i className="bi bi-arrow-right"></i>
            </Link>
          </div>

          <div className="row">
            {trendingProducts.length > 0 ? (
              trendingProducts.map(product => (
                <AuctionCard key={product._id} auction={product} />
              ))
            ) : (
              <div className="col-12">
                <div className="alert alert-info text-center">{t('noItemsFound')}</div>
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      {/* Trending Categories - Hide when My List is selected */}
      {selectedFilter !== 'mylist' && (
      <section className={`trending-categories-section py-5 ${isDarkMode ? 'theme-dark' : 'bg-light'}`}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="section-title">
              <i className="bi bi-grid-3x3-gap" style={{ color: '#FF6A00' }}></i>
              <span>{t('trendingCategories')}</span>
            </h2>
            <Link to="/allproduct" className="view-all-link">
              {t('viewAll')} <i className="bi bi-arrow-right"></i>
            </Link>
          </div>

          <div className="row">
            {trendingCategories.length > 0 ? (
              trendingCategories.map(category => (
                <CategoryCard key={category._id} category={category} />
              ))
            ) : (
              <div className="col-12">
                <div className="alert alert-info text-center">{t('noItemsFound')}</div>
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      {/* Trending Brands - Placeholder - Hide when My List is selected */}
      {selectedFilter !== 'mylist' && (
      <section className="trending-brands-section py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="section-title">
              <i className="bi bi-award" style={{ color: '#FF6A00' }}></i>
              <span>{t('trendingBrands')}</span>
            </h2>
            <Link to="/allproduct" className="view-all-link">
              {t('viewAll')} <i className="bi bi-arrow-right"></i>
            </Link>
          </div>

          <div className="row">
            {['Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG'].map((brand, index) => (
              <div key={index} className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                <div className="card text-center p-3 hover-effect">
                  <div className="mb-2">
                    <i className="bi bi-award fs-1" style={{ color: '#FF6A00' }}></i>
                  </div>
                  <h6 className="mb-0 fw-semibold">{brand}</h6>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Recently Viewed - Hide when My List is selected */}
      {selectedFilter !== 'mylist' && recentlyViewed.length > 0 && (
        <section className={`recently-viewed-section py-5 ${isDarkMode ? 'theme-dark' : 'bg-light'}`}>
          <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="section-title">
              <i className="bi bi-clock-history" style={{ color: '#FF6A00' }}></i>
              <span>{t('recentlyViewed')}</span>
              </h2>
            </div>

            <div className="row">
              {recentlyViewed.map(product => (
                <AuctionCard key={product._id} auction={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recommended Content */}
      {selectedFilter === 'recommended' && (
      <section className="recommended-section py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="section-title">
                <i className="bi bi-star" style={{ color: '#FF6A00' }}></i>
                <span>{t('recommendedProducts')}</span>
            </h2>
              <Link to="/allproduct" className="view-all-link">
                {t('viewAll')} <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

            <div className="row">
              {filteredProducts.length > 0 ? (
                filteredProducts.slice(0, 12).map(product => (
                  <AuctionCard key={product._id} auction={product} />
                ))
              ) : (
                <div className="col-12">
                  <div className="alert alert-info text-center">{t('noItemsFound')}</div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* My List Content - All sections directly without tabs */}
      {selectedFilter === 'mylist' && (
        <div className="container my-4">
          <h2 className="mb-4">
            <i className="bi bi-heart me-2" style={{ color: '#FF6A00' }}></i>
            {t('myList')}
          </h2>

          {loadingMyList ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status" style={{ color: '#FF6A00' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : !localStorage.getItem('user') ? (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              {t('login')} {t('myList').toLowerCase()}
            </div>
          ) : (
            <>
              {/* Saved Filters Section */}
              <section className="mb-5">
                <h3 className="mb-4 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                  <i className="bi bi-funnel me-2" style={{ color: '#FF6A00' }}></i>
                  Saved Filters
                </h3>
                {savedFilters.length === 0 ? (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    {t('noSavedFilters')}
                  </div>
                ) : (
                  <div>
                    {savedFilters.map(filter => {
                      const products = filterProducts[filter._id] || [];
                      const isLoading = loadingProducts[filter._id];
                      const filterQuery = filter.filterData?.searchQuery || filter.name;
                      
                      return (
                        <div key={filter._id} className="mb-5">
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
                                  {t('notificationsEnabled')}
                                </span>
                              )}
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
                                {t('viewAll')} &gt;
                              </Link>
                            </div>
                          </div>

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
                              {t('noProductsInFilter')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Following Section */}
              <section className="mb-5">
                <h3 className="mb-4 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                  <i className="bi bi-people me-2" style={{ color: '#FF6A00' }}></i>
                  Following
                </h3>
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* New Products Section */}
              <section>
                <h3 className="mb-4 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                  <i className="bi bi-box-seam me-2" style={{ color: '#FF6A00' }}></i>
                  New Products
                </h3>
                {myListProducts.length === 0 ? (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    {t('noNewProducts')}
                  </div>
                ) : (
                  <div className="mercari-product-grid">
                    {myListProducts.map(product => (
                      <MercariProductCard 
                        key={product._id} 
                        product={product}
                        showLikeButton={false}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {/* Default Recommended Products - Only show when no filter is active or other filters */}
      {selectedFilter !== 'recommended' && selectedFilter !== 'mylist' && (
        <section className="recommended-section py-5">
          <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="section-title">
                <i className="bi bi-star" style={{ color: '#FF6A00' }}></i>
                <span>{t('recommendedProducts')}</span>
              </h2>
              <Link to="/allproduct" className="view-all-link">
                {t('viewAll')} <i className="bi bi-arrow-right"></i>
            </Link>
          </div>

          <div className="row">
            {recommendedProducts.length > 0 ? (
              recommendedProducts.map(product => (
                <AuctionCard key={product._id} auction={product} />
              ))
            ) : (
              <div className="col-12">
                  <div className="alert alert-info text-center">{t('noItemsFound')}</div>
              </div>
            )}
          </div>
        </div>
      </section>
      )}
    </div>
  );
};
