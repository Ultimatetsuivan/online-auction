import "bootstrap/dist/css/bootstrap.min.css";

import "../../index.css";

import { useEffect, useState, useMemo } from "react";

import axios from "axios";

import { Link } from "react-router-dom";

import { CountdownTimer } from '../../components/Timer';

import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

import { buildApiUrl } from '../../config/api';

import { useLanguage } from '../../context/LanguageContext';

import { useTheme } from '../../context/ThemeContext';

import { MercariProductCard } from '../../components/MercariProductCard';
import { LikeButton } from '../../components/LikeButton';
import { MyList as MyListContent } from '../mylist/MyList';


export const Home = () => {

  const navigate = useNavigate();

  const location = useLocation();

  const [searchParams, setSearchParams] = useSearchParams();

  const { t, language } = useLanguage();
  const { isDarkMode } = useTheme();
  

  // Only show quick links on home page - ensure exact match

  const isHomePage = location.pathname === '/' || location.pathname === '';



  const [allProducts, setAllProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [categories, setCategories] = useState([]);

  const [allCategories, setAllCategories] = useState([]);

  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const [selectedFilter, setSelectedFilter] = useState(() => {
    const tab = searchParams.get('tab');
    return tab === 'mylist' ? 'mylist' : 'recommended';
  });

  const [expiringProducts, setExpiringProducts] = useState([]);



  useEffect(() => {

    const fetchAllData = async () => {

      try {

        const [productsResponse, categoriesResponse, expiringResponse] = await Promise.all([

          axios.get(buildApiUrl('/api/product/products')),

          axios.get(buildApiUrl('/api/category/')),

          axios.get(buildApiUrl('/api/product/products?filter=ending'))

        ]);



        const products = Array.isArray(productsResponse.data)

          ? productsResponse.data

          : productsResponse.data?.data || [];

        const cats = Array.isArray(categoriesResponse.data)

          ? categoriesResponse.data

          : categoriesResponse.data?.data || [];

        const expiring = Array.isArray(expiringResponse.data)

          ? expiringResponse.data

          : expiringResponse.data?.data || [];



        setAllProducts(products);

        setAllCategories(cats); // Store all categories

        setCategories(cats.filter(c => {

          // Filter parent categories - handle both null and populated null cases

          if (!c.parent) return true;

          if (typeof c.parent === 'object' && (c.parent === null || !c.parent._id)) return true;

          return false;

        })); // Only parent categories

        setExpiringProducts(expiring);



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

    } else {

      // For other filters, show all products (they navigate to allproduct page)

      return allProducts;

    }

  }, [allProducts, selectedFilter]);

  // Sync selectedFilter with URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    const currentTab = tab === 'mylist' ? 'mylist' : 'recommended';
    if (currentTab !== selectedFilter) {
      setSelectedFilter(currentTab);
    }
  }, [searchParams]);



  // Helper function to get all subcategory IDs recursively
  const getAllSubcategoryIds = (categoryId) => {
    const subcats = allCategories.filter((c) => {
      if (!c.parent) return false;
      let parentId;
      if (typeof c.parent === "object" && c.parent !== null) {
        parentId = c.parent._id?.toString();
      } else if (c.parent) {
        parentId = c.parent.toString();
      }
      return parentId === categoryId.toString();
    });

    let allIds = [categoryId];
    subcats.forEach((sub) => {
      allIds = [...allIds, ...getAllSubcategoryIds(sub._id)];
    });
    return allIds;
  };

  // Trending categories (most products) - includes products from subcategories

  const trendingCategories = useMemo(() => {

    if (!categories.length || !allProducts.length) return [];

    return categories.map(cat => {
      // Get all category IDs including subcategories
      const categoryIds = getAllSubcategoryIds(cat._id);

      return {
        ...cat,
        count: allProducts.filter(p => {
          // Handle both populated and non-populated category field
          const productCategoryId = typeof p.category === 'object' && p.category !== null
            ? p.category._id?.toString()
            : p.category?.toString();
          return categoryIds.some(id => id.toString() === productCategoryId);
        }).length
      };

    }).sort((a, b) => b.count - a.count).slice(0, 6);

  }, [categories, allProducts, allCategories]);



  const AuctionCard = ({ auction }) => {
    const [imageError, setImageError] = useState(false);

    // Check if product is new (created within last 7 days)

    const isNew = useMemo(() => {
      const createdDate = new Date(auction.createdAt);
      const daysSinceCreated = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
      return daysSinceCreated <= 7;
    }, [auction.createdAt]);



    const handleCardClick = () => {

      navigate(`/products/${auction._id}`);

    };

    const imageUrl = auction.images?.find(img => img.isPrimary)?.url || auction.images?.[0]?.url;



    return (

      <div style={{ width: '100%' }}>

        <div

          className="card h-100 auction-card border-0"

          style={{

            cursor: 'pointer',

            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',

            borderRadius: '16px',

            overflow: 'hidden',

            width: '100%',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`

          }}

          onClick={handleCardClick}

          onMouseEnter={(e) => {

            e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';

            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';

            e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255, 106, 0, 0.3)' : 'rgba(255, 106, 0, 0.2)';

          }}

          onMouseLeave={(e) => {

            e.currentTarget.style.transform = 'translateY(0) scale(1)';

            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

            e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

          }}

        >

          <div className="card-image-container position-relative" style={{ overflow: 'hidden' }}>

            {imageUrl && !imageError ? (
              <img

                src={imageUrl}

                className="card-img-top"

                alt={auction.title}

                loading="lazy"

                style={{

                  height: '200px',

                  objectFit: 'cover',

                  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'

                }}

                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}

                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}

                onError={() => setImageError(true)}

              />
            ) : (
              <div
                className="card-img-top d-flex align-items-center justify-content-center"
                style={{
                  height: '180px',
                  backgroundColor: isDarkMode ? '#2d3748' : '#f8f9fa'
                }}
              >
                <i className="bi bi-image text-muted" style={{ fontSize: '3rem' }}></i>
              </div>
            )}



            {/* SOLD Ribbon */}

            {auction.status === 'sold' && (

              <div

                className="position-absolute top-0 start-0"

                style={{

                  zIndex: 10,

                  width: '0',

                  height: '0',

                  borderTop: '60px solid #ff3b30',

                  borderRight: '60px solid transparent'

                }}

              >

                <span

                  style={{

                    position: 'absolute',

                    top: '-52px',

                    left: '8px',

                    transform: 'rotate(-45deg)',

                    color: '#fff',

                    fontSize: '0.7rem',

                    fontWeight: '700',

                    letterSpacing: '0.05em'

                  }}

                >

                  SOLD

                </span>

              </div>

            )}



            {/* Badges Top-Left */}

            <div className="position-absolute top-0 start-0 m-2 d-flex flex-column gap-1" style={{ zIndex: 5 }}>

              {isNew && (

                <span className="badge" style={{

                  backgroundColor: '#28a745',

                  color: 'white',

                  fontSize: '0.65rem',

                  fontWeight: '600',

                  padding: '0.35rem 0.6rem',

                  borderRadius: '6px',

                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'

                }}>

                  {language === 'MN' ? 'ШИНЭ' : 'NEW'}

                </span>

              )}

            </div>



            {/* Like Button */}

            <div className="position-absolute top-0 end-0 m-2" style={{ zIndex: 10 }}>

              <LikeButton product={auction} size="sm" />

            </div>

          </div>



          <div className="card-body" style={{ padding: '0.75rem 0.9rem' }}>

            <h6

              className="card-title mb-1"

              style={{

                fontWeight: '500',

                fontSize: '0.9rem',

                overflow: 'hidden',

                textOverflow: 'ellipsis',

                whiteSpace: 'nowrap'

              }}

            >

              {auction.title}

            </h6>



            <div className="d-flex align-items-center justify-content-between mt-1">

              <div

                style={{

                  color: '#FF6A00',

                  fontSize: '1.25rem',

                  fontWeight: '800',
                  letterSpacing: '-0.5px',
                  textShadow: '0 1px 2px rgba(255, 106, 0, 0.1)'

                }}

              >

                ₮{(auction.currentBid || auction.price)?.toLocaleString()}

              </div>

            </div>

          </div>

        </div>

      </div>

    );

  };



  const CategoryCard = ({ category }) => {
    // Helper function to map Ionicons to Bootstrap Icons
    const getBootstrapIcon = (icon) => {
      if (!icon) return "box";

      // If emoji (1-2 chars), return null to render as text
      if (icon.length <= 2) return null;

      // Map Ionicons names to Bootstrap Icons names
      const iconMap = {
        "cube-outline": "box",
        "cube": "box",
        "home-outline": "house",
        "home": "house",
        "cart-outline": "cart",
        "cart": "cart",
        "heart-outline": "heart",
        "heart": "heart",
      };

      return iconMap[icon] || icon.replace('-outline', '');
    };

    const bootstrapIcon = getBootstrapIcon(category.icon);

    return (
      <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
        <Link to={`/allproduct?category=${category._id}`} className="text-decoration-none">
          <div className="card h-100 text-center p-3 hover-effect">
            {category.icon && (
              <div className="mb-2">
                {bootstrapIcon === null ? (
                  <span style={{ fontSize: '3rem', lineHeight: 1 }}>{category.icon}</span>
                ) : (
                  <i className={`bi bi-${bootstrapIcon} fs-1`} style={{ color: '#FF6A00' }}></i>
                )}
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

      <div className="home-page" style={{

      background: isDarkMode

        ? 'linear-gradient(180deg, rgba(20, 20, 20, 1) 0%, rgba(30, 30, 30, 1) 100%)'

        : 'linear-gradient(180deg, rgba(255, 250, 245, 0.8) 0%, rgba(255, 255, 255, 1) 50%, rgba(250, 245, 240, 0.8) 100%)',

      minHeight: '100vh',
      transition: 'background 0.3s ease'

    }}>

      <section

  className="hero-banner"

  style={{

    backgroundColor: '#f5222d', // red-ish, like Mercari

    color: 'white',

    padding: '1.5rem 0 0',

  }}

>

  <div className="container">

    <div

      className="position-relative rounded-3"

      style={{

        backgroundImage: 'url(/images/mercari-banner.png)', // create this image

        backgroundSize: 'cover',

        backgroundPosition: 'center',

        height: '260px',

      }}

    >

      {/* Optional overlay text */}

      <div

        className="position-absolute top-50 start-50 translate-middle text-center"

        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}

      >

        <h2 className="fw-bold mb-2" style={{ fontSize: '1.8rem' }}>

          МОНГОЛЫН АНХНЫ ДУУДЛАГА ХУДАЛДААНЫ ПЛАТФОРМ

        </h2>

        <p className="mb-0" style={{ fontSize: '1rem' }}>

          ӨНӨӨДӨР ШИМТГЭЛГҮЙ БҮХ БАРААГАА ХУДАЛДААРАЙ

        </p>

      </div>

    </div>

  </div>

</section>

      {/* Mercari-Style Tab Bar - Only show on home page */}

      {isHomePage && (

      <section

        className="home-tabs border-bottom"

        style={{

          backgroundColor: isDarkMode ? '#222' : '#fff'

        }}

      >

        <div className="container">

          <div className="d-flex align-items-center gap-4" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>

            <button

              className="btn border-0 rounded-0 py-3 px-2"

              style={{

                borderBottom: selectedFilter === 'recommended' ? '3px solid #FF6A00' : '3px solid transparent',

                color: selectedFilter === 'recommended' ? '#FF6A00' : (isDarkMode ? '#ccc' : '#333'),

                background: 'transparent',

                fontWeight: selectedFilter === 'recommended' ? '700' : '500',

                whiteSpace: 'nowrap'

              }}

              onClick={() => {
                setSearchParams({});
                setSelectedFilter('recommended');
              }}

            >

              {t('recommended')}

            </button>

            <button

              className="btn border-0 rounded-0 py-3 px-2"

              style={{

                borderBottom: selectedFilter === 'mylist' ? '3px solid #FF6A00' : '3px solid transparent',

                color: selectedFilter === 'mylist' ? '#FF6A00' : (isDarkMode ? '#ccc' : '#333'),

                background: 'transparent',

                fontWeight: selectedFilter === 'mylist' ? '700' : '500',

                whiteSpace: 'nowrap'

              }}

              onClick={() => {
                setSearchParams({ tab: 'mylist' });
                setSelectedFilter('mylist');
              }}

            >

              {t('myList')}

            </button>

            <button

              className="btn border-0 rounded-0 py-3 px-2"

              style={{

                borderBottom: '3px solid transparent',

                color: isDarkMode ? '#ccc' : '#333',

                background: 'transparent',

                fontWeight: '500',

                whiteSpace: 'nowrap'

              }}

              onClick={() => {

                const automotiveCategory = allCategories.find(c => {

                  const isAutomotive = (c.title === 'Automotive' || c.titleMn === 'Тээврийн хэрэгсэл');

                  const hasNoParent = !c.parent ||

                    (typeof c.parent === 'object' && (c.parent === null || !c.parent._id));

                  return isAutomotive && hasNoParent;

                });



                if (automotiveCategory) {

                  navigate(`/allproduct?category=${automotiveCategory._id}`);

                } else {

                  navigate('/categories');

                }

              }}

            >

              {language === 'MN' ? 'Машин' : 'Car'}

            </button>

            {(() => {

              const gamingCategory = allCategories.find(c =>

                (c.title === 'Gaming' || c.titleMn === 'Тоглоом') && !c.parent

              );

              const booksCategory = allCategories.find(c =>

                (c.title === 'Books' || c.titleMn === 'Ном') && !c.parent

              );



              return (

                <>

                  {gamingCategory && (

                    <button

                      className="btn border-0 rounded-0 py-3 px-2"

                      style={{

                        borderBottom: '3px solid transparent',

                        color: isDarkMode ? '#ccc' : '#333',

                        background: 'transparent',

                        fontWeight: '500',

                        whiteSpace: 'nowrap'

                      }}

                      onClick={() => navigate(`/allproduct?category=${gamingCategory._id}`)}

                    >

                      {gamingCategory.titleMn || gamingCategory.title}

                    </button>

                  )}

                  {booksCategory && (

                    <button

                      className="btn border-0 rounded-0 py-3 px-2"

                      style={{

                        borderBottom: '3px solid transparent',

                        color: isDarkMode ? '#ccc' : '#333',

                        background: 'transparent',

                        fontWeight: '500',

                        whiteSpace: 'nowrap'

                      }}

                      onClick={() => navigate(`/allproduct?category=${booksCategory._id}`)}

                    >

                      {booksCategory.titleMn || booksCategory.title}

                    </button>

                  )}

                </>

              );

            })()}

          </div>

        </div>

      </section>

      )}



      {/* Expiring Soon Section - Only show on home page and when not in mylist */}

      {isHomePage && selectedFilter !== 'mylist' && expiringProducts.length > 0 && (

      <section className="expiring-soon-section py-5" style={{

        background: isDarkMode

          ? 'linear-gradient(135deg, rgba(255, 106, 0, 0.1) 0%, rgba(255, 106, 0, 0.05) 100%)'

          : 'linear-gradient(135deg, rgba(255, 106, 0, 0.08) 0%, rgba(255, 235, 220, 0.5) 100%)',

        borderTop: '2px solid rgba(255, 106, 0, 0.3)',

        borderBottom: '2px solid rgba(255, 106, 0, 0.3)'

      }}>

        <div className="container">

          <div className="d-flex justify-content-between align-items-center mb-4">

            <h2 className="section-title d-flex align-items-center">

              <i className="bi bi-clock-history me-2" style={{ color: '#FF6A00', fontSize: '2rem' }}></i>

              <span style={{ color: '#FF6A00', fontWeight: 'bold' }}>

                {t('expiringSoon')}

              </span>

              <span className="badge ms-3" style={{

                backgroundColor: '#FF6A00',

                color: 'white',

                fontSize: '0.8rem',

                padding: '0.5rem 0.8rem'

              }}>

                {t('endingIn24Hours')}

              </span>

            </h2>

            <Link to="/allproduct?filter=ending" className="view-all-link" style={{ color: '#FF6A00', fontWeight: 'bold' }}>

              {t('viewAll')} <i className="bi bi-arrow-right"></i>

            </Link>

          </div>



          <div className="d-flex flex-row flex-nowrap overflow-auto pb-2">

            {expiringProducts.slice(0, 8).map((product, index) => (

              <div key={product._id} className="me-3" style={{ minWidth: '220px' }}>

                <AuctionCard auction={product} />

              </div>

            ))}

          </div>



          {expiringProducts.length === 0 && (

            <div className="alert alert-info text-center">

              <i className="bi bi-info-circle me-2"></i>

              {t('noExpiringAuctions')}

            </div>

          )}

        </div>

      </section>

      )}



      {/* Trending Items - Hide when My List is selected */}

      {selectedFilter !== 'mylist' && (

      <section className="trending-items-section py-5" style={{

        backgroundColor: isDarkMode ? 'transparent' : 'rgba(255, 255, 255, 0.5)'

      }}>

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



          {trendingProducts.length > 0 ? (

            <div className="d-flex flex-row flex-nowrap overflow-auto pb-2">

              {trendingProducts.map((product, index) => (

                <div key={product._id} className="me-3" style={{ minWidth: '220px' }}>

                  <AuctionCard auction={product} />

                </div>

              ))}

            </div>

          ) : (

            <div className="alert alert-info text-center">{t('noItemsFound')}</div>

          )}

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





      {/* Recently Viewed - Hide when My List is selected */}

    {selectedFilter !== 'mylist' && recentlyViewed.length > 0 && (

  <section className={`recently-viewed-section py-5 ${isDarkMode ? 'theme-dark' : 'bg-light'}`}>

    <div className="container">

      <div className="d-flex justify-content-between align-items-center mb-3">

        <h2 className="section-title mb-0">

          <i className="bi bi-clock-history" style={{ color: '#FF6A00' }}></i>

          <span className="ms-2">{t('recentlyViewed')}</span>

        </h2>

        <Link to="/allproduct?filter=liked" className="view-all-link">

          {t('viewAll')} <i className="bi bi-arrow-right"></i>

        </Link>

      </div>



      <div className="d-flex flex-row flex-nowrap overflow-auto pb-2">

        {recentlyViewed.map((product, index) => (

          <div key={product._id} className="me-3" style={{ minWidth: '220px' }}>

            <AuctionCard auction={product} />

          </div>

        ))}

      </div>

    </div>

  </section>

)}





      {/* Recommended Content */}

      {selectedFilter === 'recommended' && (

      <section className="recommended-section py-5" style={{

        backgroundColor: isDarkMode ? 'transparent' : 'rgba(255, 255, 255, 0.5)'

      }}>

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

                filteredProducts.slice(0, 12).map((product, index) => (

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



      {/* My List Content - reuse MyList screen inside Home */}

      {selectedFilter === 'mylist' && (

        <section className="mylist-embedded-section py-4">

          <MyListContent />

        </section>

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

              recommendedProducts.map((product, index) => (

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

