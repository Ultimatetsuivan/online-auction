import "bootstrap/dist/css/bootstrap.min.css";
import "../../index.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/api";
import { useToast } from "../../components/common/Toast";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { MercariProductCard } from "../../components/MercariProductCard";
import { useLikedProducts } from "../../context/LikedProductsContext";

export const MyList = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const { likedProducts, removeLike } = useLikedProducts();
  const [savedFilters, setSavedFilters] = useState([]);
  const [followedUsers, setFollowedUsers] = useState([]);
  const [filterProducts, setFilterProducts] = useState({});
  const [followedProducts, setFollowedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState({});

  useEffect(() => {
    loadMyList();
  }, []);

  const loadMyList = async () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      const token = user.token;
      const userId = user._id || user.id;

      // Get user-specific saved filters
      const localStorageFilters = localStorage.getItem(`savedFilters_${userId}`);
      let localFilters = [];
      if (localStorageFilters) {
        try {
          localFilters = JSON.parse(localStorageFilters);
          setSavedFilters(localFilters);
        } catch (e) {
          console.error("Error parsing saved filters:", e);
        }
      }

      try {
        const [followingRes, followedProductsRes] = await Promise.all([
          axios
            .get(buildApiUrl("/api/mylist/following"), {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({ data: [] })),
          axios
            .get(buildApiUrl("/api/mylist/following/products"), {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({ data: [] })),
        ]);

        setFollowedUsers(followingRes.data || []);
        setFollowedProducts(followedProductsRes.data || []);
      } catch (err) {
        console.error("Error loading backend data:", err);
      }

      if (Array.isArray(localFilters) && localFilters.length > 0) {
        try {
          await loadFilterProducts(localFilters, token);
        } catch (e) {
          console.error("Failed loading products for saved filters", e);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading my list:", err);
      setLoading(false);
      setError(t("somethingWentWrong") || "Something went wrong while loading your list.");
    }
  };

  const loadFilterProducts = async (filters, token) => {
    const loadingStates = {};
    const productsMap = {};

    for (const filter of filters) {
      loadingStates[filter._id] = true;
      try {
        const response = await axios.get(
          buildApiUrl(`/api/mylist/filters/${filter._id}/products`),
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        productsMap[filter._id] = response.data || [];
      } catch (err) {
        console.error(`Error loading products for filter ${filter._id}:`, err);
        productsMap[filter._id] = [];
      } finally {
        loadingStates[filter._id] = false;
      }
    }

    setFilterProducts(productsMap);
    setLoadingProducts(loadingStates);
  };

  const deleteFilter = (filterId) => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        const userId = user._id || user.id;
        const updated = savedFilters.filter((f) => f.id !== filterId);
        setSavedFilters(updated);
        localStorage.setItem(`savedFilters_${userId}`, JSON.stringify(updated));
        toast.success(t("filterDeleted") || "Шүүлтүүр устгагдлаа");
      }
    } catch (err) {
      console.error("Error deleting filter:", err);
      toast.error(t("errorDeletingFilter") || "Шүүлтүүр устгахад алдаа гарлаа");
    }
  };

  const unfollowUser = async (userId) => {
    try {
      const userData = localStorage.getItem("user");
      const user = JSON.parse(userData);
      const token = user.token;

      await axios.delete(buildApiUrl(`/api/mylist/follow/${userId}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFollowedUsers(
        followedUsers.filter((f) => f.following._id !== userId)
      );

      const followedProductsRes = await axios.get(
        buildApiUrl("/api/mylist/following/products"),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFollowedProducts(followedProductsRes.data);
    } catch (err) {
      console.error("Error unfollowing user:", err);
      toast.error("Failed to unfollow user");
    }
  };

  const viewFilterProducts = (filterId) => {
    const filter = savedFilters.find((f) => f._id === filterId);
    if (filter && filter.filterData) {
      const params = new URLSearchParams();
      if (filter.filterData.category)
        params.append("category", filter.filterData.category);
      if (filter.filterData.brand)
        params.append("brand", filter.filterData.brand);
      if (filter.filterData.searchQuery)
        params.append("search", filter.filterData.searchQuery);
      if (filter.filterData.minPrice)
        params.append("minPrice", filter.filterData.minPrice);
      if (filter.filterData.maxPrice)
        params.append("maxPrice", filter.filterData.maxPrice);

      navigate(`/allproduct?${params.toString()}`);
    }
  };

  if (loading) {
    return (
      <div className="container my-5 py-5 d-flex justify-content-center">
        <div className="text-center">
          <div
            className="spinner-border"
            role="status"
            style={{ color: "#FF6A00" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted small">
            {t("loadingMyList") || "Loading your list..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger d-flex align-items-center">
          <i className="bi bi-exclamation-octagon-fill me-2"></i>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const stats = [
    { label: t("likedProducts") || "Liked", value: likedProducts.length },
    { label: t("savedFilters") || "Filters", value: savedFilters.length },
    { label: t("following") || "Following", value: followedUsers.length },
  ];

  const pageBg = isDarkMode ? "bg-dark text-light" : "bg-light";

  return (
    <div className={`my-list-page py-4 ${pageBg}`}>
      <div className="container">
        {/* Page Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1 fw-bold d-flex align-items-center">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-circle me-2"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "rgba(255, 106, 0, 0.12)",
                }}
              >
                <i
                  className="bi bi-heart-fill"
                  style={{ color: "#FF6A00", fontSize: "1.1rem" }}
                ></i>
              </span>
              <span>{t("myList") || "My List"}</span>
            </h2>
          </div>

          {/* Quick stats */}
          <div className="d-flex flex-wrap gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="px-3 py-2 rounded-pill d-flex align-items-center shadow-sm"
                style={{
                  backgroundColor: isDarkMode ? "#222" : "#ffffff",
                  border: isDarkMode ? "1px solid #333" : "1px solid #eee",
                }}
              >
                <span className="fw-semibold me-1">{s.value}</span>
                <span className="text-muted small">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content layout: 2 columns on lg+ */}
        <div className="row gy-4">
          {/* Left column: liked + new products */}
          <div className="col-12 col-lg-7">
            {/* Liked Products */}
            <section className="mb-4">
              <div
                className={`card border-0 shadow-sm rounded-4 ${
                  isDarkMode ? "bg-secondary text-light" : "bg-white"
                }`}
              >
                <div className="card-header border-0 bg-transparent px-4 pt-3 pb-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0 fw-bold d-flex align-items-center">
                        <i
                          className="bi bi-heart-fill me-2"
                          style={{ color: "#ff4b4b" }}
                        ></i>
                        {t("likedProducts") || "Liked Products"}
                      </h5>
                    </div>
                    {likedProducts.length > 0 && (
                      <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis">
                        {likedProducts.length} {t("items") || "items"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="card-body px-4 pb-4 pt-3">
                  {likedProducts.length === 0 ? (
                    <div className="text-center py-4">
                      <i
                        className="bi bi-heart mb-2"
                        style={{ fontSize: "2rem", color: "#FF6A00" }}
                      ></i>
                      <p className="mb-1 fw-semibold">
                        {t("noLikedProducts") || "No liked products yet"}
                      </p>
                      <p className="text-muted small mb-2">
                        {t("noLikedHint") ||
                          "Tap the heart icon on any product to save it here."}
                      </p>
                      <Link
                        to="/allproduct"
                        className="btn btn-sm text-white"
                        style={{
                          backgroundColor: "#FF6A00",
                          borderColor: "#FF6A00",
                        }}
                      >
                        {t("browseNow") || "Browse products"}
                      </Link>
                    </div>
                  ) : (
                    <div className="row row-cols-2 row-cols-md-3 g-3">
                      {likedProducts.map((product) => (
                        <div key={product._id} className="col">
                          <div className="position-relative h-100">
                            <MercariProductCard
                              product={product}
                              showLikeButton={true}
                            />
                            <button
                              className="btn btn-sm btn-light position-absolute shadow-sm"
                              style={{
                                top: "0.4rem",
                                right: "0.4rem",
                                borderRadius: "999px",
                                width: "30px",
                                height: "30px",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (
                                  window.confirm(
                                    t("confirmRemoveLike") ||
                                      "Remove this product from liked list?"
                                  )
                                ) {
                                  removeLike(product._id);
                                  toast.success(
                                    t("removedFromLiked") ||
                                      "Removed from liked products"
                                  );
                                }
                              }}
                              title={
                                t("removeFromLiked") || "Remove from liked"
                              }
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* New Products */}
            <section className="mb-4">
              <div
                className={`card border-0 shadow-sm rounded-4 ${
                  isDarkMode ? "bg-secondary text-light" : "bg-white"
                }`}
              >
                <div className="card-header border-0 bg-transparent px-4 pt-3 pb-0">
                  <h5 className="mb-1 fw-bold d-flex align-items-center">
                    <i
                      className="bi bi-box-seam me-2"
                      style={{ color: "#FF6A00" }}
                    ></i>
                    {t("newProducts") || "New Products"}
                  </h5>
                </div>
                <div className="card-body px-4 pb-4 pt-3">
                  {followedProducts.length === 0 ? (
                    <div className="text-center py-4">
                      <i
                        className="bi bi-bell-slash mb-2"
                        style={{ fontSize: "2rem", color: "#FF6A00" }}
                      ></i>
                      <p className="mb-1 fw-semibold">
                        {t("noNewProducts") ||
                          "No new products from users you follow yet."}
                      </p>
                      <p className="text-muted small mb-0">
                        {t("noNewProductsHint") ||
                          "Follow active sellers to see their newest listings here."}
                      </p>
                    </div>
                  ) : (
                    <div className="d-flex flex-row flex-nowrap overflow-auto pb-2">
                      {followedProducts.map((product) => (
                        <div
                          key={product._id}
                          className="me-3"
                          style={{ minWidth: "180px" }}
                        >
                          <MercariProductCard
                            product={product}
                            showLikeButton={false}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right column: saved filters + following */}
          <div className="col-12 col-lg-5">
            {/* Saved Filters */}
            <section className="mb-4">
              <div
                className={`card border-0 shadow-sm rounded-4 ${
                  isDarkMode ? "bg-secondary text-light" : "bg-white"
                }`}
              >
                <div className="card-header border-0 bg-transparent px-4 pt-3 pb-0">
                  <h5 className="mb-1 fw-bold d-flex align-items-center">
                    <i
                      className="bi bi-funnel me-2"
                      style={{ color: "#FF6A00" }}
                    ></i>
                    {t("savedFilters") || "Saved Filters"}
                  </h5>
                </div>
                <div className="card-body px-4 pb-4 pt-3">
                  {savedFilters.length === 0 ? (
                    <div className="text-center py-4">
                      <i
                        className="bi bi-funnel mb-2"
                        style={{ fontSize: "2rem", color: "#FF6A00" }}
                      ></i>
                      <p className="mb-1 fw-semibold">
                        {t("noSavedFilters") ||
                          "No saved filters yet. Save your search filters to get notified when new products match!"}
                      </p>
                      <p className="text-muted small mb-0">
                        {t("noSavedFiltersHint") ||
                          "Use the search page filters and click “Save filter” to keep them here."}
                      </p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-4">
                      {savedFilters.map((filter) => {
                        const products = filterProducts[filter._id] || [];
                        const isLoading = loadingProducts[filter._id];
                        const filterQuery =
                          filter.filterData?.searchQuery || filter.name;

                        return (
                          <div
                            key={filter._id}
                            className="p-3 rounded-3 border"
                            style={{
                              borderColor: isDarkMode ? "#444" : "#e9ecef",
                              backgroundColor: isDarkMode ? "#282828" : "#f8f9fa",
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="mb-1 fw-bold">
                                  {filter.name || filterQuery}
                                </h6>
                                {filter.filterData?.searchQuery && (
                                  <p className="mb-0 text-muted small">
                                    {filter.filterData.searchQuery}
                                  </p>
                                )}
                              </div>
                              <div className="d-flex gap-2">
                                {filter.notifyOnNewProducts && (
                                  <span className="badge bg-success align-self-center">
                                    <i className="bi bi-bell-fill me-1"></i>
                                    {t("notificationsEnabled") ||
                                      "Notifications ON"}
                                  </span>
                                )}
                                <Link
                                  to={`/allproduct?${new URLSearchParams({
                                    ...(filter.filterData?.category && {
                                      category: filter.filterData.category,
                                    }),
                                    ...(filter.filterData?.brand && {
                                      brand: filter.filterData.brand,
                                    }),
                                    ...(filter.filterData?.searchQuery && {
                                      search: filter.filterData.searchQuery,
                                    }),
                                    ...(filter.filterData?.minPrice && {
                                      minPrice: filter.filterData.minPrice,
                                    }),
                                    ...(filter.filterData?.maxPrice && {
                                      maxPrice: filter.filterData.maxPrice,
                                    }),
                                  }).toString()}`}
                                  className="btn btn-sm text-white"
                                  style={{
                                    backgroundColor: "#FF6A00",
                                    borderColor: "#FF6A00",
                                  }}
                                >
                                  {t("viewAll") || "View all"} &gt;
                                </Link>
                              </div>
                            </div>

                            {(filter.filterData?.category ||
                              filter.filterData?.brand ||
                              filter.filterData?.minPrice ||
                              filter.filterData?.maxPrice) && (
                              <div className="mb-2">
                                {filter.filterData.category && (
                                  <span className="badge bg-secondary me-2 mb-2">
                                    <i className="bi bi-tag me-1"></i>
                                    {filter.filterData.category}
                                  </span>
                                )}
                                {filter.filterData.brand && (
                                  <span className="badge bg-secondary me-2 mb-2">
                                    <i className="bi bi-award me-1"></i>
                                    {filter.filterData.brand}
                                  </span>
                                )}
                                {(filter.filterData.minPrice ||
                                  filter.filterData.maxPrice) && (
                                  <span className="badge bg-secondary me-2 mb-2">
                                    <i className="bi bi-currency-dollar me-1"></i>
                                    {filter.filterData.minPrice || "0"} -{" "}
                                    {filter.filterData.maxPrice || "∞"}
                                  </span>
                                )}
                              </div>
                            )}

                            {isLoading ? (
                              <div className="text-center py-3">
                                <div
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                  style={{ color: "#FF6A00" }}
                                >
                                  <span className="visually-hidden">
                                    Loading...
                                  </span>
                                </div>
                              </div>
                            ) : products.length > 0 ? (
                              <div className="d-flex flex-row flex-nowrap overflow-auto pt-1">
                                {products.slice(0, 8).map((product) => (
                                  <div
                                    key={product._id}
                                    className="me-3"
                                    style={{ minWidth: "150px" }}
                                  >
                                    <MercariProductCard
                                      product={product}
                                      showLikeButton={false}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted small mb-0 mt-1">
                                <i className="bi bi-info-circle me-1"></i>
                                {t("noProductsInFilter") ||
                                  "No products found matching this filter."}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Following */}
            <section>
              <div
                className={`card border-0 shadow-sm rounded-4 ${
                  isDarkMode ? "bg-secondary text-light" : "bg-white"
                }`}
              >
                <div className="card-header border-0 bg-transparent px-4 pt-3 pb-0">
                  <h5 className="mb-1 fw-bold d-flex align-items-center">
                    <i
                      className="bi bi-people me-2"
                      style={{ color: "#FF6A00" }}
                    ></i>
                    {t("following") || "Following"}
                  </h5>
                </div>
                <div className="card-body px-4 pb-4 pt-3">
                  {followedUsers.length === 0 ? (
                    <div className="text-center py-4">
                      <i
                        className="bi bi-person-plus mb-2"
                        style={{ fontSize: "2rem", color: "#FF6A00" }}
                      ></i>
                      <p className="mb-1 fw-semibold">
                        {t("noFollowing") ||
                          "Not following anyone yet."}
                      </p>
                      <p className="text-muted small mb-0">
                        {t("noFollowingHint") ||
                          "Open a product page and tap “Follow seller” to see them here."}
                      </p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {followedUsers.map((follow) => (
                        <div
                          key={follow._id}
                          className="list-group-item border-0 px-0 py-2"
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="d-flex align-items-center justify-content-center rounded-circle"
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  backgroundColor: isDarkMode
                                    ? "#1f1f1f"
                                    : "rgba(255,106,0,0.08)",
                                }}
                              >
                                <i
                                  className="bi bi-person-circle"
                                  style={{ color: "#FF6A00", fontSize: "1.5rem" }}
                                ></i>
                              </div>
                              <div>
                                <div className="d-flex align-items-center gap-2">
                                  <h6 className="mb-0 fw-semibold">
                                    {follow.following?.name || "Unknown User"}
                                  </h6>
                                  {follow.notifyOnNewProducts && (
                                    <span className="badge bg-success">
                                      <i className="bi bi-bell-fill me-1"></i>
                                      {t("notificationsEnabled") ||
                                        "ON"}
                                    </span>
                                  )}
                                </div>
                                <p className="mb-0 text-muted small">
                                  {follow.following?.email}
                                </p>
                              </div>
                            </div>
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => unfollowUser(follow.following?._id)}
                            >
                              {t("unfollow") || "Unfollow"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
