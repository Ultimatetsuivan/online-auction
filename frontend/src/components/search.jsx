import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { buildApiUrl } from "../config/api";

export const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryMatches, setCategoryMatches] = useState([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);

  const isParentCategory = (category) => {
    if (!category.parent) return true;
    if (
      typeof category.parent === "object" &&
      (category.parent === null || !category.parent._id)
    ) {
      return true;
    }
    return false;
  };

  const getParentId = (category) => {
    if (!category.parent) return null;
    if (typeof category.parent === "object" && category.parent !== null) {
      return category.parent._id?.toString() || category.parent.toString();
    }
    return category.parent.toString();
  };

  const getChildren = (parentId) => {
    if (!parentId) return [];
    return categories.filter((cat) => {
      const pId = getParentId(cat);
      return pId === parentId.toString();
    });
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(buildApiUrl("/api/category/"));
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setCategories(data);
      } catch (error) {
        console.error("Category fetch error:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setResults([]);
      setCategoryMatches([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        buildApiUrl(`/api/search/search?q=${encodeURIComponent(query)}`)
      );
      setResults(response.data.products);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setCategoryMatches([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const parents = categories.filter((category) => {
      const title = (category.titleMn || category.title || "").toLowerCase();
      return isParentCategory(category) && title.includes(query);
    });

    const combined = categories.reduce((acc, category) => {
      if (isParentCategory(category)) return acc;
      const title = (category.titleMn || category.title || "").toLowerCase();
      if (title.includes(query)) {
        const parentId = getParentId(category);
        if (parentId) {
          const parent = categories.find(
            (cat) => cat._id?.toString() === parentId.toString()
          );
          if (parent) acc.push(parent);
        }
      }
      return acc;
    }, [...parents]);

    const seen = new Set();
    const deduped = combined.filter((cat) => {
      const id = cat._id?.toString();
      if (!id) return false;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    setCategoryMatches(deduped);
  }, [searchQuery, categories]);

  useEffect(() => {
    setExpandedCategoryId(null);
  }, [searchQuery]);

  return (
    <div className="position-relative">
      <input
        type="text"
        className="form-control form-control-lg"
        style={{ borderColor: '#FF6A00', borderWidth: '2px' }}
        placeholder="Хайх барааны нэр..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
      />

      {showResults && (
        <div className="position-absolute w-100 bg-white shadow-sm mt-1 rounded" style={{ maxHeight: '400px', overflowY: 'auto', zIndex: 1000 }}>
          {loading ? (
            <div className="p-2 text-muted">Хайж байна...</div>
          ) : (
            <>
              {/* Category Matches */}
              {categoryMatches.length > 0 && (
                <div className="border-bottom">
                  <div className="p-2 bg-light text-muted small fw-bold">Ангилал</div>
                  <ul className="list-unstyled mb-0">
                    {categoryMatches.map((category) => {
                      const children = getChildren(category._id);
                      const isExpanded = expandedCategoryId === category._id?.toString();

                      return (
                        <li key={category._id}>
                          <div className="d-flex align-items-center">
                            <Link
                              to={`/allproduct?category=${category._id}`}
                              className="d-block p-2 text-decoration-none text-dark hover-primary flex-grow-1"
                            >
                              <i className="bi bi-folder me-2"></i>
                              {category.titleMn || category.title}
                            </Link>
                            {children.length > 0 && (
                              <button
                                className="btn btn-sm btn-link text-muted"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setExpandedCategoryId(isExpanded ? null : category._id?.toString());
                                }}
                              >
                                <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                              </button>
                            )}
                          </div>

                          {/* Child Categories */}
                          {isExpanded && children.length > 0 && (
                            <ul className="list-unstyled ms-4 bg-light">
                              {children.map((child) => (
                                <li key={child._id}>
                                  <Link
                                    to={`/allproduct?category=${child._id}`}
                                    className="d-block p-2 text-decoration-none text-dark hover-primary"
                                  >
                                    <i className="bi bi-folder-fill me-2 text-muted"></i>
                                    {child.titleMn || child.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Product Results */}
              {results.length > 0 ? (
                <div>
                  <div className="p-2 bg-light text-muted small fw-bold">Бараа</div>
                  <ul className="list-unstyled mb-0">
                    {results.map((product) => (
                      <li key={product._id}>
                        <Link
                          to={`/products/${product._id}`}
                          className="d-block p-2 text-decoration-none text-dark hover-primary"
                        >
                          <i className="bi bi-box-seam me-2"></i>
                          {product.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : categoryMatches.length === 0 && searchQuery.length > 1 ? (
                <div className="p-2 text-muted">Илэрц олдсонгүй</div>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
};

