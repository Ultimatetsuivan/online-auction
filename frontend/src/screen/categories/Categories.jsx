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

  // Helper function to get all subcategory IDs recursively
  const getAllSubcategoryIds = (categoryId) => {
    const subcats = categories.filter((c) => {
      if (!c.parent) return false;
      let parentId;
      if (typeof c.parent === "object" && c.parent !== null) {
        parentId = c.parent._id?.toString();
      } else if (c.parent) {
        parentId = c.parent.toString();
      }
      return parentId === categoryId.toString();
    });

    let allIds = [categoryId];
    subcats.forEach((sub) => {
      allIds = [...allIds, ...getAllSubcategoryIds(sub._id)];
    });
    return allIds;
  };

  // Get product count including subcategories
  const getProductCountWithSubcategories = (categoryId) => {
    const categoryIds = getAllSubcategoryIds(categoryId);
    return products.filter((p) => {
      const productCategoryId =
        typeof p.category === "object" && p.category !== null
          ? p.category._id?.toString()
          : p.category?.toString();
      return categoryIds.some((id) => id.toString() === productCategoryId);
    }).length;
  };

  // Get icon for category based on name or icon field
  const getCategoryIcon = (category) => {
    // If icon is emoji (1-2 chars), return null to display as text instead
    if (category?.icon && category.icon.length <= 2) {
      return null; // Will be handled separately as emoji text
    }

    // Map Ionicons names to Bootstrap Icons names
    const iconMap = {
      "cube-outline": "box",
      "cube": "box",
      "home-outline": "house",
      "home": "house",
      "cart-outline": "cart",
      "cart": "cart",
      "heart-outline": "heart",
      "heart": "heart",
      "star-outline": "star",
      "star": "star",
      "phone-portrait-outline": "phone",
      "laptop-outline": "laptop",
      "car-outline": "car-front",
      "bicycle-outline": "bicycle",
    };

    // If icon field exists and has a mapping, use it
    if (category?.icon && iconMap[category.icon]) {
      return iconMap[category.icon];
    }

    // Otherwise map based on category name
    const title = (category?.titleMn || category?.title || category?.name || "").toLowerCase();

    if (title.includes("гэр ахуй") || title.includes("home") || title.includes("household")) {
      return "house-heart";
    }
    if (title.includes("хувцас") || title.includes("загвар") || title.includes("clothing") || title.includes("fashion")) {
      return "bag";
    }
    if (title.includes("электроникс") || title.includes("it") || title.includes("electronics")) {
      return "laptop";
    }
    if (title.includes("хүүхэд") || title.includes("нялх") || title.includes("children") || title.includes("baby")) {
      return "heart";
    }
    if (title.includes("тээвэр") || title.includes("машин") || title.includes("vehicle") || title.includes("car")) {
      return "car-front";
    }
    if (title.includes("гоо") || title.includes("сайхан") || title.includes("beauty")) {
      return "heart-fill";
    }
    if (title.includes("тэжээвэр") || title.includes("амьтан") || title.includes("pet")) {
      return "heart";
    }
    if (title.includes("хобби") || title.includes("зугаа") || title.includes("hobby") || title.includes("entertainment")) {
      return "controller";
    }
    if (title.includes("ажил") || title.includes("үйлчилгээ") || title.includes("job") || title.includes("service")) {
      return "briefcase";
    }
    if (title.includes("үл хөдлөх") || title.includes("хөрөнгө") || title.includes("real estate") || title.includes("property")) {
      return "building";
    }
    if (title.includes("үйлдвэрлэл") || title.includes("бизнес") || title.includes("manufacturing") || title.includes("business")) {
      return "shop";
    }

    return "folder"; // default icon
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
            <i className="bi bi-folder-fill me-2"></i>
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
                      <>
                        {cat.icon && cat.icon.length <= 2 ? (
                          <span className="me-1" style={{ fontSize: "1.2rem" }}>{cat.icon}</span>
                        ) : (
                          <i className={`bi bi-${getCategoryIcon(cat)} me-1`}></i>
                        )}
                        {cat.titleMn || cat.title}
                      </>
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
                        {cat.icon && cat.icon.length <= 2 ? (
                          <span className="me-1" style={{ fontSize: "1.2rem" }}>{cat.icon}</span>
                        ) : (
                          <i className={`bi bi-${getCategoryIcon(cat)} me-1`}></i>
                        )}
                        {cat.titleMn || cat.title}
                      </button>
                    )}
                  </li>
                ))}
                {selectedCategory && (
                  <li className="breadcrumb-item active">
                    {selectedCategory.icon && selectedCategory.icon.length <= 2 ? (
                      <span className="me-1" style={{ fontSize: "1.2rem" }}>{selectedCategory.icon}</span>
                    ) : (
                      <i className={`bi bi-${getCategoryIcon(selectedCategory)} me-1`}></i>
                    )}
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
                  className="mb-1 fw-bold d-flex align-items-center"
                  style={{
                    color: isDarkMode ? "var(--color-text)" : "#ff6a00",
                  }}
                >
                  {selectedCategory.icon && selectedCategory.icon.length <= 2 ? (
                    <span className="me-2" style={{ fontSize: "1.8rem" }}>{selectedCategory.icon}</span>
                  ) : (
                    <i className={`bi bi-${getCategoryIcon(selectedCategory)} me-2`} style={{ fontSize: "1.5rem" }}></i>
                  )}
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
                    // count products in this category AND all subcategories
                    const count = getProductCountWithSubcategories(category._id);

                    const iconName = getCategoryIcon(category);
                    const iconClass = `bi bi-${iconName}`;

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
                            <div className="mb-2 d-flex justify-content-center align-items-center" style={{ minHeight: "60px" }}>
                              {category.icon && category.icon.length <= 2 ? (
                                <span style={{ fontSize: "3rem", lineHeight: 1 }}>
                                  {category.icon}
                                </span>
                              ) : (
                                <i
                                  className={iconClass}
                                  style={{
                                    color: "#FF6A00",
                                    fontSize: "3rem",
                                    display: "inline-block",
                                    lineHeight: 1,
                                    fontFamily: "'bootstrap-icons'",
                                    fontStyle: "normal",
                                    fontWeight: "normal"
                                  }}
                                  aria-hidden="true"
                                ></i>
                              )}
                            </div>
                            <h6 className="mb-1 fw-semibold" style={{ minHeight: "2.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {category.titleMn || category.title || category.name || "Category"}
                            </h6>
                            <p className="text-muted small mb-0">
                              {count} {t("items") || "items"}
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
