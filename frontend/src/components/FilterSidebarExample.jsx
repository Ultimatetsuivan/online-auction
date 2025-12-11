// ============================================
// COMPLETE WORKING EXAMPLE
// How to use FilterSidebar in your product.jsx
// ============================================

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FilterSidebar } from '../components/FilterSidebar';
import { buildApiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const ProductWithNewFilter = () => {
  const { t, language } = useLanguage();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Data states
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allCategoriesWithChildren, setAllCategoriesWithChildren] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(6);

  // ==========================================
  // UNIFIED FILTERS STATE (replaces all individual states)
  // ==========================================
  const [filters, setFilters] = useState({
    // Category & Brand
    selectedCategories: [],
    selectedBrands: [],

    // Price
    priceMin: '',
    priceMax: '',

    // Condition & Status
    condition: '',
    status: '',

    // Color & Size
    selectedColors: [],
    selectedSizes: [],

    // Seller & Discount
    verifiedSeller: false,
    hasDiscount: false,
    freeShipping: false,
    verifiedProduct: false,

    // Automotive (will only be used when automotive category is selected)
    automotiveManufacturer: '',
    automotiveModel: '',
    engineType: '',
    yearFrom: '',
    yearTo: '',
    gearbox: '',
    bodyType: '',
    mileageMin: '',
    mileageMax: ''
  });

  // Keep old state variables for backward compatibility with existing filtering logic
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [verifiedSeller, setVerifiedSeller] = useState(false);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);
  const [verifiedProduct, setVerifiedProduct] = useState(false);

  // ==========================================
  // CHECK IF AUTOMOTIVE CATEGORY
  // ==========================================
  const isAutomotiveCategory = () => {
    if (filters.selectedCategories.length === 0) return false;

    for (const catId of filters.selectedCategories) {
      const category = allCategoriesWithChildren.find(c => c._id.toString() === catId.toString());
      if (category) {
        const title = (category.titleMn || category.title || '').toLowerCase();
        if (title.includes('тээврийн хэрэгсэл') || title.includes('automotive') || title.includes('машин')) {
          return true;
        }
      }
    }
    return false;
  };

  // ==========================================
  // FILTER CHANGE HANDLER
  // ==========================================
  const handleFiltersChange = (name, value) => {
    // Handle clear all
    if (name === 'clearAll') {
      const emptyFilters = {
        selectedCategories: [],
        selectedBrands: [],
        priceMin: '',
        priceMax: '',
        condition: '',
        status: '',
        selectedColors: [],
        selectedSizes: [],
        verifiedSeller: false,
        hasDiscount: false,
        freeShipping: false,
        verifiedProduct: false,
        automotiveManufacturer: '',
        automotiveModel: '',
        engineType: '',
        yearFrom: '',
        yearTo: '',
        gearbox: '',
        bodyType: '',
        mileageMin: '',
        mileageMax: ''
      };
      setFilters(emptyFilters);

      // Reset old state variables
      setSelectedCategories([]);
      setSelectedCategory('all');
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
      return;
    }

    // Update unified filters state
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));

    // Sync with old state variables for backward compatibility
    switch (name) {
      case 'selectedCategories':
        setSelectedCategories(value);
        if (value.length > 0) {
          setSelectedCategory(value[0]);
        } else {
          setSelectedCategory('all');
        }
        break;
      case 'selectedBrands':
        setSelectedBrands(value);
        break;
      case 'priceMin':
        setPriceRange(prev => ({ ...prev, min: value }));
        break;
      case 'priceMax':
        setPriceRange(prev => ({ ...prev, max: value }));
        break;
      case 'condition':
        setSelectedCondition(value || 'all');
        break;
      case 'status':
        setSelectedStatus(value || 'all');
        break;
      case 'selectedColors':
        setSelectedColors(value);
        break;
      case 'selectedSizes':
        setSelectedSizes(value);
        break;
      case 'verifiedSeller':
        setVerifiedSeller(value);
        break;
      case 'hasDiscount':
        setHasDiscount(value);
        break;
      case 'freeShipping':
        setFreeShipping(value);
        break;
      case 'verifiedProduct':
        setVerifiedProduct(value);
        break;
      default:
        break;
    }
  };

  // ==========================================
  // FETCH DATA
  // ==========================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, categoriesResponse, brandsResponse] = await Promise.all([
          axios.get(buildApiUrl('/api/product/products')),
          axios.get(buildApiUrl('/api/category/')),
          axios.get(buildApiUrl('/api/brand/')).catch(() => ({ data: [] }))
        ]);

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

        // Parent categories for main list
        const parentCategories = categories.filter(c => {
          if (!c.parent) return true;
          if (typeof c.parent === 'object' && (c.parent === null || !c.parent._id)) return true;
          return false;
        });
        setCategories(parentCategories);
        setAllCategoriesWithChildren(categories);
        setBrands(brands);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ==========================================
  // FILTERING LOGIC (keep your existing logic)
  // ==========================================
  useEffect(() => {
    if (!Array.isArray(products)) {
      setFilteredProducts([]);
      return;
    }

    let result = [...products];

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter(product => {
        const productCategoryId = typeof product.category === 'object' && product.category !== null
          ? product.category._id?.toString()
          : product.category?.toString();
        return selectedCategories.some(catId => catId.toString() === productCategoryId);
      });
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      result = result.filter(product => {
        const productBrandId = typeof product.brand === 'object' && product.brand !== null
          ? product.brand._id?.toString()
          : product.brand?.toString();
        return selectedBrands.some(brandId => brandId.toString() === productBrandId);
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

    // Verified filters
    if (verifiedSeller) {
      result = result.filter(product => product.user?.verified === true);
    }
    if (verifiedProduct) {
      result = result.filter(product => product.verified === true);
    }

    // Automotive filters
    if (isAutomotiveCategory()) {
      if (filters.automotiveManufacturer) {
        result = result.filter(product =>
          product.manufacturer?.toLowerCase() === filters.automotiveManufacturer.toLowerCase()
        );
      }
      if (filters.automotiveModel) {
        result = result.filter(product =>
          product.model?.toLowerCase().includes(filters.automotiveModel.toLowerCase())
        );
      }
      if (filters.engineType) {
        result = result.filter(product =>
          product.engineType?.toLowerCase() === filters.engineType.toLowerCase()
        );
      }
      if (filters.gearbox) {
        result = result.filter(product =>
          product.gearbox?.toLowerCase() === filters.gearbox.toLowerCase()
        );
      }
      if (filters.yearFrom) {
        const minYear = parseInt(filters.yearFrom);
        result = result.filter(product => (product.manufactureYear || 0) >= minYear);
      }
      if (filters.yearTo) {
        const maxYear = parseInt(filters.yearTo);
        result = result.filter(product => (product.manufactureYear || 0) <= maxYear);
      }
    }

    // Sorting
    switch (sortOption) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'price-low':
        result.sort((a, b) => (a.currentBid || a.price) - (b.currentBid || b.price));
        break;
      case 'price-high':
        result.sort((a, b) => (b.currentBid || b.price) - (a.currentBid || a.price));
        break;
      default:
        break;
    }

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [
    products,
    selectedCategories,
    selectedBrands,
    priceRange,
    selectedCondition,
    selectedStatus,
    selectedColors,
    selectedSizes,
    verifiedSeller,
    verifiedProduct,
    filters.automotiveManufacturer,
    filters.automotiveModel,
    filters.engineType,
    filters.gearbox,
    filters.yearFrom,
    filters.yearTo,
    sortOption
  ]);

  // ==========================================
  // RENDER
  // ==========================================
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <div className="container-fluid px-4 py-5">
      <div className="row">

        {/* ========================================== */}
        {/* DESKTOP SIDEBAR - Using FilterSidebar Component */}
        {/* ========================================== */}
        <div className="col-md-3 d-none d-md-block">
          <FilterSidebar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={categories}
            brands={brands}
            showAutomotiveFilters={isAutomotiveCategory()}
          />
        </div>

        {/* ========================================== */}
        {/* PRODUCTS GRID */}
        {/* ========================================== */}
        <div className="col-md-9">
          {/* Header */}
          <div className="mb-4 d-flex justify-content-between align-items-center">
            <h4 className="m-0">
              {t('allProducts') || 'Бүх бараа'}
              <span className="badge bg-primary ms-2">{filteredProducts.length}</span>
            </h4>

            {/* Sort buttons */}
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn btn-sm btn-outline-primary ${sortOption === 'newest' ? 'active' : ''}`}
                onClick={() => setSortOption('newest')}
              >
                Шинэ
              </button>
              <button
                type="button"
                className={`btn btn-sm btn-outline-primary ${sortOption === 'price-low' ? 'active' : ''}`}
                onClick={() => setSortOption('price-low')}
              >
                Үнэ ↑
              </button>
              <button
                type="button"
                className={`btn btn-sm btn-outline-primary ${sortOption === 'price-high' ? 'active' : ''}`}
                onClick={() => setSortOption('price-high')}
              >
                Үнэ ↓
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {currentProducts.length > 0 ? (
            <div className="row g-4">
              {currentProducts.map((product) => (
                <div key={product._id} className="col-md-6 col-lg-4">
                  <div className="card h-100 shadow-sm border-0">
                    <img
                      src={product.images?.find(img => img.isPrimary)?.url || '/default.png'}
                      className="card-img-top"
                      alt={product.title}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <div className="card-body">
                      <h5 className="card-title">{product.title}</h5>
                      <p className="card-text text-muted">{product.description?.substring(0, 100)}...</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="h5 text-primary mb-0">₮{product.currentBid || product.price}</span>
                        <Link to={`/products/${product._id}`} className="btn btn-sm btn-primary">
                          Дэлгэрэнгүй
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-info text-center">
              <h5>Бараа олдсонгүй</h5>
              <p>Таны хайлттай тохирох бараа олдсонгүй</p>
            </div>
          )}

          {/* Pagination */}
          {filteredProducts.length > productsPerPage && (
            <div className="d-flex justify-content-center mt-5">
              <nav>
                <ul className="pagination">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(index + 1)}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductWithNewFilter;
