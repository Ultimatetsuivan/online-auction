import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiCheck, FiAlertCircle, FiChevronRight } from 'react-icons/fi';
import { buildApiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './common/Toast';
import { Button } from './design-system/Button';
import { Card } from './design-system/Card';
import clsx from 'clsx';

export const CategorySuggester = ({
  title,
  description,
  currentCategory,
  onCategorySelect,
  autoTrigger = true,
  autoTriggerLength = 10
}) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  const suggestionRefs = useRef([]);

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return 'text-green-600';
    if (confidence >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get confidence background
  const getConfidenceBg = (confidence) => {
    if (confidence >= 70) return 'bg-green-500';
    if (confidence >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get AI suggestions
  const getSuggestions = useCallback(async (isAutoTrigger = false) => {
    if (!title || title.trim().length < 3) {
      if (!isAutoTrigger) {
        showToast('Please enter a product title first (at least 3 characters)', 'warning');
      }
      return;
    }

    setLoading(true);
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
        setSelectedIndex(0);
        if (isAutoTrigger) {
          showToast('Category suggestions ready!', 'success');
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to get category suggestions';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [title, description, showToast]);

  // Auto-trigger when title reaches minimum length
  useEffect(() => {
    if (autoTrigger && title && title.trim().length >= autoTriggerLength && !hasAutoTriggered) {
      setHasAutoTriggered(true);
      getSuggestions(true);
    }

    // Reset auto-trigger if title becomes too short
    if (title && title.trim().length < autoTriggerLength) {
      setHasAutoTriggered(false);
    }
  }, [title, autoTrigger, autoTriggerLength, hasAutoTriggered, getSuggestions]);

  // Handle category selection
  const handleSelectCategory = (category) => {
    onCategorySelect(category);
    setShowSuggestions(false);
    showToast(`Category "${category}" selected`, 'success');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            handleSelectCategory(suggestions[selectedIndex].category);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, suggestions, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  return (
    <div className="form-group-modern">
      {/* Trigger Button and Info */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => getSuggestions(false)}
          disabled={loading || !title}
          loading={loading}
          icon={<FiZap size={16} />}
        >
          {loading ? 'Analyzing...' : 'Get AI Suggestions'}
        </Button>

        <p className="text-sm text-neutral-600">
          {autoTrigger && title && title.length < autoTriggerLength
            ? `Type ${autoTriggerLength - title.length} more characters to auto-suggest`
            : 'AI will analyze your title to suggest the best category'}
        </p>
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-primary-500 bg-primary-50 mb-4">
              <div className="p-4 border-b border-primary-200 bg-primary-100">
                <h6 className="text-base font-semibold text-primary-700 flex items-center gap-2">
                  <FiZap size={18} />
                  AI Suggested Categories
                </h6>
                <p className="text-xs text-primary-600 mt-1">
                  Use ↑↓ to navigate, Enter to select, Esc to close
                </p>
              </div>

              <div className="p-4 space-y-3">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.category}
                    ref={(el) => (suggestionRefs.current[index] = el)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={clsx(
                      'relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer',
                      selectedIndex === index
                        ? 'border-primary-500 bg-primary-50 shadow-soft-md'
                        : 'border-neutral-200 bg-white hover:border-primary-300 hover:shadow-soft',
                      suggestion.category === currentCategory && 'ring-2 ring-green-500'
                    )}
                    onClick={() => handleSelectCategory(suggestion.category)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <span className="text-yellow-500" title="Top recommendation">
                            ⭐
                          </span>
                        )}
                        <h6 className="text-base font-semibold text-neutral-800">
                          {suggestion.category}
                        </h6>
                      </div>
                      {suggestion.category === currentCategory && (
                        <FiCheck className="text-green-600" size={20} />
                      )}
                    </div>

                    {/* Confidence Indicator */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-neutral-600 font-medium">Confidence</span>
                        <span className={clsx('text-sm font-bold', getConfidenceColor(suggestion.confidence))}>
                          {Math.round(suggestion.confidence)}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${suggestion.confidence}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={clsx('h-full rounded-full', getConfidenceBg(suggestion.confidence))}
                        />
                      </div>
                    </div>

                    {/* Matched Keywords */}
                    {suggestion.matchedKeywords && suggestion.matchedKeywords.length > 0 && (
                      <div>
                        <p className="text-xs text-neutral-600 mb-1.5 font-medium">Matched keywords:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestion.matchedKeywords.slice(0, 5).map((keyword) => (
                            <span
                              key={keyword}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-700 text-white"
                            >
                              {keyword}
                            </span>
                          ))}
                          {suggestion.matchedKeywords.length > 5 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-500 text-white">
                              +{suggestion.matchedKeywords.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Select Button */}
                    <div className="mt-3">
                      <Button
                        type="button"
                        size="sm"
                        variant={suggestion.category === currentCategory ? 'primary' : 'secondary'}
                        className="w-full"
                        icon={
                          suggestion.category === currentCategory ? (
                            <FiCheck size={16} />
                          ) : (
                            <FiChevronRight size={16} />
                          )
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCategory(suggestion.category);
                        }}
                      >
                        {suggestion.category === currentCategory ? 'Selected' : 'Select This Category'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Manual Selection Hint */}
              <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200 rounded-b-lg">
                <p className="text-xs text-neutral-600 flex items-center gap-1.5">
                  <FiAlertCircle size={14} />
                  Not what you're looking for? You can still select a category manually below.
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* No Suggestions Found */}
        {showSuggestions && suggestions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4"
          >
            <Card className="border-blue-300 bg-blue-50">
              <div className="p-4 flex items-center gap-3 text-blue-800">
                <FiAlertCircle size={20} />
                <p className="text-sm">
                  No specific category suggestions found. Please select a category manually.
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
