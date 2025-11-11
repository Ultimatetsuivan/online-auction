import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { io } from 'socket.io-client';
import { CountdownTimer } from '../../components/Timer';
import { FaSearch,  FaTimes, FaGavel, FaInfoCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { apiConfig, buildApiUrl } from '../../config/api';
import { useToast } from '../../components/common/Toast';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export const Product = () => {
  const toast = useToast();
  const { t, language } = useLanguage();
  const { isDarkMode } = useTheme();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidErrors, setBidErrors] = useState({}); 
  const [error, setError] = useState(null);
  const [bidAmounts, setBidAmounts] = useState({});
  const [socket, setSocket] = useState(null);
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(6);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedBrands, setSelectedBrands] = useState([]); // Multiple brand selection
  const [selectedCategories, setSelectedCategories] = useState([]); // Multiple category selection
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [verifiedSeller, setVerifiedSeller] = useState(false);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);
  const [verifiedProduct, setVerifiedProduct] = useState(false);
  const [allCategoriesWithChildren, setAllCategoriesWithChildren] = useState([]); // All categories including subcategories
  const [expandedCategories, setExpandedCategories] = useState(new Set()); // Track which categories have subcategories shown
  const [collapsedSections, setCollapsedSections] = useState({
    condition: true, // Hidden by default
    color: true,
    size: true
  });

  const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token || localStorage.getItem('token');
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
useEffect(() => {
  const token = getAuthToken(); 

  const newSocket = io(apiConfig.socketURL, {
    withCredentials: true,
    transports: ['websocket'],
    query: { token }
  });

  setSocket(newSocket);

  return () => newSocket.disconnect();
}, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, categoriesResponse, brandsResponse] = await Promise.all([
          axios.get(buildApiUrl('/api/product/products')),
          axios.get(buildApiUrl('/api/category/')),
          axios.get(buildApiUrl('/api/brand/')).catch(() => ({ data: [] }))
        ]);

        // Handle different response formats
        const products = Array.isArray(productsResponse.data)
          ? productsResponse.data
          : productsResponse.data?.data || [];
        const categories = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : categoriesResponse.data?.data || [];
        const brands = Array.isArray(brandsResponse.data)
          ? brandsResponse.data
          : brandsResponse.data?.data || [];

        setProducts(products);
        // Filter to only parent categories for main list
        const parentCategories = categories.filter(c => {
          if (!c.parent) return true;
          if (typeof c.parent === 'object' && (c.parent === null || !c.parent._id)) return true;
          return false;
        });
        setCategories(parentCategories);
        setAllCategoriesWithChildren(categories); // Store all categories for subcategory lookup
        setBrands(brands);

        const queryParams = new URLSearchParams(location.search);
        const searchParam = queryParams.get('search');
        const categoryParam = queryParams.get('category');

        // Set category from URL - convert to string for consistency
        if (categoryParam) {
          setSelectedCategory(categoryParam.toString());
        } else {
          setSelectedCategory('all');
        }

        if (searchParam) {
          setSearchQuery(searchParam);
        } else {
          setSearchQuery('');
        }

        const initialBids = {};
        products.forEach(product => {
          initialBids[product._id] = (product.currentBid || product.price) + 1000;
        });
        setBidAmounts(initialBids);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.search]);
  
  // Update selected category when URL changes
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const categoryParam = queryParams.get('category');
    if (categoryParam) {
      const categoryId = categoryParam.toString();
      setSelectedCategory(categoryId);
      // Also add to multiple selection if not already there
      setSelectedCategories(prev => {
        if (!prev.includes(categoryId)) {
          return [...prev, categoryId];
        }
        return prev;
      });
      
      // Check if this category has subcategories and expand it
      const category = allCategoriesWithChildren.find(c => {
        const catId = typeof c._id === 'string' ? c._id : c._id?.toString();
        return catId === categoryId;
      });
      
      if (category) {
        // Check if this is a subcategory - if so, expand its parent
        const parentId = typeof category.parent === 'object' && category.parent !== null
          ? category.parent._id?.toString()
          : category.parent?.toString();
        
        if (parentId) {
          // This is a subcategory, expand parent
          setExpandedCategories(prev => new Set([...prev, parentId]));
        } else {
          // This is a parent category, check if it has children and expand
          const hasChildren = allCategoriesWithChildren.some(c => {
            const cParentId = typeof c.parent === 'object' && c.parent !== null
              ? c.parent._id?.toString()
              : c.parent?.toString();
            return cParentId === categoryId;
          });
          if (hasChildren) {
            setExpandedCategories(prev => new Set([...prev, categoryId]));
          }
        }
      }
    } else if (location.search && !location.search.includes('category')) {
      // Only reset to 'all' if category param is explicitly removed
      setSelectedCategory('all');
      setSelectedCategories([]);
      setExpandedCategories(new Set());
    }
  }, [location.search, allCategoriesWithChildren]); 
  
  useEffect(() => {
    if (!socket) return;

    const handleBidUpdate = async (updatedProduct) => {
      const isOutbid = await checkBidStatus(updatedProduct._id);
      
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product._id === updatedProduct._id 
            ? { ...updatedProduct, isUserOutbid: isOutbid }
            : product
        )
      );
      
      setFilteredProducts(prev => 
        prev.map(product => 
          product._id === updatedProduct._id 
            ? { ...updatedProduct, isUserOutbid: isOutbid }
            : product
        )
      );
      
      setBidAmounts(prev => ({
        ...prev,
        [updatedProduct._id]: updatedProduct.currentBid + 500
      }));
    };

    socket.on('bidUpdate', handleBidUpdate);
    socket.on('bidError', (error) => setError(error.message));

    return () => {
      socket.off('bidUpdate', handleBidUpdate);
      socket.off('bidError');
    };
  }, [socket]);

  const checkBidStatus = async (productId) => {
    const token = getAuthToken();

    try {
      const response = await axios.get(
        buildApiUrl(`/api/bidding/check-bid-status/${productId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.isOutbid;
    } catch (error) {
      console.error('Error checking bid status:', error);
      return false;
    }
  };
  
  useEffect(() => {
    // Ensure products is an array
    if (!Array.isArray(products)) {
      setFilteredProducts([]);
      return;
    }

    let result = [...products];

    // Search filter
    if (searchQuery) {
      result = result.filter(product =>
        product.title && product.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter - support both single and multiple selection
    if (selectedCategories.length > 0) {
      result = result.filter(product => {
        const productCategoryId = typeof product.category === 'object' && product.category !== null
          ? product.category._id?.toString()
          : product.category?.toString();
        return selectedCategories.some(catId => catId.toString() === productCategoryId);
      });
    } else if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter(product => {
        if (typeof product.category === 'object' && product.category !== null) {
          return product.category._id === selectedCategory;
        } else {
          return product.category === selectedCategory;
        }
      });
    }

    // Brand filter - support both single and multiple selection
    if (selectedBrands.length > 0) {
      result = result.filter(product => {
        const productBrandId = typeof product.brand === 'object' && product.brand !== null
          ? product.brand._id?.toString()
          : product.brand?.toString();
        return selectedBrands.some(brandId => brandId.toString() === productBrandId);
      });
    } else if (selectedBrand && selectedBrand !== 'all') {
      result = result.filter(product => {
        if (typeof product.brand === 'object' && product.brand !== null) {
          return product.brand._id === selectedBrand;
        } else {
          return product.brand === selectedBrand;
        }
      });
    }

    // Price range filter
    if (priceRange.min !== '') {
      const minPrice = parseFloat(priceRange.min);
      result = result.filter(product => (product.currentBid || product.price) >= minPrice);
    }
    if (priceRange.max !== '') {
      const maxPrice = parseFloat(priceRange.max);
      result = result.filter(product => (product.currentBid || product.price) <= maxPrice);
    }

    // Condition filter
    if (selectedCondition && selectedCondition !== 'all') {
      result = result.filter(product => product.condition === selectedCondition);
    }

    // Color filter
    if (selectedColors.length > 0) {
      result = result.filter(product => {
        const productColor = product.color?.toLowerCase();
        return selectedColors.some(color => productColor === color.toLowerCase());
      });
    }

    // Size filter
    if (selectedSizes.length > 0) {
      result = result.filter(product => {
        const productSize = product.size?.toLowerCase();
        return selectedSizes.some(size => productSize === size.toLowerCase());
      });
    }

    // Verified seller filter
    if (verifiedSeller) {
      result = result.filter(product => product.user?.verified === true);
    }

    // Verified product filter
    if (verifiedProduct) {
      result = result.filter(product => product.verified === true);
    }

    // Status filter
    if (selectedStatus && selectedStatus !== 'all') {
      const now = new Date();
      result = result.filter(product => {
        const deadline = new Date(product.bidDeadline);
        const hoursRemaining = (deadline - now) / (1000 * 60 * 60);

        switch (selectedStatus) {
          case 'active':
            return hoursRemaining > 24;
          case 'ending-soon':
            return hoursRemaining <= 24 && hoursRemaining > 1;
          case 'ending-today':
            return hoursRemaining <= 1 && hoursRemaining > 0;
          default:
            return true;
        }
      });
    }

    // Sorting
    switch (sortOption) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'price-low':
        result.sort((a, b) => (a.currentBid || a.price) - (b.currentBid || b.price));
        break;
      case 'price-high':
        result.sort((a, b) => (b.currentBid || b.price) - (a.currentBid || a.price));
        break;
      case 'ending-soon':
        result.sort((a, b) => new Date(a.bidDeadline) - new Date(b.bidDeadline));
        break;
      default:
        break;
    }

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [sortOption, products, searchQuery, selectedCategory, selectedCategories, selectedBrand, selectedBrands, priceRange, selectedCondition, selectedStatus, selectedColors, selectedSizes, verifiedSeller, verifiedProduct]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Get current filter/category name for header
  const getCurrentFilterName = () => {
    // Priority: Search Query > Category > Brand > Condition > Status > Default
    if (searchQuery) {
      return searchQuery;
    }
    
    if (selectedCategory && selectedCategory !== 'all') {
      const category = categories.find(c => {
        const categoryId = typeof c._id === 'string' ? c._id : c._id?.toString();
        const selectedId = typeof selectedCategory === 'string' ? selectedCategory : selectedCategory?.toString();
        return categoryId === selectedId;
      });
      
      if (category) {
        // Use titleMn for Mongolian, title for English
        return language === 'MN' ? (category.titleMn || category.title) : (category.title || category.titleMn);
      }
      return selectedCategory;
    }
    
    if (selectedBrand && selectedBrand !== 'all') {
      const brand = brands.find(b => {
        const brandId = typeof b._id === 'string' ? b._id : b._id?.toString();
        const selectedId = typeof selectedBrand === 'string' ? selectedBrand : selectedBrand?.toString();
        return brandId === selectedId;
      });
      
      if (brand) {
        return language === 'MN' ? (brand.titleMn || brand.title || brand.name) : (brand.title || brand.titleMn || brand.name);
      }
      return selectedBrand;
    }
    
    if (selectedCondition && selectedCondition !== 'all') {
      const conditionMap = {
        'new': language === 'MN' ? 'Шинэ' : 'New',
        'like-new': language === 'MN' ? 'Шинэ дүйтэй' : 'Like New',
        'used': language === 'MN' ? 'Хэрэглэсэн' : 'Used',
        'refurbished': language === 'MN' ? 'Сэргээгдсэн' : 'Refurbished'
      };
      return conditionMap[selectedCondition] || selectedCondition;
    }
    
    if (selectedStatus && selectedStatus !== 'all') {
      const statusMap = {
        'active': language === 'MN' ? 'Идэвхтэй' : 'Active',
        'ending-soon': language === 'MN' ? 'Удахгүй дуусах' : 'Ending Soon',
        'ending-today': language === 'MN' ? 'Өнөөдөр дуусна' : 'Ends Today'
      };
      return statusMap[selectedStatus] || selectedStatus;
    }
    
    // Check if price range is set
    if (priceRange.min || priceRange.max) {
      return language === 'MN' ? 'Үнийн хязгаар' : 'Price Range';
    }
    
    // Default: All products
    return language === 'MN' ? 'Бүх бараа' : 'All Products';
  };

  const handleBidChange = (productId, amount) => {
    const numericValue = parseFloat(amount) || 0;
    setBidAmounts(prev => ({
      ...prev,
      [productId]: numericValue
    }));
  };

  const placeBid = async (productId, currentPrice) => {
    const token = getAuthToken();
    
    if (!token) {
      navigate('/login');
      return;
    }
      
    if (bidAmounts[productId] <= currentPrice) {
      setBidErrors(prev => ({
        ...prev,
        [productId]: "Та илүү өндөр үнэ санал болгох ёстой."
      }));
      return;
    }
  
    try {
      const response = await axios.post(
        buildApiUrl('/api/bidding/'),
        {
          productId,
          price: bidAmounts[productId],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
  
      if (response.data.sold) {
        socket.emit('productSold', {
          productId,
          buyerId: response.data.buyerId,
          price: bidAmounts[productId]
        });
        toast.success(`Та энэ барааг ${bidAmounts[productId]}₮-р худалдан авлаа!`);
      } else {
        socket.emit('bidUpdate', response.data.product);
        toast.success("Амжилттай үнэ өглөө");
      }
  
      setProducts(prev =>
        prev.map(product =>
          product._id === productId
            ? { ...response.data.product, isUserOutbid: !response.data.isUserHighest }
            : product
        )
      );
  
      setFilteredProducts(prev =>
        prev.map(product =>
          product._id === productId
            ? { ...response.data.product, isUserOutbid: !response.data.isUserHighest }
            : product
        )
      );
  
      setBidAmounts(prev => ({ ...prev, [productId]: "" }));
    } catch (error) {
      console.error('Bidding error:', error);
      setBidErrors(prev => ({
        ...prev,
        [productId]: error.response?.data?.message || 'Үнийн санал өгөхөд алдаа гарлаа'
      }));
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <FaInfoCircle className="me-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-5">
      <div className="row">
        {showFilters && (
          <div className="col-12 d-md-none mb-4">
            <div className="card shadow-sm">
              <div className="card-header d-flex justify-content-between align-items-center bg-primary text-white">
                <h5 className="mb-0">Шүүлтүүр</h5>
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => setShowFilters(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="card-body">
                {/* Category Filter */}
                <div className="mb-4">
                  <h6 className="mb-3 fw-bold">Ангилал</h6>
                  <select
                    className="form-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">Бүх ангилал</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.titleMn || category.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                {brands.length > 0 && (
                  <div className="mb-4">
                    <h6 className="mb-3 fw-bold">Брэнд</h6>
                    <select
                      className="form-select"
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                    >
                      <option value="all">Бүх брэнд</option>
                      {brands.map(brand => (
                        <option key={brand._id} value={brand._id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Price Range Filter */}
                <div className="mb-4">
                  <h6 className="mb-3 fw-bold">Үнийн хязгаар</h6>
                  <div className="row g-2">
                    <div className="col-6">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Min ₮"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      />
                    </div>
                    <div className="col-6">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Max ₮"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Condition Filter */}
                <div className="mb-4">
                  <h6 className="mb-3 fw-bold">Байдал</h6>
                  <select
                    className="form-select"
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                  >
                    <option value="all">Бүгд</option>
                    <option value="new">Шинэ</option>
                    <option value="like-new">Шинэ дүйтэй</option>
                    <option value="used">Хэрэглэсэн</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="mb-4">
                  <h6 className="mb-3 fw-bold">Төлөв</h6>
                  <select
                    className="form-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">Бүгд</option>
                    <option value="active">Идэвхтэй (24ц+)</option>
                    <option value="ending-soon">Удахгүй дуусах (24ц)</option>
                    <option value="ending-today">Өнөөдөр дуусна (1ц)</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div className="mb-4">
                  <h6 className="mb-3 fw-bold">📊 Эрэмбэлэх</h6>
                  <select
                    className="form-select"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="newest">⭐ Шинээр нэмэгдсэн</option>
                    <option value="oldest">📅 Хуучин</option>
                    <option value="price-low">💸 Үнэ өсөхөөр</option>
                    <option value="price-high">💎 Үнэ буурахаар</option>
                    <option value="ending-soon">⏰ Дуусах хугацаа</option>
                  </select>
                </div>

                {/* Clear All Filters Button */}
                <button
                  className="btn btn-outline-danger w-100"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedBrand('all');
                    setPriceRange({ min: '', max: '' });
                    setSelectedCondition('all');
                    setSelectedStatus('all');
                    setSortOption('newest');
                    setShowFilters(false);
                  }}
                >
                  🔄 Бүх шүүлтүүр цэвэрлэх
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="col-md-3 d-none d-md-block">
          <div className="card mb-4 shadow-sm" style={{ backgroundColor: isDarkMode ? 'var(--color-card-bg)' : '#ffffff' }}>
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{t('filter')}</h5>
              <button
                className="btn btn-sm btn-light"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedCategories([]);
                  setSelectedBrand('all');
                  setSelectedBrands([]);
                  setPriceRange({ min: '', max: '' });
                  setSelectedCondition('all');
                  setSelectedStatus('all');
                  setSelectedColors([]);
                  setSelectedSizes([]);
                  setVerifiedSeller(false);
                  setHasDiscount(false);
                  setFreeShipping(false);
                  setVerifiedProduct(false);
                  setSortOption('newest');
                  setExpandedCategories(new Set());
                  setCollapsedSections({ condition: true, color: true, size: true });
                }}
              >
                {t('clear')}
              </button>
            </div>
            <div className="card-body">
              {/* Category Filter - Hierarchical with Subcategories */}
              <div className="mb-4">
                <h6 className="mb-3 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                  {t('category')}
                </h6>
                <div className="d-flex flex-column gap-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="category-all"
                      checked={selectedCategories.length === 0 && selectedCategory === 'all'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([]);
                          setSelectedCategory('all');
                          setExpandedCategories(new Set());
                        }
                      }}
                    />
                    <label className="form-check-label" htmlFor="category-all" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                      {t('allCategories')}
                    </label>
                  </div>
                  {categories.map(category => {
                    const categoryId = category._id.toString();
                    const isChecked = selectedCategories.includes(categoryId) || 
                      (selectedCategory === categoryId);
                    const isExpanded = expandedCategories.has(categoryId);
                    
                    // Find subcategories
                    const subcategories = allCategoriesWithChildren.filter(c => {
                      if (!c.parent) return false;
                      const parentId = typeof c.parent === 'object' && c.parent !== null
                        ? c.parent._id?.toString()
                        : c.parent?.toString();
                      return parentId === categoryId;
                    });
                    
                    return (
                      <div key={category._id}>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`category-${category._id}`}
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories(prev => [...prev, categoryId]);
                                setSelectedCategory(categoryId);
                                // Show subcategories when category is selected
                                if (subcategories.length > 0) {
                                  setExpandedCategories(prev => new Set([...prev, categoryId]));
                                }
                              } else {
                                setSelectedCategories(prev => prev.filter(id => id !== categoryId));
                                if (selectedCategory === categoryId) {
                                  setSelectedCategory('all');
                                }
                                // Hide subcategories when category is deselected
                                setExpandedCategories(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(categoryId);
                                  return newSet;
                                });
                              }
                            }}
                          />
                          <label className="form-check-label" htmlFor={`category-${category._id}`} style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                            {language === 'MN' ? (category.titleMn || category.title) : (category.title || category.titleMn)}
                          </label>
                        </div>
                        {/* Subcategories appear below parent when expanded */}
                        {isExpanded && subcategories.length > 0 && (
                          <div className="ms-4 mt-2">
                            {subcategories.map(subcategory => {
                              const subcategoryId = subcategory._id.toString();
                              const isSubChecked = selectedCategories.includes(subcategoryId);
                              return (
                                <div key={subcategory._id} className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`category-${subcategory._id}`}
                                    checked={isSubChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedCategories(prev => [...prev, subcategoryId]);
                                        setSelectedCategory(subcategoryId);
                                      } else {
                                        setSelectedCategories(prev => prev.filter(id => id !== subcategoryId));
                                        if (selectedCategory === subcategoryId) {
                                          setSelectedCategory('all');
                                        }
                                      }
                                    }}
                                  />
                                  <label className="form-check-label" htmlFor={`category-${subcategory._id}`} style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50', fontSize: '0.9rem' }}>
                                    {language === 'MN' ? (subcategory.titleMn || subcategory.title) : (subcategory.title || subcategory.titleMn)}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Brand Filter - Checkboxes */}
              {brands.length > 0 && (
                <div className="mb-4">
                  <h6 className="mb-3 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                    {t('brand')}
                  </h6>
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="brand-all"
                        checked={selectedBrands.length === 0 && selectedBrand === 'all'}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBrands([]);
                            setSelectedBrand('all');
                          }
                        }}
                      />
                      <label className="form-check-label" htmlFor="brand-all" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                        {t('allBrands')}
                      </label>
                    </div>
                    {brands.slice(0, 20).map(brand => {
                      const isChecked = selectedBrands.includes(brand._id.toString()) || 
                        (selectedBrand === brand._id.toString());
                      return (
                        <div key={brand._id} className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`brand-${brand._id}`}
                            checked={isChecked}
                            onChange={(e) => {
                              const brandId = brand._id.toString();
                              if (e.target.checked) {
                                setSelectedBrands(prev => [...prev, brandId]);
                                setSelectedBrand(brandId);
                              } else {
                                setSelectedBrands(prev => prev.filter(id => id !== brandId));
                                if (selectedBrand === brandId) {
                                  setSelectedBrand('all');
                                }
                              }
                            }}
                          />
                          <label className="form-check-label" htmlFor={`brand-${brand._id}`} style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                            {brand.name}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price Range Filter */}
              <div className="mb-4">
                <h6 className="mb-3 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                  {t('priceRange')}
                </h6>
                <div className="row g-2">
                  <div className="col-6">
                    <input
                      type="number"
                      className="form-control"
                      placeholder={t('minPrice') + ' ₮'}
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                    />
                  </div>
                  <div className="col-6">
                    <input
                      type="number"
                      className="form-control"
                      placeholder={t('maxPrice') + ' ₮'}
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                    />
                  </div>
                </div>
              </div>

              {/* Condition Filter - Collapsible with Dropdown */}
              <div className="mb-4">
                <div 
                  className="d-flex justify-content-between align-items-center mb-2" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setCollapsedSections(prev => ({ ...prev, condition: !prev.condition }))}
                >
                  <h6 className="mb-0 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                    {t('condition')}
                  </h6>
                  <i className={`bi ${collapsedSections.condition ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
                </div>
                {!collapsedSections.condition && (
                  <select
                    className="form-select"
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                    style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                  >
                    <option value="all">{t('all')}</option>
                    <option value="new">{t('new')}</option>
                    <option value="like-new">{t('likeNew')}</option>
                    <option value="used">{t('used')}</option>
                    <option value="refurbished">{t('refurbished')}</option>
                  </select>
                )}
              </div>

              {/* Status Filter - Checkboxes */}
              <div className="mb-4">
                <h6 className="mb-3 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                  {t('status')}
                </h6>
                <div className="d-flex flex-column gap-2">
                  {['all', 'active', 'ending-soon', 'ending-today'].map(status => (
                    <div key={status} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`status-${status}`}
                        checked={selectedStatus === status}
                        onChange={() => {
                          if (selectedStatus === status) {
                            setSelectedStatus('all');
                          } else {
                            setSelectedStatus(status);
                          }
                        }}
                      />
                      <label className="form-check-label" htmlFor={`status-${status}`} style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                        {t(status === 'all' ? 'all' : status === 'ending-soon' ? 'endingSoon' : status === 'ending-today' ? 'endingToday' : status)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Filter - Collapsible with Dropdown */}
              <div className="mb-4">
                <div 
                  className="d-flex justify-content-between align-items-center mb-2" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setCollapsedSections(prev => ({ ...prev, color: !prev.color }))}
                >
                  <h6 className="mb-0 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                    {t('color')}
                  </h6>
                  <i className={`bi ${collapsedSections.color ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
                </div>
                {!collapsedSections.color && (
                  <select
                    className="form-select"
                    value={selectedColors[0] || 'all'}
                    onChange={(e) => {
                      if (e.target.value === 'all') {
                        setSelectedColors([]);
                      } else {
                        setSelectedColors([e.target.value]);
                      }
                    }}
                    style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                  >
                    <option value="all">{t('all')}</option>
                    {['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Silver', 'Gray', 'Brown', 'Other'].map(color => (
                      <option key={color.toLowerCase()} value={color.toLowerCase()}>{color}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Size Filter - Collapsible with Dropdown */}
              <div className="mb-4">
                <div 
                  className="d-flex justify-content-between align-items-center mb-2" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setCollapsedSections(prev => ({ ...prev, size: !prev.size }))}
                >
                  <h6 className="mb-0 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                    {t('size')}
                  </h6>
                  <i className={`bi ${collapsedSections.size ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
                </div>
                {!collapsedSections.size && (
                  <select
                    className="form-select"
                    value={selectedSizes[0] || 'all'}
                    onChange={(e) => {
                      if (e.target.value === 'all') {
                        setSelectedSizes([]);
                      } else {
                        setSelectedSizes([e.target.value]);
                      }
                    }}
                    style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                  >
                    <option value="all">{t('all')}</option>
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Small', 'Medium', 'Large', 'Other'].map(size => (
                      <option key={size.toLowerCase()} value={size.toLowerCase()}>{size}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Seller Filter */}
              <div className="mb-4">
                <h6 className="mb-3 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                  {t('seller')}
                </h6>
                <div className="d-flex flex-column gap-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="seller-verified"
                      checked={verifiedSeller}
                      onChange={(e) => setVerifiedSeller(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="seller-verified" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                      {t('verifiedSeller')}
                    </label>
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="mb-4">
                <h6 className="mb-3 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                  {t('discount')}
                </h6>
                <div className="d-flex flex-column gap-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="discount-has"
                      checked={hasDiscount}
                      onChange={(e) => setHasDiscount(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="discount-has" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                      {t('hasDiscount')}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="shipping-free"
                      checked={freeShipping}
                      onChange={(e) => setFreeShipping(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="shipping-free" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                      {t('freeShipping')}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="product-verified"
                      checked={verifiedProduct}
                      onChange={(e) => setVerifiedProduct(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="product-verified" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                      {t('verifiedProduct')}
                    </label>
                  </div>
                </div>
              </div>

              {/* Sort Options */}
              <div className="mb-3">
                <h6 className="mb-3 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                  {t('sortBy')}
                </h6>
                <select
                  className="form-select"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                >
                  <option value="newest">{t('newlyAdded')}</option>
                  <option value="oldest">{t('oldest')}</option>
                  <option value="price-low">{t('priceLow')}</option>
                  <option value="price-high">{t('priceHigh')}</option>
                  <option value="ending-soon">{t('endingSoonSort')}</option>
                </select>
              </div>

              {/* Clear All Filters Button */}
              <button
                className="btn btn-outline-danger w-100"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedBrand('all');
                  setPriceRange({ min: '', max: '' });
                  setSelectedCondition('all');
                  setSelectedStatus('all');
                  setSortOption('newest');
                }}
              >
                Бүх шүүлтүүр цэвэрлэх
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-9">
          <div className="mb-4 d-flex justify-content-between align-items-center">
            <h4 className="m-0">
              {getCurrentFilterName()}
              <span className="badge bg-primary ms-2">{filteredProducts.length}</span>
            </h4>
            
            <div className="d-flex">
              <div className="btn-group" role="group">
                <button 
                  type="button" 
                  className={`btn btn-outline-primary ${sortOption === 'newest' ? 'active' : ''}`}
                  onClick={() => setSortOption('newest')}
                >
                  Шинэ
                </button>
                <button 
                  type="button" 
                  className={`btn btn-outline-primary ${sortOption === 'price-low' ? 'active' : ''}`}
                  onClick={() => setSortOption('price-low')}
                >
                  Үнэ ↑
                </button>
                <button 
                  type="button" 
                  className={`btn btn-outline-primary ${sortOption === 'price-high' ? 'active' : ''}`}
                  onClick={() => setSortOption('price-high')}
                >
                  Үнэ ↓
                </button>
                <button 
                  type="button" 
                  className={`btn btn-outline-primary ${sortOption === 'ending-soon' ? 'active' : ''}`}
                  onClick={() => setSortOption('ending-soon')}
                >
                  Дуусах
                </button>
              </div>
            </div>
          </div>

          {currentProducts.length > 0 ? (
            <div className="row g-4">
              {currentProducts.map((product, index) => (
                <motion.div 
                  key={product._id}
                  className="col-md-6 col-lg-4"
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="card h-100 shadow-sm border-0 overflow-hidden">
                    <div className="position-relative">
                      <img 
                        src={product.images?.find(img => img.isPrimary)?.url || '/default.png'}
                        className="card-img-top" 
                        alt={product.title}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      {product.sold && (
                        <div className="position-absolute top-50 start-50 translate-middle bg-danger text-white px-3 py-1 rounded-pill">
                          Зарагдсан
                        </div>
                      )}
                    </div>
                    
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{product.title}</h5>
                      <p className="card-text text-muted text-truncate">{product.description}</p>
                      
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <small className="text-muted">Дуусах хугацаа:</small>
                            <CountdownTimer 
                              deadline={product.bidDeadline} 
                              className="fw-bold"
                            />
                          </div>
                          <span className="badge bg-primary">
                            {typeof product.category === 'object' 
                              ? product.category.title 
                              : categories.find(c => c._id === product.category)?.title || ''}
                          </span>
                        </div>
                        
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <small className="text-muted">Одоогийн үнэ:</small>
                            <h5 className="m-0 text-primary">₮{product.currentBid || product.price}</h5>
                          </div>
                          <div className="text-end">
                          </div>
                        </div>
                        
                        {bidErrors[product._id] && (
                          <div className="alert alert-danger mt-2 mb-2 p-2 small">
                            {bidErrors[product._id]}
                          </div>
                        )}
                        
                        {!product.sold && (
                          <>
                            <div className="input-group mb-2">
                              <span className="input-group-text bg-light">₮</span>
                              <input
                                type="number"
                                className="form-control"
                                value={bidAmounts[product._id] || ''}
                                onChange={(e) => handleBidChange(product._id, e.target.value)}
                                min={(product.currentBid || product.price) + 1}
                                step="10"
                                placeholder={`${(product.currentBid || product.price) + 1000}`}
                              />
                            </div>
                            
                            <button 
                              className={`btn w-100 mb-2 ${product.isUserOutbid 
                                ? 'btn-danger' 
                                : 'btn-warning'} shadow-sm`}
                              onClick={() => placeBid(product._id, product.currentBid || product.price)}
                            >
                              <FaGavel className="me-2" />
                              {product.isUserOutbid ? 'Таны санал хүчингүй' : 'Үнийн санал өгөх'}
                            </button>
                          </>
                        )}
                        
                        <Link 
                          to={`/products/${product._id}`} 
                          className="btn btn-outline-primary w-100"
                        >
                          <FaInfoCircle className="me-2" />
                          Дэлгэрэнгүй
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-body text-center py-5">
                  <FaSearch className="display-4 text-muted mb-3" />
                  <h4>Бараа олдсонгүй</h4>
                  <p className="text-muted">Таны хайлттай тохирох бараа олдсонгүй</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                  >
                    Бүх барааг үзэх
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Pagination */}
          {filteredProducts.length > productsPerPage && (
            <div className="d-flex justify-content-center mt-5">
              <nav aria-label="Page navigation">
                <ul className="pagination shadow-sm">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &laquo;
                    </button>
                  </li>
                  
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + index;
                    } else {
                      pageNumber = currentPage - 2 + index;
                    }

                    return (
                      <li 
                        key={index} 
                        className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}
                      >
                        <button 
                          className="page-link" 
                          onClick={() => paginate(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    );
                  })}
                  
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Product;