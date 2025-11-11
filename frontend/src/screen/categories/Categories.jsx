import "bootstrap/dist/css/bootstrap.min.css";
import "../../index.css";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { buildApiUrl } from '../../config/api';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export const Categories = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const [categories, setCategories] = useState([]);
  const [currentLevel, setCurrentLevel] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [showProducts, setShowProducts] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          axios.get(buildApiUrl('/api/category/')),
          axios.get(buildApiUrl('/api/product/products'))
        ]);
        
        const cats = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : categoriesResponse.data?.data || [];
        setCategories(cats);

        const prods = Array.isArray(productsResponse.data)
          ? productsResponse.data
          : productsResponse.data?.data || [];
        setProducts(prods);

        // Check if we have a categoryid in the URL
        const categoryId = searchParams.get('categoryid');
        const viewProducts = searchParams.get('view') === 'products';
        
        if (categoryId) {
          // If view=products is requested, redirect to product listing page with filter
          if (viewProducts) {
            navigate(`/allproduct?category=${categoryId}`, { replace: true });
            return;
          }
          setSelectedCategoryId(categoryId);
          setShowProducts(false);
          loadCategoryHierarchy(cats, categoryId);
        } else {
          // Show parent categories - handle both null and populated null cases
          const parentCategories = cats.filter(c => {
            if (!c.parent) return true;
            // If parent is populated but null/empty
            if (typeof c.parent === 'object' && (c.parent === null || !c.parent._id)) return true;
            return false;
          });
          setCurrentLevel(parentCategories);
          setShowProducts(false);
          setSelectedCategoryId(null);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  const loadCategoryHierarchy = (allCategories, categoryId) => {
    // Find the category - convert both to strings for comparison
    const category = allCategories.find(c => {
      const cId = c._id?.toString() || c._id;
      return cId === categoryId.toString();
    });
    if (!category) {
      const parentCategories = allCategories.filter(c => {
        if (!c.parent) return true;
        if (typeof c.parent === 'object' && (c.parent === null || !c.parent._id)) return true;
        return false;
      });
      setCurrentLevel(parentCategories);
      return;
    }

    // Build breadcrumb
    const path = [];
    let current = category;
    while (current) {
      path.unshift(current);
      if (!current.parent) break;
      // Handle both populated and non-populated parent
      const parentId = typeof current.parent === 'object' && current.parent !== null 
        ? current.parent._id?.toString() || current.parent.toString()
        : current.parent.toString();
      current = allCategories.find(c => c._id?.toString() === parentId);
    }

    setBreadcrumb(path.slice(0, -1));

    // Show children of current category
    // Handle both cases: parent as ObjectId string or populated object
    const children = allCategories.filter(c => {
      if (!c.parent) return false;
      // Check if parent is an object (populated) or a string/ObjectId
      const parentId = typeof c.parent === 'object' && c.parent !== null 
        ? c.parent._id?.toString() || c.parent.toString()
        : c.parent.toString();
      return parentId === categoryId.toString();
    });
    
    console.log('Category:', category.title, 'Children found:', children.length);
    setCurrentLevel(children.length > 0 ? children : [category]);
  };

  const handleCategoryClick = (category) => {
    // Handle both cases: parent as ObjectId string or populated object
    const children = categories.filter(c => {
      if (!c.parent) return false;
      const parentId = typeof c.parent === 'object' && c.parent !== null 
        ? c.parent._id?.toString() || c.parent.toString()
        : c.parent.toString();
      return parentId === category._id.toString();
    });

    console.log('Clicked category:', category.title, 'Has children:', children.length);

    if (children.length > 0) {
      // Has children, show subcategories
      setSelectedCategoryId(category._id);
      setShowProducts(false);
      navigate(`/categories?categoryid=${category._id}`);
    } else {
      // Leaf category, redirect to product listing page with filter sidebar
      navigate(`/allproduct?category=${category._id}`);
    }
  };

  const handleViewProducts = (category) => {
    // Redirect to product listing page with filter sidebar
    navigate(`/allproduct?category=${category._id}`);
  };

  const handleBackToSubcategories = () => {
    setShowProducts(false);
    navigate(`/categories?categoryid=${selectedCategoryId}`);
  };

  const getFilteredProducts = () => {
    if (!selectedCategoryId) return [];
    
    return products.filter(product => {
      // Check if product category matches (handle both object and string)
      const productCategoryId = typeof product.category === 'object' && product.category !== null
        ? product.category._id
        : product.category;
      
      return productCategoryId === selectedCategoryId;
    });
  };

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      // Go back to root
      navigate('/categories');
    } else {
      // Navigate to specific level
      const category = breadcrumb[index];
      navigate(`/categories?categoryid=${category._id}`);
    }
  };

  if (loading) {
    return (
      <div className="container my-5">
        <div className="text-center">
          <div className="spinner-border" role="status" style={{ color: '#FF6A00' }}>
            <span className="visually-hidden">{t('loading') || 'Loading...'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-3">
            <i className="bi bi-list-ul me-2" style={{ color: '#FF6A00' }}></i>
            {t('categories') || 'Categories'}
          </h2>

          {/* Breadcrumb */}
          {(breadcrumb.length > 0 || selectedCategoryId) && (
            <nav aria-label="breadcrumb" className="mb-4">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a
                    href="#"
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setShowProducts(false);
                      setSelectedCategoryId(null);
                      handleBreadcrumbClick(-1); 
                    }}
                    style={{ color: '#FF6A00', textDecoration: 'none' }}
                  >
                    <i className="bi bi-house-door"></i> {t('allCategories') || 'All Categories'}
                  </a>
                </li>
                {breadcrumb.map((cat, index) => (
                  <li
                    key={cat._id}
                    className={`breadcrumb-item ${index === breadcrumb.length - 1 ? 'active' : ''}`}
                  >
                    {index === breadcrumb.length - 1 ? (
                      cat.titleMn || cat.title
                    ) : (
                      <a
                        href="#"
                        onClick={(e) => { 
                          e.preventDefault(); 
                          setShowProducts(false);
                          handleBreadcrumbClick(index); 
                        }}
                        style={{ color: '#FF6A00', textDecoration: 'none' }}
                      >
                        {cat.titleMn || cat.title}
                      </a>
                    )}
                  </li>
                ))}
                {selectedCategoryId && breadcrumb.length > 0 && (
                  <li className="breadcrumb-item active">
                    {categories.find(c => c._id === selectedCategoryId)?.titleMn || 
                     categories.find(c => c._id === selectedCategoryId)?.title}
                  </li>
                )}
              </ol>
            </nav>
          )}

          {/* View Products / Back to Categories Button */}
          {selectedCategoryId && (
            <div className="mb-3 d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-0" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                  {showProducts 
                    ? categories.find(c => c._id === selectedCategoryId)?.titleMn || 
                      categories.find(c => c._id === selectedCategoryId)?.title
                    : categories.find(c => c._id === selectedCategoryId)?.titleMn || 
                      categories.find(c => c._id === selectedCategoryId)?.title}
                </h4>
                {showProducts && (
                  <small className="text-muted">
                    {getFilteredProducts().length} {t('items') || 'items'}
                  </small>
                )}
              </div>
              {!showProducts && (
                <button
                  className="btn btn-sm"
                  style={{ backgroundColor: '#FF6A00', color: 'white', borderColor: '#FF6A00' }}
                  onClick={() => {
                    const category = categories.find(c => c._id === selectedCategoryId);
                    if (category) handleViewProducts(category);
                  }}
                >
                  <i className="bi bi-eye me-1"></i>
                  {t('viewProducts') || 'View Products'}
                </button>
              )}
              {showProducts && (
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleBackToSubcategories}
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  {t('backToCategories') || 'Back to Categories'}
                </button>
              )}
            </div>
          )}

          {/* Show Products or Categories */}
          {showProducts ? (
            <div className="row">
              {getFilteredProducts().length > 0 ? (
                getFilteredProducts().map((product) => (
                  <div key={product._id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
                    <div
                      className="card h-100 auction-card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      <div className="card-image-container">
                        <img
                          src={product.images?.find(img => img.isPrimary)?.url || '/default.png'}
                          className="card-img-top"
                          alt={product.title}
                          loading="lazy"
                          style={{ height: '200px', objectFit: 'cover' }}
                        />
                      </div>
                      <div className="card-body d-flex flex-column p-3">
                        <h6 className="card-title text-truncate mb-2">{product.title}</h6>
                        <p className="card-text text-muted small mb-2">
                          {product.description?.substring(0, 50)}...
                        </p>
                        <div className="mt-auto">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted small">{t('currentBid')}</span>
                            <span className="fw-bold" style={{ color: '#FF6A00', fontSize: '1rem' }}>
                              ₮{product.currentBid || product.price}
                            </span>
                          </div>
                          <Link
                            to={`/products/${product._id}`}
                            className="btn w-100 btn-sm text-white fw-bold"
                            style={{ backgroundColor: '#FF6A00', borderColor: '#FF6A00' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <i className="bi bi-arrow-right-circle me-1"></i>
                            {t('placeBid')}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="alert alert-info text-center">
                    {t('noProductsInCategory') || 'No products found in this category'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Category List */
            <div className="list-group">
              {currentLevel.length > 0 ? (
                currentLevel.map((category) => {
                  const hasChildren = categories.filter(c => {
                    if (!c.parent) return false;
                    const parentId = typeof c.parent === 'object' && c.parent !== null 
                      ? c.parent._id?.toString() || c.parent.toString()
                      : c.parent.toString();
                    return parentId === category._id.toString();
                  }).length > 0;

                  return (
                    <div
                      key={category._id}
                      className={`list-group-item list-group-item-action ${isDarkMode ? 'theme-dark' : ''}`}
                      style={{
                        cursor: 'pointer',
                        border: `1px solid ${isDarkMode ? 'var(--color-border)' : '#dee2e6'}`,
                        marginBottom: '0.5rem',
                        borderRadius: '8px',
                        transition: 'all 0.3s ease',
                        backgroundColor: isDarkMode ? 'var(--color-card-bg)' : '#ffffff'
                      }}
                      onClick={() => handleCategoryClick(category)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-hover)' : '#f8f9fa';
                        e.currentTarget.style.borderColor = '#FF6A00';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-card-bg)' : '#ffffff';
                        e.currentTarget.style.borderColor = isDarkMode ? 'var(--color-border)' : '#dee2e6';
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3 flex-grow-1">
                          {category.icon && (
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
                              <i
                                className={`bi bi-${category.icon.replace('-outline', '')} fs-4`}
                                style={{ color: '#FF6A00' }}
                              ></i>
                            </div>
                          )}
                          <div className="flex-grow-1">
                            <h5 className="mb-1 fw-semibold" style={{ 
                              color: isDarkMode ? 'var(--color-text)' : '#2c3e50',
                              fontSize: '1.1rem'
                            }}>
                              {category.titleMn || category.title}
                            </h5>
                            {category.description && (
                              <p className="mb-0 text-muted small" style={{
                                color: isDarkMode ? 'var(--color-text-secondary)' : '#6c757d'
                              }}>
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {hasChildren && (
                          <div className="ms-3" style={{ flexShrink: 0 }}>
                            <i className="bi bi-chevron-right fs-5" style={{ color: '#FF6A00' }}></i>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-12">
                  <div className="alert alert-info text-center">
                    {t('noCategoriesFound') || 'No categories found'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
