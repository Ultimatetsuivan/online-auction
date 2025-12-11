import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { io } from 'socket.io-client';
import { CountdownTimer } from '../../components/Timer';
import { FaSearch, FaTimes, FaGavel, FaInfoCircle, FaHistory, FaUserCog } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { apiConfig, buildApiUrl } from '../../config/api';
import { useToast } from '../../components/common/Toast';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { SavedFilters } from '../../components/SavedFilters';
import { LikeButton } from '../../components/LikeButton';
import { ProductImage } from '../../components/ProductImage';

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
    size: true,
    automotive: false // Automotive filters expanded by default
  });
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Unable to parse stored user', error);
      return null;
    }
  });
  const [historyModal, setHistoryModal] = useState({
    isOpen: false,
    isLoading: false,
    product: null,
    bids: [],
    error: null
  });

  // Automotive-specific filters
  const [automotiveFilters, setAutomotiveFilters] = useState({
    manufacturer: '',
    model: '',
    engineType: '',
    engineCcMin: '',
    engineCcMax: '',
    bodyType: '',
    gearbox: '',
    steering: '',
    driveType: '',
    mileageMin: '',
    mileageMax: '',
    yearFrom: '',
    yearTo: '',
    importYearFrom: '',
    importYearTo: '',
    leasing: '',
    vehicleColor: ''
  });

  const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token || localStorage.getItem('token');
  };

  const getProductOwnerId = (product) => {
    if (!product) return null;
    if (typeof product.user === 'string') return product.user;
    return product.user?._id || product.user?.id || null;
  };

  const isProductOwner = (product) => {
    if (!product || !currentUser) return false;
    const ownerId = getProductOwnerId(product);
    const userId = currentUser._id || currentUser.id;
    return ownerId && userId && ownerId === userId;
  };

  const handleOwnerManageShortcut = (product) => {
    if (!product) return;
    localStorage.setItem('pendingProductManage', product._id);
    navigate(`/profile?tab=myProducts&highlight=${product._id}`);
  };

  const openBidHistory = async (product) => {
    if (!product?._id) return;
    setHistoryModal({
      isOpen: true,
      isLoading: true,
      product,
      bids: [],
      error: null
    });

    try {
      const response = await axios.get(buildApiUrl(`/api/bidding/${product._id}`));
      setHistoryModal(prev => ({
        ...prev,
        isLoading: false,
        bids: response.data?.history || []
      }));
    } catch (err) {
      console.error('Failed to load bid history', err);
      setHistoryModal(prev => ({
        ...prev,
        isLoading: false,
        error: err.response?.data?.message || 'Failed to load bid history'
      }));
    }
  };

  const closeBidHistory = () => {
    setHistoryModal({
      isOpen: false,
      isLoading: false,
      product: null,
      bids: [],
      error: null
    });
  };

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('user');
        setCurrentUser(stored ? JSON.parse(stored) : null);
      } catch (error) {
        console.error('User storage parse failed', error);
        setCurrentUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Check if current category is automotive
  const isAutomotiveCategory = () => {
    if (!selectedCategory || selectedCategory === 'all') return false;

    // Check selected categories array
    for (const catId of selectedCategories) {
      const category = allCategoriesWithChildren.find(c => c._id.toString() === catId.toString());
      if (category) {
        const title = (category.titleMn || category.title || '').toLowerCase();
        if (title.includes('тээврийн хэрэгсэл') || title.includes('automotive') || title.includes('машин')) {
          return true;
        }
      }
    }

    // Check single selected category
    const category = allCategoriesWithChildren.find(c => {
      const categoryId = typeof c._id === 'string' ? c._id : c._id?.toString();
      const selectedId = typeof selectedCategory === 'string' ? selectedCategory : selectedCategory?.toString();
      return categoryId === selectedId;
    });

    if (category) {
      const title = (category.titleMn || category.title || '').toLowerCase();
      return title.includes('тээврийн хэрэгсэл') || title.includes('automotive') || title.includes('машин');
    }

    return false;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Handler for loading saved filters
  const handleLoadFilter = (loadedFilters) => {
    console.log('Loading filters:', loadedFilters);
    // Update individual states from loaded filters
    if (loadedFilters.selectedCategories && Array.isArray(loadedFilters.selectedCategories)) {
      setSelectedCategories(loadedFilters.selectedCategories);
      if (loadedFilters.selectedCategories.length > 0) {
        setSelectedCategory(loadedFilters.selectedCategories[0]);
      }
    }
    if (loadedFilters.selectedBrands && Array.isArray(loadedFilters.selectedBrands)) {
      setSelectedBrands(loadedFilters.selectedBrands);
    }
    if (loadedFilters.priceMin || loadedFilters.priceMax) {
      setPriceRange({
        min: loadedFilters.priceMin || '',
        max: loadedFilters.priceMax || ''
      });
    }
    if (loadedFilters.condition) {
      setSelectedCondition(loadedFilters.condition);
    }
    if (loadedFilters.status) {
      setSelectedStatus(loadedFilters.status);
    }
    if (loadedFilters.selectedColors) {
      setSelectedColors(loadedFilters.selectedColors);
    }
    if (loadedFilters.selectedSizes) {
      setSelectedSizes(loadedFilters.selectedSizes);
    }
    if (loadedFilters.verifiedSeller !== undefined) {
      setVerifiedSeller(loadedFilters.verifiedSeller);
    }
    if (loadedFilters.hasDiscount !== undefined) {
      setHasDiscount(loadedFilters.hasDiscount);
    }
    if (loadedFilters.freeShipping !== undefined) {
      setFreeShipping(loadedFilters.freeShipping);
    }
    if (loadedFilters.verifiedProduct !== undefined) {
      setVerifiedProduct(loadedFilters.verifiedProduct);
    }

    // Update automotive filters
    setAutomotiveFilters({
      manufacturer: loadedFilters.automotiveManufacturer || '',
      model: loadedFilters.automotiveModel || '',
      engineType: loadedFilters.engineType || '',
      engineCcMin: loadedFilters.engineCcMin || '',
      engineCcMax: loadedFilters.engineCcMax || '',
      bodyType: loadedFilters.bodyType || '',
      gearbox: loadedFilters.gearbox || '',
      steering: loadedFilters.steering || '',
      driveType: loadedFilters.driveType || '',
      mileageMin: loadedFilters.mileageMin || '',
      mileageMax: loadedFilters.mileageMax || '',
      yearFrom: loadedFilters.yearFrom || '',
      yearTo: loadedFilters.yearTo || '',
      importYearFrom: loadedFilters.importYearFrom || '',
      importYearTo: loadedFilters.importYearTo || '',
      leasing: loadedFilters.leasing || '',
      vehicleColor: loadedFilters.vehicleColor || ''
    });

    toast.success(t('filterLoaded') || 'Шүүлтүүр ачааллагдлаа!');
  };

  // Create unified filters object for SavedFilters component
  const currentFilters = {
    selectedCategories,
    selectedBrands,
    priceMin: priceRange.min,
    priceMax: priceRange.max,
    condition: selectedCondition,
    status: selectedStatus,
    selectedColors,
    selectedSizes,
    verifiedSeller,
    hasDiscount,
    freeShipping,
    verifiedProduct,
    automotiveManufacturer: automotiveFilters.manufacturer,
    automotiveModel: automotiveFilters.model,
    engineType: automotiveFilters.engineType,
    engineCcMin: automotiveFilters.engineCcMin,
    engineCcMax: automotiveFilters.engineCcMax,
    bodyType: automotiveFilters.bodyType,
    gearbox: automotiveFilters.gearbox,
    steering: automotiveFilters.steering,
    driveType: automotiveFilters.driveType,
    mileageMin: automotiveFilters.mileageMin,
    mileageMax: automotiveFilters.mileageMax,
    yearFrom: automotiveFilters.yearFrom,
    yearTo: automotiveFilters.yearTo,
    importYearFrom: automotiveFilters.importYearFrom,
    importYearTo: automotiveFilters.importYearTo,
    leasing: automotiveFilters.leasing,
    vehicleColor: automotiveFilters.vehicleColor
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

    // Search filter - word by word matching
    if (searchQuery) {
      const searchWords = searchQuery.toLowerCase().trim().split(/\s+/);
      result = result.filter(product => {
        const titleLower = (product.title || '').toLowerCase();
        const descLower = (product.description || '').toLowerCase();
        const combinedText = `${titleLower} ${descLower}`;

        // Check if ALL search words are present in title or description
        return searchWords.every(word => combinedText.includes(word));
      });
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

    // Automotive filters - only apply if in automotive category
    if (isAutomotiveCategory()) {
      // Make/Manufacturer filter
      if (automotiveFilters.manufacturer) {
        result = result.filter(product =>
          product.make?.toLowerCase() === automotiveFilters.manufacturer.toLowerCase()
        );
      }

      // Model filter
      if (automotiveFilters.model) {
        result = result.filter(product =>
          product.model?.toLowerCase().includes(automotiveFilters.model.toLowerCase())
        );
      }

      // Fuel Type filter (was engineType)
      if (automotiveFilters.engineType) {
        result = result.filter(product =>
          product.fuelType?.toLowerCase() === automotiveFilters.engineType.toLowerCase()
        );
      }

      // Transmission filter (was gearbox)
      if (automotiveFilters.gearbox) {
        result = result.filter(product =>
          product.transmission?.toLowerCase() === automotiveFilters.gearbox.toLowerCase()
        );
      }

      // Mileage filter
      if (automotiveFilters.mileageMin) {
        const minMileage = parseFloat(automotiveFilters.mileageMin);
        result = result.filter(product => (product.mileage || 0) >= minMileage);
      }
      if (automotiveFilters.mileageMax) {
        const maxMileage = parseFloat(automotiveFilters.mileageMax);
        result = result.filter(product => (product.mileage || 0) <= maxMileage);
      }

      // Manufacture year filter
      if (automotiveFilters.yearFrom) {
        const minYear = parseInt(automotiveFilters.yearFrom);
        result = result.filter(product => (product.manufactureYear || 0) >= minYear);
      }
      if (automotiveFilters.yearTo) {
        const maxYear = parseInt(automotiveFilters.yearTo);
        result = result.filter(product => (product.manufactureYear || 0) <= maxYear);
      }

      // Import year filter
      if (automotiveFilters.importYearFrom) {
        const minImportYear = parseInt(automotiveFilters.importYearFrom);
        result = result.filter(product => (product.importYear || 0) >= minImportYear);
      }
      if (automotiveFilters.importYearTo) {
        const maxImportYear = parseInt(automotiveFilters.importYearTo);
        result = result.filter(product => (product.importYear || 0) <= maxImportYear);
      }

      // Leasing filter
      if (automotiveFilters.leasing) {
        if (automotiveFilters.leasing === 'with') {
          result = result.filter(product => product.hasLeasing === true);
        } else if (automotiveFilters.leasing === 'without') {
          result = result.filter(product => product.hasLeasing !== true);
        }
      }

      // Vehicle color filter
      if (automotiveFilters.vehicleColor) {
        result = result.filter(product =>
          product.vehicleColor?.toLowerCase() === automotiveFilters.vehicleColor.toLowerCase()
        );
      }
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
  }, [sortOption, products, searchQuery, selectedCategory, selectedCategories, selectedBrand, selectedBrands, priceRange, selectedCondition, selectedStatus, selectedColors, selectedSizes, verifiedSeller, verifiedProduct, automotiveFilters]);

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
      // Use allCategoriesWithChildren instead of categories to include subcategories
      const category = allCategoriesWithChildren.find(c => {
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
                    setAutomotiveFilters({
                      manufacturer: '',
                      model: '',
                      engineType: '',
                      engineCcMin: '',
                      engineCcMax: '',
                      bodyType: '',
                      gearbox: '',
                      steering: '',
                      driveType: '',
                      mileageMin: '',
                      mileageMax: '',
                      yearFrom: '',
                      yearTo: '',
                      importYearFrom: '',
                      importYearTo: '',
                      leasing: '',
                      vehicleColor: ''
                    });
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
                  setCollapsedSections({ condition: true, color: true, size: true, automotive: false });
                  setAutomotiveFilters({
                    manufacturer: '',
                    model: '',
                    engineType: '',
                    engineCcMin: '',
                    engineCcMax: '',
                    bodyType: '',
                    gearbox: '',
                    steering: '',
                    driveType: '',
                    mileageMin: '',
                    mileageMax: '',
                    yearFrom: '',
                    yearTo: '',
                    importYearFrom: '',
                    importYearTo: '',
                    leasing: '',
                    vehicleColor: ''
                  });
                }}
              >
                {t('clear')}
              </button>
            </div>
            <div className="card-body">
              {/* Automotive Filters - Only show for automotive category - SHOWN FIRST */}
              {isAutomotiveCategory() && (
                <div className="mb-4" style={{ borderTop: '2px solid #FF6A00', borderBottom: '2px solid #FF6A00', paddingTop: '1rem', paddingBottom: '1rem', backgroundColor: isDarkMode ? 'rgba(255, 106, 0, 0.05)' : 'rgba(255, 106, 0, 0.05)' }}>
                  <div
                    className="d-flex justify-content-between align-items-center mb-3"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setCollapsedSections(prev => ({ ...prev, automotive: !prev.automotive }))}
                  >
                    <h6 className="mb-0 fw-bold" style={{ color: '#FF6A00' }}>
                      <i className="bi bi-car-front me-2"></i>
                      🚗 Автомашины шүүлтүүр
                    </h6>
                    <i className={`bi ${collapsedSections.automotive ? 'bi-chevron-down' : 'bi-chevron-up'}`} style={{ color: '#FF6A00' }}></i>
                  </div>
                  {!collapsedSections.automotive && (
                    <div className="d-flex flex-column gap-3">
                      {/* Manufacturer / Brand */}
                      <div>
                        <label className="form-label small mb-1 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                          Үйлдвэр
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={automotiveFilters.manufacturer}
                          onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, manufacturer: e.target.value }))}
                          style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                        >
                          <option value="">Бүгд</option>
                          <option value="Toyota">Toyota</option>
                          <option value="Honda">Honda</option>
                          <option value="Nissan">Nissan</option>
                          <option value="Mazda">Mazda</option>
                          <option value="Mitsubishi">Mitsubishi</option>
                          <option value="Hyundai">Hyundai</option>
                          <option value="Kia">Kia</option>
                          <option value="Ford">Ford</option>
                          <option value="Chevrolet">Chevrolet</option>
                          <option value="Lexus">Lexus</option>
                          <option value="BMW">BMW</option>
                          <option value="Mercedes-Benz">Mercedes-Benz</option>
                          <option value="Audi">Audi</option>
                          <option value="Volkswagen">Volkswagen</option>
                          <option value="Other">Бусад</option>
                        </select>
                      </div>

                      {/* Model */}
                      <div>
                        <label className="form-label small mb-1 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                          Загвар
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Жишээ: Camry, Civic, Prius"
                          value={automotiveFilters.model}
                          onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, model: e.target.value }))}
                          style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                        />
                      </div>

                      {/* Engine Type */}
                      <div>
                        <label className="form-label small mb-1 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                          Хөдөлгүүр
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={automotiveFilters.engineType}
                          onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, engineType: e.target.value }))}
                          style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                        >
                          <option value="">Бүгд</option>
                          <option value="gasoline">Бензин</option>
                          <option value="diesel">Дизель</option>
                          <option value="hybrid">Хайбрид</option>
                          <option value="electric">Цахилгаан</option>
                        </select>
                      </div>

                      {/* Engine Capacity (cc) */}
                      <div>
                        <label className="form-label small mb-1 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                          Мотор багтаамж (cc)
                        </label>
                        <div className="row g-2">
                          <div className="col-6">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="Доод"
                              value={automotiveFilters.engineCcMin}
                              onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, engineCcMin: e.target.value }))}
                              style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                            />
                          </div>
                          <div className="col-6">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="Дээд"
                              value={automotiveFilters.engineCcMax}
                              onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, engineCcMax: e.target.value }))}
                              style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Body Type */}
                      <div>
                        <label className="form-label small mb-1 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                          Төрөл
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={automotiveFilters.bodyType}
                          onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, bodyType: e.target.value }))}
                          style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                        >
                          <option value="">Бүгд</option>
                          <option value="sedan">Седан</option>
                          <option value="suv">SUV / Жип</option>
                          <option value="hatchback">Хэтчбэк</option>
                          <option value="van">Вэн</option>
                          <option value="truck">Ачааны</option>
                          <option value="coupe">Купе</option>
                          <option value="wagon">Вагон</option>
                          <option value="pickup">Пикап</option>
                        </select>
                      </div>

                      {/* Gearbox */}
                      <div>
                        <label className="form-label small mb-1 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                          Хурдны хайрцаг
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={automotiveFilters.gearbox}
                          onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, gearbox: e.target.value }))}
                          style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                        >
                          <option value="">Бүгд</option>
                          <option value="automatic">Автомат</option>
                          <option value="manual">Механик</option>
                        </select>
                      </div>

                      {/* Steering */}
                      <div>
                        <label className="form-label small mb-1 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                          Хүрд
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={automotiveFilters.steering}
                          onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, steering: e.target.value }))}
                          style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                        >
                          <option value="">Бүгд</option>
                          <option value="left">Зүүн</option>
                          <option value="right">Баруун</option>
                        </select>
                      </div>

                      {/* Drive Type */}
                      <div>
                        <label className="form-label small mb-1 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                          Хөтлөгч
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={automotiveFilters.driveType}
                          onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, driveType: e.target.value }))}
                          style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                        >
                          <option value="">Бүгд</option>
                          <option value="fwd">Урд (FWD)</option>
                          <option value="rwd">Хойд (RWD)</option>
                          <option value="4wd">4x4 / AWD</option>
                        </select>
                      </div>

                      {/* Mileage */}
                      <div>
                        <label className="form-label small mb-1 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                          Явсан (км)
                        </label>
                        <div className="row g-2">
                          <div className="col-6">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="Доод"
                              value={automotiveFilters.mileageMin}
                              onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, mileageMin: e.target.value }))}
                              style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                            />
                          </div>
                          <div className="col-6">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="Дээд"
                              value={automotiveFilters.mileageMax}
                              onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, mileageMax: e.target.value }))}
                              style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Manufacture Year */}
                      <div>
                        <label className="form-label small mb-1 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                          Үйлдвэрлэсэн он
                        </label>
                        <div className="row g-2">
                          <div className="col-6">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="Доод"
                              value={automotiveFilters.yearFrom}
                              onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, yearFrom: e.target.value }))}
                              style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                            />
                          </div>
                          <div className="col-6">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="Дээд"
                              value={automotiveFilters.yearTo}
                              onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, yearTo: e.target.value }))}
                              style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Import Year */}
                      <div>
                        <label className="form-label small mb-1 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                          Орж ирсэн он
                        </label>
                        <div className="row g-2">
                          <div className="col-6">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="Доод"
                              value={automotiveFilters.importYearFrom}
                              onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, importYearFrom: e.target.value }))}
                              style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                            />
                          </div>
                          <div className="col-6">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="Дээд"
                              value={automotiveFilters.importYearTo}
                              onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, importYearTo: e.target.value }))}
                              style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Leasing */}
                      <div>
                        <label className="form-label small mb-1 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                          Лизинг
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={automotiveFilters.leasing}
                          onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, leasing: e.target.value }))}
                          style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                        >
                          <option value="">Бүгд</option>
                          <option value="with">Лизинг бүхий</option>
                          <option value="without">Лизингүй</option>
                        </select>
                      </div>

                      {/* Vehicle Color */}
                      <div>
                        <label className="form-label small mb-1 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                          Өнгө
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={automotiveFilters.vehicleColor}
                          onChange={(e) => setAutomotiveFilters(prev => ({ ...prev, vehicleColor: e.target.value }))}
                          style={{ backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff', color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}
                        >
                          <option value="">Бүгд</option>
                          <option value="white">Цагаан</option>
                          <option value="black">Хар</option>
                          <option value="silver">Мөнгөлөг</option>
                          <option value="gray">Саарал</option>
                          <option value="red">Улаан</option>
                          <option value="blue">Цэнхэр</option>
                          <option value="green">Ногоон</option>
                          <option value="yellow">Шар</option>
                          <option value="brown">Хүрэн</option>
                          <option value="other">Бусад</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                  setCollapsedSections({ condition: true, color: true, size: true, automotive: false });
                  setAutomotiveFilters({
                    manufacturer: '',
                    model: '',
                    engineType: '',
                    engineCcMin: '',
                    engineCcMax: '',
                    bodyType: '',
                    gearbox: '',
                    steering: '',
                    driveType: '',
                    mileageMin: '',
                    mileageMax: '',
                    yearFrom: '',
                    yearTo: '',
                    importYearFrom: '',
                    importYearTo: '',
                    leasing: '',
                    vehicleColor: ''
                  });
                }}
              >
                Бүх шүүлтүүр цэвэрлэх
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-9">
          <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <h4 className="m-0">
              {getCurrentFilterName()}
              <span className="badge bg-primary ms-2">{filteredProducts.length}</span>
            </h4>

            <div className="d-flex gap-2 align-items-center">
              {/* Saved Filters Component */}
              <SavedFilters
                currentFilters={currentFilters}
                onLoadFilter={handleLoadFilter}
              />

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
              {currentProducts.map((product, index) => {
                const ownerFlag = isProductOwner(product);
                const bidCount = product.bidCount || product.totalBids || product.biddingCount || product.bidders?.length || product.bidHistory?.length || 0;
                const basePrice = product.currentBid ?? product.price ?? 0;
                const numericBasePrice = typeof basePrice === 'number' ? basePrice : Number(basePrice) || 0;
                const formattedCurrentPrice = numericBasePrice.toLocaleString();
                let categoryTitle = '';

                if (product.category) {
                  if (typeof product.category === 'object') {
                    categoryTitle = product.category.titleMn || product.category.title || '';
                  } else {
                    const targetId = typeof product.category === 'string' ? product.category : product.category?.toString();
                    const matchedCategory = categories.find(cat => {
                      const catId = typeof cat._id === 'string' ? cat._id : cat._id?.toString();
                      return catId === targetId;
                    });
                    categoryTitle = matchedCategory ? (matchedCategory.titleMn || matchedCategory.title || '') : '';
                  }
                }

                return (
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
                      {/* Like Button */}
                      <div className="position-absolute" style={{ top: '0.5rem', right: '0.5rem', zIndex: 10 }}>
                        <LikeButton product={product} size="md" />
                      </div>

                      <ProductImage
                        product={product}
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
                        
                        {ownerFlag && (
                          <div
                            className="bg-light rounded p-2 mb-3"
                            style={{ border: '1px dashed rgba(0,0,0,0.15)' }}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center text-primary text-uppercase small fw-semibold">
                                <FaUserCog className="me-2" />
                                {t('myProducts')}
                              </div>
                              <span className="badge bg-white text-primary border">{bidCount} bids</span>
                            </div>
                            <div className="d-flex gap-2 mt-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary flex-grow-1"
                                onClick={() => handleOwnerManageShortcut(product)}
                              >
                                {t('settings')}
                              </button>
                            </div>
                          </div>
                        )}
                        

                        <div className="mt-auto">
                        <div className="d-flex flex-wrap align-items-start gap-2 mb-2">
                          <div className="flex-grow-1" style={{ minWidth: '220px' }}>
                            <small className="text-muted">Дуусах хугацаа:</small>
                            <CountdownTimer 
                              deadline={product.bidDeadline} 
                              variant="emphasized"
                              showProgress
                            />
                          </div>
                          {categoryTitle && (
                            <span className="badge bg-primary align-self-start text-wrap">
                              {categoryTitle}
                            </span>
                          )}
                        </div>
                        
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <small className="text-muted">Одоогийн үнэ:</small>
                            <h5 className="m-0 text-primary">₮{formattedCurrentPrice}</h5>
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
                                min={numericBasePrice + 1}
                                step="10"
                                placeholder={`${numericBasePrice + 1000}`}
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

                        <button
                          type="button"
                          className="btn btn-outline-secondary w-100 mb-2"
                          onClick={() => openBidHistory(product)}
                        >
                          <FaHistory className="me-2" />
                          Bid history
                        </button>
                        
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
                );
              })}
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
      {historyModal.isOpen && (
        <>
          <div 
            className="bid-history-backdrop" 
            onClick={closeBidHistory}
          ></div>
          <div className="bid-history-modal shadow-lg">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-1">
                  <FaHistory className="me-2" />
                  {historyModal.product?.title || 'Bid history'}
                </h5>
                <small className="text-muted">
                  {historyModal.bids.length} entries
                </small>
              </div>
              <button type="button" className="btn-close" aria-label="Close" onClick={closeBidHistory}></button>
            </div>
            <div className="bid-history-modal__body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {historyModal.isLoading && (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              {!historyModal.isLoading && historyModal.error && (
                <div className="alert alert-danger">{historyModal.error}</div>
              )}
              {!historyModal.isLoading && !historyModal.error && (
                historyModal.bids.length > 0 ? (
                  <div className="bid-history-timeline">
                    {historyModal.bids.map((bid) => (
                      <div key={bid?._id || bid?.createdAt} className="bid-history-row">
                        <div className="fw-bold text-primary">�,r{bid?.price?.toLocaleString() || 'N/A'}</div>
                        <div className="text-muted small">{bid?.user?.name || 'Anonymous'}</div>
                        <div className="text-end small">
                          {bid?.createdAt ? new Date(bid.createdAt).toLocaleString() : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-4">No bidding history yet.</p>
                )
              )}
            </div>
            <div className="text-end">
              <button className="btn btn-secondary" onClick={closeBidHistory}>
                Close
              </button>
            </div>
          </div>
          <style>
            {`
              .bid-history-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.55);
                backdrop-filter: blur(2px);
                z-index: 1050;
              }
              .bid-history-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: min(600px, 90vw);
                background: #fff;
                border-radius: 1rem;
                padding: 1.5rem;
                z-index: 1060;
              }
              .bid-history-row {
                display: grid;
                grid-template-columns: 1fr 1fr auto;
                gap: 0.75rem;
                padding: 0.75rem 0;
                border-bottom: 1px solid rgba(0,0,0,0.08);
              }
              .bid-history-row:last-child {
                border-bottom: none;
              }
            `}
          </style>
        </>
      )}
    </div>
  );
};

export default Product;

