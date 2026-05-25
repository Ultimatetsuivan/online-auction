import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { buildApiUrl } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { ProductCard, Container, Badge, Button } from "../../components/design-system";

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
  const [searchQuery, setSearchQuery] = useState("");

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
            navigate(`/allproduct?category=${categoryId}`, { replace: true });
            return;
          }
          setSelectedCategoryId(categoryId);
          setShowProducts(false);
          loadCategoryHierarchy(cats, categoryId);
        } else {
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

      let parentId;
      if (typeof current.parent === "object" && current.parent !== null) {
        parentId = current.parent._id?.toString();
      } else if (current.parent) {
        parentId = current.parent.toString();
      }

      if (!parentId) break;

      current = allCategories.find((c) => c._id?.toString() === parentId);
    }

    setBreadcrumb(path.slice(0, -1));

    const children = allCategories.filter((c) => {
      if (!c.parent) return false;

      let parentId;
      if (typeof c.parent === "object" && c.parent !== null) {
        parentId = c.parent._id?.toString();
      } else if (c.parent) {
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

      let parentId;
      if (typeof c.parent === "object" && c.parent !== null) {
        parentId = c.parent._id?.toString();
      } else if (c.parent) {
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

  const getCategoryIcon = (category) => {
    if (category?.icon && category.icon.length <= 2) {
      return null;
    }

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

    if (category?.icon && iconMap[category.icon]) {
      return iconMap[category.icon];
    }

    const title = (category?.titleMn || category?.title || category?.name || "").toLowerCase();

    if (title.includes("гэр ахуй") || title.includes("home") || title.includes("household")) return "house-heart";
    if (title.includes("хувцас") || title.includes("загвар") || title.includes("clothing") || title.includes("fashion")) return "bag";
    if (title.includes("электроникс") || title.includes("it") || title.includes("electronics")) return "laptop";
    if (title.includes("хүүхэд") || title.includes("нялх") || title.includes("children") || title.includes("baby")) return "heart";
    if (title.includes("тээвэр") || title.includes("машин") || title.includes("vehicle") || title.includes("car")) return "car-front";
    if (title.includes("гоо") || title.includes("сайхан") || title.includes("beauty")) return "heart-fill";
    if (title.includes("тэжээвэр") || title.includes("амьтан") || title.includes("pet")) return "heart";
    if (title.includes("хобби") || title.includes("зугаа") || title.includes("hobby") || title.includes("entertainment")) return "controller";
    if (title.includes("ажил") || title.includes("үйлчилгээ") || title.includes("job") || title.includes("service")) return "briefcase";
    if (title.includes("үл хөдлөх") || title.includes("хөрөнгө") || title.includes("real estate") || title.includes("property")) return "building";
    if (title.includes("үйлдвэрлэл") || title.includes("бизнес") || title.includes("manufacturing") || title.includes("business")) return "shop";

    return "folder";
  };

  const formatPrice = (v) => `₮${Number(v || 0).toLocaleString()}`;
  const formatTimeLeft = (deadline) => {
    if (!deadline) return "Хугацаагүй";
    const diff = new Date(deadline) - new Date();
    if (diff <= 0) return "Дууссан";
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}ө ${hours % 24}ц үлдсэн`;
    if (hours > 0) return `${hours}ц ${minutes % 60}м үлдсэн`;
    return `${minutes}м үлдсэн`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="bn-spinner w-10 h-10 mx-auto"></div>
          <p className="mt-3 text-bn-text-secondary">{t("loading")}</p>
        </div>
      </div>
    );
  }

  const selectedCategory = selectedCategoryId
    ? categories.find((c) => c._id === selectedCategoryId)
    : null;

  return (
    <div className="bg-bn-bg min-h-screen">
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-bn-primary to-primary-600 text-white py-8">
        <Container className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            <i className="bi bi-folder-fill mr-2"></i>
            {t("categories") || "Ангилалууд"}
          </h2>

          {/* Search Bar */}
          <div className="max-w-lg mx-auto">
            <div className="flex">
              <input
                type="text"
                className="flex-1 px-5 py-3 bg-white text-bn-text rounded-l-full border-0 focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="Ангилал хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                className="px-6 py-3 bg-white text-bn-primary font-bold rounded-r-full hover:bg-gray-50 transition-colors"
                type="button"
                onClick={() => {
                  if (searchQuery.trim()) {
                    navigate(`/allproduct?search=${encodeURIComponent(searchQuery)}`);
                  }
                }}
              >
                <i className="bi bi-search"></i>
              </button>
            </div>
          </div>

          <p className="mt-4 text-white/80">
            Бүх ангиллыг нэг газраас шүүн хараарай
          </p>
        </Container>
      </section>

      {/* Breadcrumb & Category Header */}
      <section className="bg-bn-surface border-b border-bn-border py-4">
        <Container>
          {/* Breadcrumb */}
          {(breadcrumb.length > 0 || selectedCategoryId) && (
            <nav className="flex items-center gap-2 text-sm mb-3 flex-wrap">
              <button
                className="text-bn-primary hover:text-bn-primary-dark bg-transparent border-0 font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  setShowProducts(false);
                  setSelectedCategoryId(null);
                  handleBreadcrumbClick(-1);
                }}
              >
                <i className="bi bi-house-door mr-1"></i>
                {t("allCategories") || "Бүх ангилалууд"}
              </button>
              {breadcrumb.map((cat, index) => (
                <React.Fragment key={cat._id}>
                  <span className="text-bn-text-secondary">/</span>
                  {index === breadcrumb.length - 1 && !selectedCategoryId ? (
                    <span className="text-bn-text font-medium">
                      {cat.icon && cat.icon.length <= 2 && <span className="mr-1">{cat.icon}</span>}
                      {!cat.icon || cat.icon.length > 2 ? <i className={`bi bi-${getCategoryIcon(cat)} mr-1`}></i> : null}
                      {cat.titleMn || cat.title}
                    </span>
                  ) : (
                    <button
                      className="text-bn-primary hover:text-bn-primary-dark bg-transparent border-0 font-medium"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowProducts(false);
                        handleBreadcrumbClick(index);
                      }}
                    >
                      {cat.icon && cat.icon.length <= 2 && <span className="mr-1">{cat.icon}</span>}
                      {!cat.icon || cat.icon.length > 2 ? <i className={`bi bi-${getCategoryIcon(cat)} mr-1`}></i> : null}
                      {cat.titleMn || cat.title}
                    </button>
                  )}
                </React.Fragment>
              ))}
              {selectedCategory && (
                <>
                  <span className="text-bn-text-secondary">/</span>
                  <span className="text-bn-text font-medium">
                    {selectedCategory.icon && selectedCategory.icon.length <= 2 && <span className="mr-1">{selectedCategory.icon}</span>}
                    {!selectedCategory.icon || selectedCategory.icon.length > 2 ? <i className={`bi bi-${getCategoryIcon(selectedCategory)} mr-1`}></i> : null}
                    {selectedCategory.titleMn || selectedCategory.title}
                  </span>
                </>
              )}
            </nav>
          )}

          {/* Category Title + View Products */}
          {selectedCategory && (
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-bn-text flex items-center">
                {selectedCategory.icon && selectedCategory.icon.length <= 2 ? (
                  <span className="mr-2 text-2xl">{selectedCategory.icon}</span>
                ) : (
                  <i className={`bi bi-${getCategoryIcon(selectedCategory)} mr-2 text-bn-primary text-xl`}></i>
                )}
                {selectedCategory.titleMn || selectedCategory.title}
              </h3>
              <Button size="sm" onClick={() => handleViewProducts(selectedCategory)}>
                <i className="bi bi-grid-3x3-gap mr-1"></i>
                {t("viewProducts") || "Бараа харах"}
              </Button>
            </div>
          )}
        </Container>
      </section>

      {/* Main Content */}
      <Container className="py-8">
        {showProducts ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold text-bn-text">
                {selectedCategory?.titleMn || selectedCategory?.title}
              </h4>
              <Button size="sm" variant="outline" onClick={() => setShowProducts(false)}>
                <i className="bi bi-arrow-left mr-1"></i>
                {t("backToCategories") || "Ангилалруу буцах"}
              </Button>
            </div>
            {getFilteredProducts().length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {getFilteredProducts().map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    formatPrice={formatPrice}
                    formatTimeLeft={formatTimeLeft}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-bn-text-secondary bg-bn-bg-secondary rounded-bn-lg">
                {t("noProductsInCategory") || "Энэ ангилалд бараа олдсонгүй"}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-bn-text flex items-center">
                <i className="bi bi-grid-3x3-gap text-bn-primary mr-2"></i>
                {t("categories") || "Ангилалууд"}
              </h2>
              <Link
                to="/allproduct"
                className="text-sm font-semibold text-bn-primary hover:text-bn-primary-dark no-underline"
              >
                {t("viewAll")} <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

            {/* Category Grid */}
            {currentLevel.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {currentLevel.map((category) => {
                  const count = getProductCountWithSubcategories(category._id);
                  const iconName = getCategoryIcon(category);

                  return (
                    <button
                      key={category._id}
                      type="button"
                      className="bg-bn-surface border border-bn-border rounded-bn-xl p-4 text-center hover:shadow-card hover:border-bn-primary hover:-translate-y-0.5 transition-all group"
                      onClick={() => handleCategoryClick(category)}
                    >
                      <div className="flex items-center justify-center h-14 mb-2">
                        {category.icon && category.icon.length <= 2 ? (
                          <span className="text-4xl">{category.icon}</span>
                        ) : (
                          <i
                            className={`bi bi-${iconName} text-bn-primary text-4xl group-hover:scale-110 transition-transform`}
                          ></i>
                        )}
                      </div>
                      <h6 className="text-sm font-semibold text-bn-text mb-1 min-h-[2.5rem] flex items-center justify-center leading-tight">
                        {category.titleMn || category.title || category.name || "Ангилал"}
                      </h6>
                      <p className="text-bn-text-secondary text-xs">
                        {count} {t("items") || "бараа"}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-bn-text-secondary bg-bn-bg-secondary rounded-bn-lg">
                {t("noCategoriesFound") || "Ангилал олдсонгүй"}
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
};
