import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const SavedFilters = ({ currentFilters, onLoadFilter }) => {
  const { t, language } = useLanguage();
  const { isDarkMode } = useTheme();
  const [savedFilters, setSavedFilters] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [showSavedList, setShowSavedList] = useState(false);

  // Get user-specific localStorage key
  const getUserFiltersKey = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return `savedFilters_${user._id || user.id}`;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    return 'savedFilters'; // fallback to old key if no user
  };

  // Load saved filters from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(getUserFiltersKey());
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }, []);

  // Save current filter with a name
  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      alert('Шүүлтүүрийн нэр оруулна уу');
      return;
    }

    const newFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: currentFilters,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem(getUserFiltersKey(), JSON.stringify(updated));

    setFilterName('');
    setShowModal(false);
    alert('Шүүлтүүр амжилттай хадгалагдлаа!');
  };

  // Load a saved filter
  const handleLoadFilter = (filter) => {
    if (onLoadFilter) {
      onLoadFilter(filter.filters);
    }
    setShowSavedList(false);
  };

  // Delete a saved filter
  const handleDeleteFilter = (id) => {
    if (window.confirm('Энэ шүүлтүүрийг устгах уу?')) {
      const updated = savedFilters.filter(f => f.id !== id);
      setSavedFilters(updated);
      localStorage.setItem(getUserFiltersKey(), JSON.stringify(updated));
    }
  };

  // Get active filter count
  const getActiveFilterCount = (filters) => {
    let count = 0;
    if (filters.selectedCategories?.length > 0) count++;
    if (filters.selectedBrands?.length > 0) count++;
    if (filters.priceMin || filters.priceMax) count++;
    if (filters.condition) count++;
    if (filters.status) count++;
    if (filters.selectedColors?.length > 0) count++;
    if (filters.selectedSizes?.length > 0) count++;
    if (filters.verifiedSeller) count++;
    if (filters.hasDiscount) count++;
    return count;
  };

  const activeCount = getActiveFilterCount(currentFilters);

  return (
    <>
      {/* Save Filter Button */}
      <div className="d-flex gap-2 align-items-center">
        <button
          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
          onClick={() => setShowModal(true)}
          disabled={activeCount === 0}
          style={{
            borderRadius: '20px',
            padding: '0.4rem 1rem',
            fontSize: '0.85rem'
          }}
        >
          <i className="bi bi-bookmark"></i>
          {t('saveFilter') || 'Шүүлтүүр хадгалах'}
          {activeCount > 0 && (
            <span className="badge bg-primary rounded-pill">{activeCount}</span>
          )}
        </button>

        {savedFilters.length > 0 && (
          <div className="position-relative">
            <button
              className="btn btn-sm btn-primary d-flex align-items-center gap-2"
              onClick={() => setShowSavedList(!showSavedList)}
              style={{
                borderRadius: '20px',
                padding: '0.4rem 1rem',
                fontSize: '0.85rem'
              }}
            >
              <i className="bi bi-bookmarks"></i>
              {t('savedFilters') || 'Хадгалсан шүүлтүүр'}
              <span className="badge bg-light text-primary rounded-pill">{savedFilters.length}</span>
            </button>

            {/* Dropdown List of Saved Filters */}
            {showSavedList && (
              <div
                className="position-absolute top-100 end-0 mt-2 shadow-lg border"
                style={{
                  backgroundColor: isDarkMode ? 'var(--color-card-bg)' : '#ffffff',
                  borderRadius: '8px',
                  minWidth: '320px',
                  maxWidth: '400px',
                  zIndex: 1000,
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}
              >
                <div className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0 fw-bold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                      <i className="bi bi-bookmarks me-2"></i>
                      {t('savedFilters') || 'Хадгалсан шүүлтүүр'}
                    </h6>
                    <button
                      className="btn btn-sm btn-link text-muted p-0"
                      onClick={() => setShowSavedList(false)}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>

                  {savedFilters.map((filter) => (
                    <div
                      key={filter.id}
                      className="border rounded p-3 mb-2"
                      style={{
                        backgroundColor: isDarkMode ? 'var(--color-surface)' : '#f9fafb',
                        borderColor: isDarkMode ? 'var(--color-border)' : '#e5e7eb'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-1 fw-semibold" style={{ color: isDarkMode ? 'var(--color-text)' : '#2c3e50' }}>
                            {filter.name}
                          </h6>
                          <p className="text-muted small mb-0">
                            <i className="bi bi-funnel me-1"></i>
                            {getActiveFilterCount(filter.filters)} {t('filtersActive') || 'шүүлтүүр идэвхтэй'}
                          </p>
                          <p className="text-muted small mb-0">
                            <i className="bi bi-clock me-1"></i>
                            {new Date(filter.createdAt).toLocaleDateString(language === 'MN' ? 'mn-MN' : 'en-US')}
                          </p>
                        </div>
                        <button
                          className="btn btn-sm btn-link text-danger p-0"
                          onClick={() => handleDeleteFilter(filter.id)}
                          title="Устгах"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>

                      <button
                          className="btn btn-sm btn-primary w-100"
                        onClick={() => handleLoadFilter(filter)}
                      >
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        {t('applyFilter') || 'Ашиглах'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Filter Modal */}
      {showModal && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1040 }}
            onClick={() => setShowModal(false)}
          ></div>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ zIndex: 1050 }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div
                className="modal-content"
                style={{
                  backgroundColor: isDarkMode ? 'var(--color-card-bg)' : '#ffffff',
                  color: isDarkMode ? 'var(--color-text)' : '#2c3e50'
                }}
              >
                <div className="modal-header border-bottom" style={{ borderColor: isDarkMode ? 'var(--color-border)' : '#dee2e6' }}>
                  <h5 className="modal-title">
                    <i className="bi bi-bookmark-plus me-2"></i>
                    {t('saveFilter') || 'Шүүлтүүр хадгалах'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                    style={{ filter: isDarkMode ? 'invert(1)' : 'none' }}
                  ></button>
                </div>
                <div className="modal-body">
                  <p className="text-muted small mb-3">
                    <i className="bi bi-info-circle me-1"></i>
                    {activeCount} {t('filtersActive') || 'шүүлтүүр идэвхтэй байна'}
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      {t('filterName') || 'Шүүлтүүрийн нэр'}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Жишээ: Toyota машинууд, 2020-2023"
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSaveFilter();
                      }}
                      autoFocus
                      style={{
                        backgroundColor: isDarkMode ? 'var(--color-surface)' : '#ffffff',
                        color: isDarkMode ? 'var(--color-text)' : '#2c3e50',
                        borderColor: isDarkMode ? 'var(--color-border)' : '#ced4da'
                      }}
                    />
                  </div>

                  {/* Preview of active filters */}
                  <div className="border rounded p-3" style={{
                    backgroundColor: isDarkMode ? 'var(--color-surface)' : '#f9fafb',
                    borderColor: isDarkMode ? 'var(--color-border)' : '#e5e7eb'
                  }}>
                    <p className="small fw-semibold mb-2">{t('activeFilters') || 'Идэвхтэй шүүлтүүрүүд'}:</p>
                    <div className="d-flex flex-wrap gap-1">
                      {currentFilters.selectedCategories?.length > 0 && (
                        <span className="badge bg-primary">{currentFilters.selectedCategories.length} ангилал</span>
                      )}
                      {currentFilters.selectedBrands?.length > 0 && (
                        <span className="badge bg-info">{currentFilters.selectedBrands.length} брэнд</span>
                      )}
                      {(currentFilters.priceMin || currentFilters.priceMax) && (
                        <span className="badge bg-success">Үнийн хязгаар</span>
                      )}
                      {currentFilters.condition && (
                        <span className="badge bg-warning text-dark">Байдал: {currentFilters.condition}</span>
                      )}
                      {currentFilters.selectedColors?.length > 0 && (
                        <span className="badge bg-secondary">{currentFilters.selectedColors.length} өнгө</span>
                      )}
                      {currentFilters.verifiedSeller && (
                        <span className="badge bg-dark">Баталгаажсан борлуулагч</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top" style={{ borderColor: isDarkMode ? 'var(--color-border)' : '#dee2e6' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    {t('cancel') || 'Болих'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveFilter}
                    disabled={!filterName.trim()}
                  >
                    <i className="bi bi-check-lg me-1"></i>
                    {t('save') || 'Хадгалах'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Click outside to close saved list */}
      {showSavedList && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowSavedList(false)}
        />
      )}
    </>
  );
};

export default SavedFilters;
