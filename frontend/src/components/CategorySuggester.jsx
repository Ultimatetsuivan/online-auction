import React, { useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';

export const CategorySuggester = ({ title, description, currentCategory, onCategorySelect }) => {
  const { t } = useLanguage();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get AI suggestions
  const getSuggestions = async () => {
    if (!title || title.trim().length < 3) {
      setError('Please enter a product title first (at least 3 characters)');
      return;
    }

    setLoading(true);
    setError('');
    setShowSuggestions(false);

    try {
      const response = await axios.post(buildApiUrl('/api/product/suggest-category'), {
        title,
        description: description || '',
        useAI: false // Set to true if you have OPENAI_API_KEY configured
      });

      if (response.data.success) {
        setSuggestions(response.data.data.suggestions);
        setShowSuggestions(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get category suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Handle category selection
  const handleSelectCategory = (category) => {
    onCategorySelect(category);
    setShowSuggestions(false);
  };

  return (
    <div className="category-suggester mb-3">
      <div className="d-flex align-items-center gap-2 mb-2">
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={getSuggestions}
          disabled={loading || !title}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Analyzing...
            </>
          ) : (
            <>
              <i className="bi bi-magic me-2"></i>
              Auto-Suggest Category
            </>
          )}
        </button>

        <small className="text-muted">
          AI will analyze your title and description to suggest the best category
        </small>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-warning alert-dismissible fade show py-2" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="card border-primary shadow-sm">
          <div className="card-header bg-primary bg-opacity-10 border-primary">
            <h6 className="mb-0">
              <i className="bi bi-stars me-2 text-primary"></i>
              Suggested Categories
            </h6>
          </div>
          <div className="card-body p-3">
            <div className="row g-2">
              {suggestions.map((suggestion, index) => (
                <div key={suggestion.category} className="col-md-4">
                  <div
                    className={`suggestion-card p-3 border rounded h-100 ${
                      suggestion.category === currentCategory ? 'border-success bg-success bg-opacity-10' : 'border-secondary'
                    }`}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => handleSelectCategory(suggestion.category)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="mb-0">
                        {index === 0 && <i className="bi bi-star-fill text-warning me-1"></i>}
                        {suggestion.category}
                      </h6>
                      {suggestion.category === currentCategory && (
                        <i className="bi bi-check-circle-fill text-success"></i>
                      )}
                    </div>

                    {/* Confidence Bar */}
                    <div className="mb-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="text-muted">Confidence</small>
                        <small className="fw-semibold">{Math.round(suggestion.confidence)}%</small>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div
                          className={`progress-bar ${
                            suggestion.confidence >= 70 ? 'bg-success' :
                            suggestion.confidence >= 40 ? 'bg-warning' : 'bg-danger'
                          }`}
                          style={{ width: `${suggestion.confidence}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Matched Keywords */}
                    {suggestion.matchedKeywords && suggestion.matchedKeywords.length > 0 && (
                      <div className="mt-2">
                        <small className="text-muted d-block mb-1">Matched keywords:</small>
                        <div className="d-flex flex-wrap gap-1">
                          {suggestion.matchedKeywords.slice(0, 4).map(keyword => (
                            <span key={keyword} className="badge bg-secondary bg-opacity-75" style={{ fontSize: '0.7rem' }}>
                              {keyword}
                            </span>
                          ))}
                          {suggestion.matchedKeywords.length > 4 && (
                            <span className="badge bg-secondary bg-opacity-75" style={{ fontSize: '0.7rem' }}>
                              +{suggestion.matchedKeywords.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Select Button */}
                    <button
                      type="button"
                      className={`btn btn-sm w-100 mt-3 ${
                        suggestion.category === currentCategory
                          ? 'btn-success'
                          : 'btn-outline-primary'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCategory(suggestion.category);
                      }}
                    >
                      {suggestion.category === currentCategory ? (
                        <>
                          <i className="bi bi-check-circle me-1"></i>
                          Selected
                        </>
                      ) : (
                        <>
                          <i className="bi bi-arrow-right-circle me-1"></i>
                          Select This
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Manual Selection Option */}
            <div className="mt-3 pt-3 border-top">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Not what you're looking for? You can still select the category manually from the dropdown below.
              </small>
            </div>
          </div>
        </div>
      )}

      {/* No Suggestions Found */}
      {showSuggestions && suggestions.length === 0 && (
        <div className="alert alert-info py-2">
          <i className="bi bi-info-circle me-2"></i>
          No specific category suggestions found. Please select a category manually.
        </div>
      )}
    </div>
  );
};
