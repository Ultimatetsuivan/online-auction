import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const FilterSidebar = ({
  filters = {},
  onFiltersChange,
  categories = [],
  brands = [],
  showAutomotiveFilters = false
}) => {
  const { t, language } = useLanguage();
  const { isDarkMode } = useTheme();

  // Track which sections are expanded
  const [openSections, setOpenSections] = useState({
    category: true,  // Open by default
    brand: false,
    price: true,     // Open by default
    condition: false,
    status: false,
    color: false,
    size: false,
    seller: false,
    discount: false,
    automotive: showAutomotiveFilters // Open if in automotive category
  });

  // Toggle section open/close
  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle filter change
  const handleChange = (name, value) => {
    if (onFiltersChange) {
      onFiltersChange(name, value);
    }
  };

  // Handle checkbox toggle (for multi-select)
  const handleCheckboxToggle = (name, value) => {
    const currentValues = filters[name] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    handleChange(name, newValues);
  };

  // Clear all filters
  const handleClearAll = () => {
    if (onFiltersChange) {
      onFiltersChange('clearAll', true);
    }
    // Collapse all sections except first few
    setOpenSections({
      category: true,
      brand: false,
      price: true,
      condition: false,
      status: false,
      color: false,
      size: false,
      seller: false,
      discount: false,
      automotive: showAutomotiveFilters
    });
  };

  // Common styles
  const sectionHeaderStyle = {
    backgroundColor: isDarkMode ? 'var(--color-card-bg)' : '#ffffff',
    border: 'none',
    borderBottom: `1px solid ${isDarkMode ? 'var(--color-border)' : '#e5e7eb'}`,
    padding: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    color: isDarkMode ? 'var(--color-text)' : '#2c3e50'
  };

  const sectionContentStyle = {
    backgroundColor: isDarkMode ? 'var(--color-surface)' : '#f9fafb',
    borderBottom: `1px solid ${isDarkMode ? 'var(--color-border)' : '#e5e7eb'}`,
    padding: '1rem'
  };

  return (
    <div className="filter-sidebar" style={{
      backgroundColor: isDarkMode ? 'var(--color-card-bg)' : '#ffffff',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center px-3 py-3"
        style={{
          backgroundColor: '#0d6efd',
          color: 'white'
        }}>
        <h6 className="mb-0 fw-bold">
          <i className="bi bi-funnel me-2"></i>
          {t('filter') || 'Шүүлтүүр'}
        </h6>
        <button
          className="btn btn-sm btn-light"
          onClick={handleClearAll}
          style={{ fontSize: '0.75rem' }}
        >
          {t('clear') || 'Цэвэрлэх'}
        </button>
      </div>

      {/* Filter Sections */}
      <div className="filter-sections">

        {/* Category Section */}
        <div className="filter-section">
          <div
            style={sectionHeaderStyle}
            onClick={() => toggleSection('category')}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-hover)' : '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-card-bg)' : '#ffffff'}
          >
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                {t('category') || 'Ангилал'}
              </span>
              <i className={`bi bi-chevron-${openSections.category ? 'up' : 'down'}`}></i>
            </div>
          </div>
          {openSections.category && (
            <div style={sectionContentStyle}>
              <div className="d-flex flex-column gap-2">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="category-all"
                    checked={!filters.selectedCategories || filters.selectedCategories.length === 0}
                    onChange={() => handleChange('selectedCategories', [])}
                  />
                  <label className="form-check-label small" htmlFor="category-all" style={{ color: isDarkMode ? 'var(--color-text)' : '#374151' }}>
                    {t('allCategories') || 'Бүх ангилал'}
                  </label>
                </div>
                {categories.slice(0, 10).map(category => (
                  <div key={category._id} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`category-${category._id}`}
                      checked={filters.selectedCategories?.includes(category._id.toString())}
                      onChange={() => handleCheckboxToggle('selectedCategories', category._id.toString())}
                    />
                    <label className="form-check-label small" htmlFor={`category-${category._id}`} style={{ color: isDarkMode ? 'var(--color-text)' : '#374151' }}>
                      {language === 'MN' ? (category.titleMn || category.title) : (category.title || category.titleMn)}
                    </label>
                  </div>
                ))}
                {categories.length > 10 && (
                  <button className="btn btn-link btn-sm p-0 text-start text-primary" style={{ fontSize: '0.8rem' }}>
                    + {categories.length - 10} {t('more')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Brand Section */}
        <div className="filter-section">
          <div
            style={sectionHeaderStyle}
            onClick={() => toggleSection('brand')}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-hover)' : '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-card-bg)' : '#ffffff'}
          >
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                {t('brand') || 'Брэнд'}
              </span>
              <i className={`bi bi-chevron-${openSections.brand ? 'up' : 'down'}`}></i>
            </div>
          </div>
          {openSections.brand && (
            <div style={sectionContentStyle}>
              <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="brand-all"
                    checked={!filters.selectedBrands || filters.selectedBrands.length === 0}
                    onChange={() => handleChange('selectedBrands', [])}
                  />
                  <label className="form-check-label small" htmlFor="brand-all" style={{ color: isDarkMode ? 'var(--color-text)' : '#374151' }}>
                    {t('allBrands') || 'Бүх брэнд'}
                  </label>
                </div>
                {brands.slice(0, 20).map(brand => (
                  <div key={brand._id} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`brand-${brand._id}`}
                      checked={filters.selectedBrands?.includes(brand._id.toString())}
                      onChange={() => handleCheckboxToggle('selectedBrands', brand._id.toString())}
                    />
                    <label className="form-check-label small" htmlFor={`brand-${brand._id}`} style={{ color: isDarkMode ? 'var(--color-text)' : '#374151' }}>
                      {brand.name || brand.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Price Range Section */}
        <div className="filter-section">
          <div
            style={sectionHeaderStyle}
            onClick={() => toggleSection('price')}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-hover)' : '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-card-bg)' : '#ffffff'}
          >
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                {t('priceRange') || 'Үнийн хязгаар'}
              </span>
              <i className={`bi bi-chevron-${openSections.price ? 'up' : 'down'}`}></i>
            </div>
          </div>
          {openSections.price && (
            <div style={sectionContentStyle}>
              <div className="d-flex flex-column gap-2">
                <div>
                  <label className="form-label small mb-1" style={{ fontSize: '0.75rem', color: isDarkMode ? 'var(--color-text-secondary)' : '#6b7280' }}>
                    {t('minPrice') || 'Хамгийн бага'} (₮)
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="0"
                    value={filters.priceMin || ''}
                    onChange={(e) => handleChange('priceMin', e.target.value)}
                    style={{
                      backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff',
                      color: isDarkMode ? 'var(--color-text)' : '#2c3e50',
                      border: `1px solid ${isDarkMode ? 'var(--color-border)' : '#d1d5db'}`
                    }}
                  />
                </div>
                <div>
                  <label className="form-label small mb-1" style={{ fontSize: '0.75rem', color: isDarkMode ? 'var(--color-text-secondary)' : '#6b7280' }}>
                    {t('maxPrice') || 'Хамгийн их'} (₮)
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="999,999,999"
                    value={filters.priceMax || ''}
                    onChange={(e) => handleChange('priceMax', e.target.value)}
                    style={{
                      backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff',
                      color: isDarkMode ? 'var(--color-text)' : '#2c3e50',
                      border: `1px solid ${isDarkMode ? 'var(--color-border)' : '#d1d5db'}`
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Condition Section */}
        <div className="filter-section">
          <div
            style={sectionHeaderStyle}
            onClick={() => toggleSection('condition')}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-hover)' : '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-card-bg)' : '#ffffff'}
          >
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                {t('condition') || 'Байдал'}
              </span>
              <i className={`bi bi-chevron-${openSections.condition ? 'up' : 'down'}`}></i>
            </div>
          </div>
          {openSections.condition && (
            <div style={sectionContentStyle}>
              <div className="d-flex flex-column gap-2">
                {['all', 'new', 'like-new', 'used', 'refurbished'].map(condition => (
                  <div key={condition} className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="condition"
                      id={`condition-${condition}`}
                      checked={filters.condition === condition || (!filters.condition && condition === 'all')}
                      onChange={() => handleChange('condition', condition === 'all' ? '' : condition)}
                    />
                    <label className="form-check-label small" htmlFor={`condition-${condition}`} style={{ color: isDarkMode ? 'var(--color-text)' : '#374151' }}>
                      {condition === 'all' ? (t('all') || 'Бүгд') :
                       condition === 'new' ? (t('new') || 'Шинэ') :
                       condition === 'like-new' ? (t('likeNew') || 'Шинэ дүйтэй') :
                       condition === 'used' ? (t('used') || 'Хэрэглэсэн') :
                       (t('refurbished') || 'Сэргээгдсэн')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status Section */}
        <div className="filter-section">
          <div
            style={sectionHeaderStyle}
            onClick={() => toggleSection('status')}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-hover)' : '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-card-bg)' : '#ffffff'}
          >
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                {t('status') || 'Төлөв'}
              </span>
              <i className={`bi bi-chevron-${openSections.status ? 'up' : 'down'}`}></i>
            </div>
          </div>
          {openSections.status && (
            <div style={sectionContentStyle}>
              <div className="d-flex flex-column gap-2">
                {['all', 'active', 'ending-soon', 'ending-today'].map(status => (
                  <div key={status} className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="status"
                      id={`status-${status}`}
                      checked={filters.status === status || (!filters.status && status === 'all')}
                      onChange={() => handleChange('status', status === 'all' ? '' : status)}
                    />
                    <label className="form-check-label small" htmlFor={`status-${status}`} style={{ color: isDarkMode ? 'var(--color-text)' : '#374151' }}>
                      {status === 'all' ? (t('all') || 'Бүгд') :
                       status === 'active' ? (t('active') || 'Идэвхтэй (24ц+)') :
                       status === 'ending-soon' ? (t('endingSoon') || 'Удахгүй дуусах (24ц)') :
                       (t('endingToday') || 'Өнөөдөр дуусна (1ц)')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Color Section */}
        <div className="filter-section">
          <div
            style={sectionHeaderStyle}
            onClick={() => toggleSection('color')}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-hover)' : '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-card-bg)' : '#ffffff'}
          >
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                {t('color') || 'Өнгө'}
              </span>
              <i className={`bi bi-chevron-${openSections.color ? 'up' : 'down'}`}></i>
            </div>
          </div>
          {openSections.color && (
            <div style={sectionContentStyle}>
              <div className="d-flex flex-column gap-2">
                {['black', 'white', 'red', 'blue', 'green', 'yellow', 'silver', 'gray'].map(color => (
                  <div key={color} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`color-${color}`}
                      checked={filters.selectedColors?.includes(color)}
                      onChange={() => handleCheckboxToggle('selectedColors', color)}
                    />
                    <label className="form-check-label small d-flex align-items-center" htmlFor={`color-${color}`} style={{ color: isDarkMode ? 'var(--color-text)' : '#374151' }}>
                      <span
                        className="d-inline-block me-2"
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: color,
                          border: '1px solid #ccc',
                          borderRadius: '3px'
                        }}
                      ></span>
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Size Section */}
        <div className="filter-section">
          <div
            style={sectionHeaderStyle}
            onClick={() => toggleSection('size')}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-hover)' : '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-card-bg)' : '#ffffff'}
          >
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                {t('size') || 'Хэмжээ'}
              </span>
              <i className={`bi bi-chevron-${openSections.size ? 'up' : 'down'}`}></i>
            </div>
          </div>
          {openSections.size && (
            <div style={sectionContentStyle}>
              <div className="d-flex flex-column gap-2">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                  <div key={size} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`size-${size}`}
                      checked={filters.selectedSizes?.includes(size.toLowerCase())}
                      onChange={() => handleCheckboxToggle('selectedSizes', size.toLowerCase())}
                    />
                    <label className="form-check-label small" htmlFor={`size-${size}`} style={{ color: isDarkMode ? 'var(--color-text)' : '#374151' }}>
                      {size}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Seller Section */}
        <div className="filter-section">
          <div
            style={sectionHeaderStyle}
            onClick={() => toggleSection('seller')}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-hover)' : '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-card-bg)' : '#ffffff'}
          >
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                {t('seller') || 'Борлуулагч'}
              </span>
              <i className={`bi bi-chevron-${openSections.seller ? 'up' : 'down'}`}></i>
            </div>
          </div>
          {openSections.seller && (
            <div style={sectionContentStyle}>
              <div className="d-flex flex-column gap-2">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="seller-verified"
                    checked={filters.verifiedSeller || false}
                    onChange={(e) => handleChange('verifiedSeller', e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="seller-verified" style={{ color: isDarkMode ? 'var(--color-text)' : '#374151' }}>
                    <i className="bi bi-patch-check-fill text-primary me-1"></i>
                    {t('verifiedSeller') || 'Баталгаажсан борлуулагч'}
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Discount Section */}
        <div className="filter-section">
          <div
            style={sectionHeaderStyle}
            onClick={() => toggleSection('discount')}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-hover)' : '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--color-card-bg)' : '#ffffff'}
          >
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                {t('discount') || 'Хөнгөлөлт'}
              </span>
              <i className={`bi bi-chevron-${openSections.discount ? 'up' : 'down'}`}></i>
            </div>
          </div>
          {openSections.discount && (
            <div style={sectionContentStyle}>
              <div className="d-flex flex-column gap-2">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="discount-has"
                    checked={filters.hasDiscount || false}
                    onChange={(e) => handleChange('hasDiscount', e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="discount-has" style={{ color: isDarkMode ? 'var(--color-text)' : '#374151' }}>
                    {t('hasDiscount') || 'Хөнгөлөлттэй'}
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="shipping-free"
                    checked={filters.freeShipping || false}
                    onChange={(e) => handleChange('freeShipping', e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="shipping-free" style={{ color: isDarkMode ? 'var(--color-text)' : '#374151' }}>
                    {t('freeShipping') || 'Үнэгүй хүргэлт'}
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="product-verified"
                    checked={filters.verifiedProduct || false}
                    onChange={(e) => handleChange('verifiedProduct', e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="product-verified" style={{ color: isDarkMode ? 'var(--color-text)' : '#374151' }}>
                    <i className="bi bi-patch-check-fill text-success me-1"></i>
                    {t('verifiedProduct') || 'Баталгаажсан бараа'}
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Automotive Filters - Only show when showAutomotiveFilters is true */}
        {showAutomotiveFilters && (
          <div className="filter-section" style={{ borderTop: '3px solid #FF6A00' }}>
            <div
              style={{ ...sectionHeaderStyle, backgroundColor: '#fff5f0' }}
              onClick={() => toggleSection('automotive')}
            >
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold" style={{ fontSize: '0.9rem', color: '#FF6A00' }}>
                  <i className="bi bi-car-front me-2"></i>
                  Автомашины шүүлтүүр
                </span>
                <i className={`bi bi-chevron-${openSections.automotive ? 'up' : 'down'}`} style={{ color: '#FF6A00' }}></i>
              </div>
            </div>
            {openSections.automotive && (
              <div style={{ ...sectionContentStyle, backgroundColor: '#fffbf7' }}>
                <div className="d-flex flex-column gap-3">
                  {/* Manufacturer */}
                  <div>
                    <label className="form-label small mb-1" style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                      Үйлдвэр
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filters.automotiveManufacturer || ''}
                      onChange={(e) => handleChange('automotiveManufacturer', e.target.value)}
                    >
                      <option value="">Бүгд</option>
                      <option value="Toyota">Toyota</option>
                      <option value="Honda">Honda</option>
                      <option value="Nissan">Nissan</option>
                      <option value="Mazda">Mazda</option>
                      <option value="Hyundai">Hyundai</option>
                      <option value="BMW">BMW</option>
                      <option value="Mercedes-Benz">Mercedes-Benz</option>
                    </select>
                  </div>

                  {/* Model */}
                  <div>
                    <label className="form-label small mb-1" style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                      Загвар
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Жишээ: Camry, Prius"
                      value={filters.automotiveModel || ''}
                      onChange={(e) => handleChange('automotiveModel', e.target.value)}
                    />
                  </div>

                  {/* Engine Type */}
                  <div>
                    <label className="form-label small mb-1" style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                      Хөдөлгүүр
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filters.engineType || ''}
                      onChange={(e) => handleChange('engineType', e.target.value)}
                    >
                      <option value="">Бүгд</option>
                      <option value="gasoline">Бензин</option>
                      <option value="diesel">Дизель</option>
                      <option value="hybrid">Хайбрид</option>
                      <option value="electric">Цахилгаан</option>
                    </select>
                  </div>

                  {/* Year Range */}
                  <div>
                    <label className="form-label small mb-1" style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                      Үйлдвэрлэсэн он
                    </label>
                    <div className="row g-2">
                      <div className="col-6">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Доод"
                          value={filters.yearFrom || ''}
                          onChange={(e) => handleChange('yearFrom', e.target.value)}
                        />
                      </div>
                      <div className="col-6">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Дээд"
                          value={filters.yearTo || ''}
                          onChange={(e) => handleChange('yearTo', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gearbox */}
                  <div>
                    <label className="form-label small mb-1" style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                      Хурдны хайрцаг
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filters.gearbox || ''}
                      onChange={(e) => handleChange('gearbox', e.target.value)}
                    >
                      <option value="">Бүгд</option>
                      <option value="automatic">Автомат</option>
                      <option value="manual">Механик</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default FilterSidebar;
