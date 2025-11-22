import "bootstrap/dist/css/bootstrap.min.css";
import "../../index.css";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { buildApiUrl } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { MercariProductCard } from "../../components/MercariProductCard";

export const Categories = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();
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
          axios.get(buildApiUrl("/api/category/")),
          axios.get(buildApiUrl("/api/product/products")),
        ]);

        const cats = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : categoriesResponse.data?.data || [];
        setCategories(cats);

        const prods = Array.isArray(productsResponse.data)
          ? productsResponse.data
          : productsResponse.data?.data || [];
        setProducts(prods);

        const categoryId = searchParams.get("categoryid");
        const viewProducts = searchParams.get("view") === "products";

        if (categoryId) {
          if (viewProducts) {
            // leaf → go to /allproduct with filters (same as before)
            navigate(`/allproduct?category=${categoryId}`, { replace: true });
            return;
          }
          setSelectedCategoryId(categoryId);
          setShowProducts(false);
          loadCategoryHierarchy(cats, categoryId);
        } else {
          // root level – only parent categories (same as home quick links)
          const parentCategories = cats.filter((c) => {
            if (!c.parent) return true;
            if (
              typeof c.parent === "object" &&
              (c.parent === null || !c.parent._id)
            )
              return true;
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
  }, [searchParams, navigate]);

  const loadCategoryHierarchy = (allCategories, categoryId) => {
    const category = allCategories.find((c) => {
      const cId = c._id?.toString() || c._id;
      return cId === categoryId.toString();
    });

    if (!category) {
      const parentCategories = allCategories.filter((c) => {
        if (!c.parent) return true;
        if (
          typeof c.parent === "object" &&
          (c.parent === null || !c.parent._id)
        )
          return true;
        return false;
      });
      setCurrentLevel(parentCategories);
      return;
    }

    const path = [];
    let current = category;
    while (current) {
      path.unshift(current);
      if (!current.parent) break;

      // Get parent ID - handle both populated and non-populated cases
      let parentId;
      if (typeof current.parent === "object" && current.parent !== null) {
        // Parent is populated - get the _id field
        parentId = current.parent._id?.toString();
      } else if (current.parent) {
        // Parent is just an ID string
        parentId = current.parent.toString();
      }

      if (!parentId) break;

      current = allCategories.find((c) => c._id?.toString() === parentId);
    }

    setBreadcrumb(path.slice(0, -1));

    const children = allCategories.filter((c) => {
      if (!c.parent) return false;

      // Get parent ID - handle both populated and non-populated cases
      let parentId;
      if (typeof c.parent === "object" && c.parent !== null) {
        // Parent is populated - get the _id field
        parentId = c.parent._id?.toString();
      } else if (c.parent) {
        // Parent is just an ID string
        parentId = c.parent.toString();
      }

      if (!parentId) return false;

      return parentId === categoryId.toString();
    });

    setCurrentLevel(children.length > 0 ? children : [category]);
  };

  const handleCategoryClick = (category) => {
    const children = categories.filter((c) => {
      if (!c.parent) return false;

      // Get parent ID - handle both populated and non-populated cases
      let parentId;
      if (typeof c.parent === "object" && c.parent !== null) {
        // Parent is populated - get the _id field
        parentId = c.parent._id?.toString();
      } else if (c.parent) {
        // Parent is just an ID string
        parentId = c.parent.toString();
      }

      if (!parentId) return false;

      return parentId === category._id.toString();
    });

    if (children.length > 0) {
      setSelectedCategoryId(category._id);
      setShowProducts(false);
      navigate(`/categories?categoryid=${category._id}`);
    } else {
      // leaf → go to allproduct (same behavior as before)
      navigate(`/allproduct?category=${category._id}`);
    }
  };

  const handleViewProducts = (category) => {
    navigate(`/allproduct?category=${category._id}`);
  };

  const getFilteredProducts = () => {
    if (!selectedCategoryId) return [];
    return products.filter((product) => {
      const productCategoryId =
        typeof product.category === "object" && product.category !== null
          ? product.category._id
          : product.category;
      return productCategoryId === selectedCategoryId;
    });
  };

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      navigate("/categories");
    } else {
      const category = breadcrumb[index];
      navigate(`/categories?categoryid=${category._id}`);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
        <div className="text-center">
          <div
            className="spinner-grow"
            role="status"
            style={{ width: "3rem", height: "3rem", color: "#FF6A00" }}
          >
            <span className="visually-hidden">
              {t("loading") || "Loading..."}
            </span>
          </div>
          <p className="mt-3 fs-5 text-muted">{t("loading")}</p>
        </div>
      </div>
    );
  }

  const selectedCategory = selectedCategoryId
    ? categories.find((c) => c._id === selectedCategoryId)
    : null;

  return (
    <div
      className="home-page"
      style={{
        background: isDarkMode
          ? "linear-gradient(180deg, rgba(20, 20, 20, 1) 0%, rgba(30, 30, 30, 1) 100%)"
          : "linear-gradient(180deg, rgba(255, 250, 245, 1) 0%, rgba(255, 255, 255, 1) 50%, rgba(250, 245, 240, 1) 100%)",
        minHeight: "100vh",
      }}
    >
      {/* Hero banner – smaller, but same feeling as home */}
      <section
        className="category-hero py-4"
        style={{
          backgroundColor: "#ff4b4b",
          color: "white",
        }}
      >
        <div className="container text-center">
          <h2 className="fw-bold mb-1">
            {t("categories") || "Categories"}
          </h2>
          <p className="mb-0">
            {language === "MN"
              ? "Бүх ангиллыг нэг газраас шүүн хараарай"
              : "Browse and discover items by category."}
          </p>
        </div>
      </section>

      <section
        className="py-4"
        style={{
          backgroundColor: isDarkMode ? "rgba(40,40,40,0.6)" : "rgba(255,255,255,0.9)",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <div className="container">
          {/* Breadcrumb */}
          {(breadcrumb.length > 0 || selectedCategoryId) && (
            <nav aria-label="breadcrumb" className="mb-3">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <button
                    type="button"
                    className="btn btn-link p-0 border-0"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowProducts(false);
                      setSelectedCategoryId(null);
                      handleBreadcrumbClick(-1);
                    }}
                    style={{ color: "#FF6A00", textDecoration: "none" }}
                  >
                    <i className="bi bi-house-door"></i>{" "}
                    {t("allCategories") || "All Categories"}
                  </button>
                </li>
                {breadcrumb.map((cat, index) => (
                  <li
                    key={cat._id}
                    className={`breadcrumb-item ${
                      index === breadcrumb.length - 1 && !selectedCategoryId
                        ? "active"
                        : ""
                    }`}
                  >
                    {index === breadcrumb.length - 1 && !selectedCategoryId ? (
                      cat.titleMn || cat.title
                    ) : (
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowProducts(false);
                          handleBreadcrumbClick(index);
                        }}
                        style={{ color: "#FF6A00", textDecoration: "none" }}
                      >
                        {cat.titleMn || cat.title}
                      </button>
                    )}
                  </li>
                ))}
                {selectedCategory && (
                  <li className="breadcrumb-item active">
                    {selectedCategory.titleMn || selectedCategory.title}
                  </li>
                )}
              </ol>
            </nav>
          )}

          {/* Header row: category title + View products btn (same orange style) */}
          {selectedCategory && (
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3
                  className="mb-1 fw-bold"
                  style={{
                    color: isDarkMode ? "var(--color-text)" : "#ff6a00",
                  }}
                >
                  {selectedCategory.titleMn || selectedCategory.title}
                </h3>
              </div>
              <button
                className="btn btn-sm text-white"
                style={{ backgroundColor: "#FF6A00", borderColor: "#FF6A00" }}
                onClick={() => handleViewProducts(selectedCategory)}
              >
                <i className="bi bi-grid-3x3-gap me-1"></i>
                {t("viewProducts") || "View products"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main content – same "section + container + grid" rhythm as Home */}
      <section className="py-5">
        <div className="container">
          {/* If showProducts is ever enabled, use Mercari-style product grid */}
          {showProducts ? (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">
                  {selectedCategory?.titleMn || selectedCategory?.title}
                </h4>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowProducts(false)}
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  {t("backToCategories") || "Back to categories"}
                </button>
              </div>
              {getFilteredProducts().length > 0 ? (
                <div className="mercari-product-grid">
                  {getFilteredProducts().map((product) => (
                    <MercariProductCard
                      key={product._id}
                      product={product}
                    />
                  ))}
                </div>
              ) : (
                <div className="alert alert-info text-center">
                  {t("noProductsInCategory") ||
                    "No products found in this category"}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="section-title mb-0">
                  <i
                    className="bi bi-grid-3x3-gap"
                    style={{ color: "#FF6A00" }}
                  ></i>
                  <span className="ms-2">
                    {t("categories") || "Categories"}
                  </span>
                </h2>
                <Link
                  to="/allproduct"
                  className="view-all-link"
                  style={{ color: "#FF6A00", fontWeight: "bold" }}
                >
                  {t("viewAll")} <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              {/* Category GRID – same style as Home.CategoryCard */}
              <div className="row">
                {currentLevel.length > 0 ? (
                  currentLevel.map((category) => {
                    // count products in this category for display
                    const count = products.filter((p) => {
                      const productCategoryId =
                        typeof p.category === "object" && p.category !== null
                          ? p.category._id
                          : p.category;
                      return productCategoryId === category._id;
                    }).length;

                    return (
                      <div
                        key={category._id}
                        className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3"
                      >
                        <button
                          type="button"
                          className="text-decoration-none w-100 border-0 bg-transparent"
                          onClick={() => handleCategoryClick(category)}
                        >
                          <div className="card h-100 text-center p-3 hover-effect">
                            {category.icon && (
                              <div className="mb-2">
                                <i
                                  className={`bi bi-${category.icon.replace(
                                    "-outline",
                                    ""
                                  )} fs-1`}
                                  style={{ color: "#FF6A00" }}
                                ></i>
                              </div>
                            )}
                            <h6 className="mb-1 fw-semibold">
                              {category.titleMn || category.title}
                            </h6>
                            <p className="text-muted small mb-0">
                              {count} {t("items")}
                            </p>
                          </div>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-12">
                    <div className="alert alert-info text-center">
                      {t("noCategoriesFound") || "No categories found"}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
