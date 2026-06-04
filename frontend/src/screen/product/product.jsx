import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiSearch, FiFilter, FiX, FiGrid, FiList, FiChevronDown,
  FiChevronUp, FiShoppingBag, FiClock, FiTag, FiSliders,
} from "react-icons/fi";
import { SavedFilters } from "../../components/SavedFilters";
import { ProductCard } from "../../components/design-system";
import { buildApiUrl } from "../../config/api";

// ── Design tokens (mirrors admin panel) ──────────────────────────────────────
const s = {
  card: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  tag: (bg, color) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    background: bg, color,
    borderRadius: 999, padding: "3px 10px",
    fontSize: 12, fontWeight: 600,
  }),
  btn: (bg, color, border) => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    padding: "9px 18px", borderRadius: 10,
    border: border || "none",
    background: bg, color,
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    transition: "opacity 0.15s",
  }),
  sectionLabel: {
    fontSize: 11, fontWeight: 700, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.08em",
    margin: "0 0 12px",
  },
};

export const Product = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentUserId = useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      const u = stored ? JSON.parse(stored) : null;
      return u?._id || u?.id || null;
    } catch { return null; }
  }, []);

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [openSections, setOpenSections] = useState({
    saved: false, categories: true, brand: true, price: true, specs: true,
  });
  const [specFilters, setSpecFilters] = useState({});
  const [expandedParent, setExpandedParent] = useState(null); // which parent category is open
  const productsPerPage = 24;

  // Parent categories (no parent field)
  const parentCategories = useMemo(() =>
    categories.filter(c => !c.parent),
  [categories]);

  // Children of a given parent ID
  const getChildren = (parentId) =>
    categories.filter(c => {
      const pid = typeof c.parent === "object" ? c.parent?._id?.toString() : c.parent?.toString();
      return pid === parentId;
    });

  // fieldSchema for the active category (selected cat or its parent if child selected)
  const activeCategorySchema = useMemo(() => {
    const id = selectedCategories[0];
    if (!id) return [];
    const cat = categories.find(c => c._id === id);
    if (!cat) return [];
    // If it's a child with no schema, check parent
    const schema = cat.fieldSchema?.filter(f => f.filterable) || [];
    if (schema.length > 0) return schema;
    const parentId = typeof cat.parent === "object" ? cat.parent?._id?.toString() : cat.parent?.toString();
    if (parentId) {
      const parent = categories.find(c => c._id === parentId);
      return parent?.fieldSchema?.filter(f => f.filterable) || [];
    }
    return [];
  }, [selectedCategories, categories]);

  // ── Data fetching ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, categoriesResponse, brandsResponse] = await Promise.all([
          axios.get(buildApiUrl("/api/product/products")),
          axios.get(buildApiUrl("/api/category/")),
          axios.get(buildApiUrl("/api/brand/")).catch(() => ({ data: [] })),
        ]);
        const productList = Array.isArray(productsResponse.data)
          ? productsResponse.data : productsResponse.data?.data || [];
        const categoryList = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data : categoriesResponse.data?.data || [];
        const brandList = Array.isArray(brandsResponse.data)
          ? brandsResponse.data : brandsResponse.data?.data || [];
        setProducts(productList);
        setCategories(categoryList);
        setBrands(brandList);
        const params = new URLSearchParams(location.search);
        const searchParam = params.get("search");
        const categoryParam = params.get("category");
        const brandParam = params.get("brand");
        if (searchParam) setSearchQuery(searchParam);
        if (categoryParam) {
          setSelectedCategory(categoryParam);
          setSelectedCategories([categoryParam]);
        }
        if (brandParam) setSpecFilters(prev => ({ ...prev, brand: brandParam }));
      } catch (err) {
        setError(err.message || "Бүтээгдэхүүн ачаалахад алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location.search]);

  // ── Filter + sort logic ───────────────────────────────────────────────────

  // Read a spec value from itemSpecifics first, then fall back to legacy top-level field.
  // Handles products created before and after the itemSpecifics migration.
  const getSpec = (p, key) => {
    const fromSpecs = p.itemSpecifics?.[key];
    if (fromSpecs != null && fromSpecs !== "") return String(fromSpecs);
    const fromTop = p[key];
    if (fromTop != null && fromTop !== "") return String(fromTop);
    return null;
  };

  useEffect(() => {
    let result = [...products];

    // Never show the logged-in user's own listings in the browse feed
    if (currentUserId) {
      result = result.filter((p) => {
        const ownerId = typeof p.user === "object" && p.user !== null ? p.user._id : p.user;
        return ownerId?.toString() !== currentUserId.toString();
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }

    // Category filter — expand selected IDs to include their subcategories
    const activeCatIds = new Set();
    if (selectedCategories.length > 0 || selectedCategory !== "all") {
      const rootIds = selectedCategories.length > 0
        ? selectedCategories
        : [selectedCategory];
      rootIds.forEach(id => activeCatIds.add(id));
      // Add subcategories of each selected ID
      categories.forEach(cat => {
        const parentId = typeof cat.parent === "object"
          ? cat.parent?._id?.toString()
          : cat.parent?.toString();
        if (parentId && activeCatIds.has(parentId)) activeCatIds.add(cat._id?.toString());
      });
    }
    if (activeCatIds.size > 0) {
      result = result.filter((p) => {
        const catId = typeof p.category === "object" && p.category !== null
          ? p.category._id?.toString()
          : p.category?.toString();
        return activeCatIds.has(catId);
      });
    }

    if (selectedBrands.length > 0) {
      result = result.filter((p) => {
        const brandId = typeof p.brand === "object" && p.brand !== null ? p.brand._id : p.brand;
        return selectedBrands.includes(brandId?.toString());
      });
    } else if (selectedBrand !== "all") {
      result = result.filter((p) => {
        const brandId = typeof p.brand === "object" && p.brand !== null ? p.brand._id : p.brand;
        return brandId?.toString() === selectedBrand.toString();
      });
    }

    if (priceRange.min !== "") {
      result = result.filter((p) => (p.currentBid || p.price || 0) >= Number(priceRange.min));
    }
    if (priceRange.max !== "") {
      result = result.filter((p) => (p.currentBid || p.price || 0) <= Number(priceRange.max));
    }

    // Category-specific spec filters — check itemSpecifics AND legacy top-level fields
    for (const [key, value] of Object.entries(specFilters)) {
      if (!value || value === "") continue;
      if (key.endsWith("_min")) {
        const field = key.slice(0, -4);
        result = result.filter(p => {
          const v = getSpec(p, field);
          return v != null && parseFloat(v) >= parseFloat(value);
        });
      } else if (key.endsWith("_max")) {
        const field = key.slice(0, -4);
        result = result.filter(p => {
          const v = getSpec(p, field);
          return v != null && parseFloat(v) <= parseFloat(value);
        });
      } else {
        result = result.filter(p => {
          const v = getSpec(p, key);
          return v != null && v.toLowerCase().includes(value.toLowerCase());
        });
      }
    }
    result.sort((a, b) => {
      switch (sortOption) {
        case "newest":     return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":     return new Date(a.createdAt) - new Date(b.createdAt);
        case "price-low":  return (a.currentBid || a.price || 0) - (b.currentBid || b.price || 0);
        case "price-high": return (b.currentBid || b.price || 0) - (a.currentBid || a.price || 0);
        case "ending-soon":return new Date(a.bidDeadline) - new Date(b.bidDeadline);
        default: return 0;
      }
    });
    setFiltered(result);
    setCurrentPage(1);
  }, [products, categories, searchQuery, selectedCategory, selectedCategories, selectedBrand, selectedBrands, priceRange, specFilters, sortOption, currentUserId]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLoadFilter = (loaded) => {
    if (loaded.selectedCategories) {
      setSelectedCategories(loaded.selectedCategories);
      setSelectedCategory(loaded.selectedCategories[0] || "all");
    }
    if (loaded.selectedBrands) {
      setSelectedBrands(loaded.selectedBrands);
      setSelectedBrand(loaded.selectedBrands[0] || "all");
    }
    if (loaded.priceMin || loaded.priceMax) {
      setPriceRange({ min: loaded.priceMin || "", max: loaded.priceMax || "" });
    }
  };

  const toggleCategory = (id) => {
    setSearchQuery("");
    if (id === "all") { setSelectedCategory("all"); setSelectedCategories([]); return; }
    setSelectedCategory(id);
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleBrand = (id) => {
    setSearchQuery("");
    if (id === "all") { setSelectedBrand("all"); setSelectedBrands([]); return; }
    setSelectedBrand(id);
    setSelectedBrands((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      setSelectedCategory("all"); setSelectedCategories([]);
      setSelectedBrand("all"); setSelectedBrands([]);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery(""); setSelectedCategory("all"); setSelectedCategories([]);
    setSelectedBrand("all"); setSelectedBrands([]);
    setPriceRange({ min: "", max: "" }); setSpecFilters({});
    setExpandedParent(null); setCurrentPage(1);
  };

  const setSpecFilter = (key, value) =>
    setSpecFilters(prev => ({ ...prev, [key]: value }));

  // Single-select a category and reset spec filters
  const selectCategory = (id) => {
    setSelectedCategory(id === "all" ? "all" : id);
    setSelectedCategories(id === "all" ? [] : [id]);
    setSpecFilters({});
    setCurrentPage(1);
    setSearchQuery("");
  };

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Computed ──────────────────────────────────────────────────────────────
  const currentProducts = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage;
    return filtered.slice(start, start + productsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / productsPerPage) || 1;

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

  const activeFilterCount =
    selectedCategories.length + selectedBrands.length +
    (priceRange.min ? 1 : 0) + (priceRange.max ? 1 : 0) +
    Object.values(specFilters).filter(v => v !== "").length;

  const pageTitle = searchQuery
    ? `"${searchQuery}"`
    : selectedCategory !== "all"
    ? categories.find((c) => c._id === selectedCategory)?.titleMn ||
      categories.find((c) => c._id === selectedCategory)?.title ||
      "Ангилал"
    : "Бүх дуудлага";

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid #e2e8f0", borderTopColor: "var(--bn-primary)",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>Ачаалж байна...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 24px" }}>
        <div style={{ ...s.card, padding: 28, textAlign: "center", color: "#dc2626" }}>{error}</div>
      </div>
    );
  }

  // ── Sidebar section component ─────────────────────────────────────────────
  const SidebarSection = ({ title, sectionKey, children }) => (
    <div style={{ ...s.card, overflow: "hidden" }}>
      <button
        onClick={() => toggleSection(sectionKey)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px",
          background: "none", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 700, color: "#0f172a",
        }}
      >
        {title}
        {openSections[sectionKey]
          ? <FiChevronUp size={14} style={{ color: "#94a3b8" }} />
          : <FiChevronDown size={14} style={{ color: "#94a3b8" }} />}
      </button>
      {openSections[sectionKey] && (
        <div style={{ padding: "0 18px 18px" }}>{children}</div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>

      {/* ── Sticky top bar ─────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 64, zIndex: 30,
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 0" }}>

            {/* Search */}
            <div style={{
              position: "relative", flex: 1, maxWidth: 400,
              display: "flex", border: "1.5px solid #e2e8f0",
              borderRadius: 10, overflow: "hidden",
            }}>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                color: "#94a3b8", pointerEvents: "none", display: "flex",
              }}>
                <FiSearch size={15} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Дуудлага хайх..."
                style={{
                  flex: 1, paddingLeft: 36, paddingRight: searchQuery ? 32 : 12,
                  paddingTop: 9, paddingBottom: 9,
                  border: "none", outline: "none",
                  fontSize: 13, color: "#0f172a", background: "#fff",
                  boxSizing: "border-box",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    background: "#f1f5f9", border: "none", cursor: "pointer",
                    borderRadius: "50%", width: 20, height: 20,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#64748b",
                  }}
                >
                  <FiX size={11} />
                </button>
              )}
            </div>

            {/* Sort */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              style={{
                padding: "9px 12px",
                border: "1.5px solid #e2e8f0", borderRadius: 10,
                background: "#fff", outline: "none",
                fontSize: 13, color: "#374151", cursor: "pointer",
              }}
            >
              <option value="newest">Шинэ</option>
              <option value="oldest">Хуучин</option>
              <option value="price-low">Үнэ ↑</option>
              <option value="price-high">Үнэ ↓</option>
              <option value="ending-soon">Дуусах гэж байна</option>
            </select>

            {/* View toggle */}
            <div style={{
              display: "flex", borderRadius: 10, overflow: "hidden",
              border: "1.5px solid #e2e8f0",
            }}>
              {[
                { mode: "grid", Icon: FiGrid },
                { mode: "list", Icon: FiList },
              ].map(({ mode, Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: "8px 12px", border: "none", cursor: "pointer",
                    background: viewMode === mode ? "var(--bn-primary)" : "#fff",
                    color: viewMode === mode ? "#fff" : "#94a3b8",
                    transition: "background 0.15s, color 0.15s",
                    display: "flex", alignItems: "center",
                  }}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                ...s.btn(showFilters ? "var(--bn-primary)" : "#f8fafc", showFilters ? "#fff" : "#374151", showFilters ? "none" : "1.5px solid #e2e8f0"),
                padding: "9px 16px",
              }}
            >
              <FiSliders size={14} />
              Шүүлтүүр
              {activeFilterCount > 0 && (
                <span style={{
                  background: showFilters ? "rgba(255,255,255,0.25)" : "var(--bn-primary)",
                  color: "#fff", borderRadius: 999,
                  fontSize: 11, fontWeight: 700,
                  padding: "1px 6px", lineHeight: 1.5,
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingBottom: 12 }}>
              {selectedCategories.map((catId) => {
                const cat = categories.find((c) => c._id === catId);
                return cat ? (
                  <button
                    key={catId}
                    onClick={() => toggleCategory(catId)}
                    style={{
                      ...s.tag("rgba(79,70,229,0.1)", "var(--bn-primary)"),
                      border: "1px solid rgba(79,70,229,0.2)",
                      cursor: "pointer",
                    }}
                  >
                    {cat.titleMn || cat.title} <FiX size={11} />
                  </button>
                ) : null;
              })}
              {selectedBrands.map((brandId) => {
                const brand = brands.find((b) => b._id === brandId);
                return brand ? (
                  <button
                    key={brandId}
                    onClick={() => toggleBrand(brandId)}
                    style={{
                      ...s.tag("rgba(99,102,241,0.1)", "#6366f1"),
                      border: "1px solid rgba(99,102,241,0.2)",
                      cursor: "pointer",
                    }}
                  >
                    {brand.titleMn || brand.title || brand.name} <FiX size={11} />
                  </button>
                ) : null;
              })}
              {specFilters.brand && (
                <button onClick={() => setSpecFilter("brand", "")}
                  style={{ ...s.tag("rgba(245,158,11,0.1)", "#b45309"), border: "1px solid rgba(245,158,11,0.2)", cursor: "pointer" }}>
                  Брэнд: {specFilters.brand} <FiX size={11} />
                </button>
              )}
              {Object.entries(specFilters).filter(([k, v]) => k !== "brand" && v !== "").map(([key, val]) => (
                <button key={key} onClick={() => setSpecFilter(key, "")}
                  style={{ ...s.tag("rgba(245,158,11,0.1)", "#b45309"), border: "1px solid rgba(245,158,11,0.2)", cursor: "pointer" }}>
                  {key}: {val} <FiX size={11} />
                </button>
              ))}
              {(priceRange.min || priceRange.max) && (
                <button
                  onClick={() => setPriceRange({ min: "", max: "" })}
                  style={{
                    ...s.tag("rgba(16,185,129,0.1)", "#059669"),
                    border: "1px solid rgba(16,185,129,0.2)",
                    cursor: "pointer",
                  }}
                >
                  {priceRange.min ? `₮${Number(priceRange.min).toLocaleString()}` : "0"} –{" "}
                  {priceRange.max ? `₮${Number(priceRange.max).toLocaleString()}` : "∞"}
                  <FiX size={11} />
                </button>
              )}
              <button
                onClick={handleClearFilters}
                style={{
                  ...s.tag("#f1f5f9", "#64748b"),
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                }}
              >
                Бүгдийг арилгах
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 28px 60px" }}>
        <div style={{ display: "flex", gap: 22, alignItems: "flex-start" }}>

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          {showFilters && (
            <aside style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Saved Filters */}
              <SidebarSection title="Хадгалсан шүүлтүүр" sectionKey="saved">
                <SavedFilters
                  onLoad={handleLoadFilter}
                  currentFilters={{
                    selectedCategories, selectedBrands,
                    priceMin: priceRange.min, priceMax: priceRange.max,
                  }}
                />
              </SidebarSection>

              {/* Categories — hierarchical accordion */}
              <SidebarSection title="Ангилал" sectionKey="categories">
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>

                  {/* All */}
                  <button onClick={() => { selectCategory("all"); setExpandedParent(null); }}
                    style={{ textAlign: "left", padding: "7px 10px", borderRadius: 8, fontSize: 13, fontWeight: selectedCategories.length === 0 ? 700 : 500, cursor: "pointer", border: "none", background: selectedCategories.length === 0 ? "#eff6ff" : "transparent", color: selectedCategories.length === 0 ? "var(--bn-primary)" : "#475569" }}>
                    Бүгд
                  </button>

                  {parentCategories.map(parent => {
                    const children = getChildren(parent._id);
                    const isParentSelected = selectedCategories.includes(parent._id);
                    const isChildSelected = children.some(c => selectedCategories.includes(c._id));
                    const isExpanded = expandedParent === parent._id;
                    const isHighlighted = isParentSelected || isChildSelected;

                    return (
                      <div key={parent._id}>
                        {/* Parent row */}
                        <button
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedParent(null);
                            } else {
                              setExpandedParent(parent._id);
                              selectCategory(parent._id);
                            }
                          }}
                          style={{ width: "100%", textAlign: "left", padding: "7px 10px", borderRadius: 8, fontSize: 13, fontWeight: isHighlighted ? 700 : 500, cursor: "pointer", border: "none", background: isParentSelected ? "#eff6ff" : "transparent", color: isHighlighted ? "var(--bn-primary)" : "#475569", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        >
                          <span>{parent.titleMn || parent.title}</span>
                          {children.length > 0 && (
                            <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 4, flexShrink: 0 }}>
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          )}
                        </button>

                        {/* Children */}
                        {isExpanded && children.length > 0 && (
                          <div style={{ paddingLeft: 14, display: "flex", flexDirection: "column", gap: 1, marginBottom: 4 }}>
                            {children.map(child => {
                              const isSelected = selectedCategories.includes(child._id);
                              return (
                                <button key={child._id}
                                  onClick={() => selectCategory(child._id)}
                                  style={{ textAlign: "left", padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: isSelected ? 700 : 400, cursor: "pointer", border: "none", background: isSelected ? "#eff6ff" : "transparent", color: isSelected ? "var(--bn-primary)" : "#64748b" }}>
                                  {child.titleMn || child.title}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SidebarSection>

              {/* Brands */}
              {brands.length > 0 && (
                <SidebarSection title="Брэнд" sectionKey="brands">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <button
                      onClick={() => toggleBrand("all")}
                      style={{
                        padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", border: "1.5px solid",
                        background: selectedBrands.length === 0 ? "#6366f1" : "transparent",
                        color: selectedBrands.length === 0 ? "#fff" : "#64748b",
                        borderColor: selectedBrands.length === 0 ? "#6366f1" : "#e2e8f0",
                        transition: "all 0.15s",
                      }}
                    >
                      Бүгд
                    </button>
                    {brands.map((brand) => {
                      const isActive = selectedBrands.includes(brand._id) || selectedBrand === brand._id;
                      return (
                        <button
                          key={brand._id}
                          onClick={() => toggleBrand(brand._id)}
                          style={{
                            padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                            cursor: "pointer", border: "1.5px solid",
                            background: isActive ? "#6366f1" : "transparent",
                            color: isActive ? "#fff" : "#64748b",
                            borderColor: isActive ? "#6366f1" : "#e2e8f0",
                            transition: "all 0.15s",
                          }}
                        >
                          {brand.title || brand.titleMn || brand.name}
                        </button>
                      );
                    })}
                  </div>
                </SidebarSection>
              )}

              {/* Price Range */}
              {/* Brand — always visible, works across all categories */}
              <SidebarSection title="Брэнд" sectionKey="brand">
                <input
                  type="text"
                  placeholder="Брэнд хайх..."
                  value={specFilters.brand || ""}
                  onChange={e => setSpecFilter("brand", e.target.value)}
                  style={{
                    width: "100%", padding: "8px 10px",
                    border: "1.5px solid #e2e8f0", borderRadius: 8,
                    background: "#f8fafc", outline: "none",
                    fontSize: 13, color: "#0f172a", boxSizing: "border-box",
                  }}
                />
                {specFilters.brand && (
                  <button
                    onClick={() => setSpecFilter("brand", "")}
                    style={{ marginTop: 6, fontSize: 11, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    ✕ Арилгах
                  </button>
                )}
              </SidebarSection>

              <SidebarSection title="Үнийн хязгаар" sectionKey="price">
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { key: "min", placeholder: "Хамгийн бага ₮" },
                    { key: "max", placeholder: "Хамгийн их ₮" },
                  ].map(({ key, placeholder }) => (
                    <input
                      key={key}
                      type="number"
                      placeholder={placeholder}
                      value={priceRange[key]}
                      onChange={(e) =>
                        setPriceRange((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      style={{
                        flex: 1, padding: "8px 10px",
                        border: "1.5px solid #e2e8f0", borderRadius: 8,
                        background: "#f8fafc", outline: "none",
                        fontSize: 13, color: "#0f172a", boxSizing: "border-box",
                      }}
                    />
                  ))}
                </div>
              </SidebarSection>

              {/* Category-specific filters — appear automatically when a category with fieldSchema is selected */}
              {activeCategorySchema.length > 0 && (
                <SidebarSection title="Дэлгэрэнгүй шүүлтүүр" sectionKey="specs">
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {activeCategorySchema.map(field => {
                      const inputBase = { width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, background: "#f8fafc", outline: "none", fontSize: 13, color: "#0f172a", boxSizing: "border-box" };
                      return (
                        <div key={field.key}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{field.labelMn}{field.unit && ` (${field.unit})`}</div>
                          {field.filterType === "range" ? (
                            <div style={{ display: "flex", gap: 6 }}>
                              <input type="number" placeholder="Доод" value={specFilters[`${field.key}_min`] || ""}
                                onChange={e => setSpecFilter(`${field.key}_min`, e.target.value)}
                                style={{ ...inputBase, flex: 1 }} />
                              <input type="number" placeholder="Дээд" value={specFilters[`${field.key}_max`] || ""}
                                onChange={e => setSpecFilter(`${field.key}_max`, e.target.value)}
                                style={{ ...inputBase, flex: 1 }} />
                            </div>
                          ) : field.filterType === "select" ? (
                            <select value={specFilters[field.key] || ""} onChange={e => setSpecFilter(field.key, e.target.value)} style={inputBase}>
                              <option value="">Бүгд</option>
                              {(field.options || []).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.labelMn}</option>
                              ))}
                            </select>
                          ) : (
                            <input type="text" placeholder={field.labelMn} value={specFilters[field.key] || ""}
                              onChange={e => setSpecFilter(field.key, e.target.value)} style={inputBase} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </SidebarSection>
              )}

              <button
                onClick={handleClearFilters}
                style={{
                  ...s.btn("transparent", "#64748b", "1.5px solid #e2e8f0"),
                  width: "100%", padding: "10px",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                Шүүлтүүр арилгах
              </button>
            </aside>
          )}

          {/* ── Results ──────────────────────────────────────────────── */}
          <section style={{ flex: 1, minWidth: 0 }}>

            {/* Results header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 3px" }}>
                  {pageTitle}
                </h1>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                  {filtered.length.toLocaleString()} бараа
                  {currentPage > 1 && ` · ${currentPage}/${totalPages} хуудас`}
                </p>
              </div>
              {/* Stat chips */}
              <div style={{ display: "flex", gap: 8 }}>
                <span style={s.tag("#eff6ff", "#3b82f6")}>
                  <FiShoppingBag size={11} /> {products.length} нийт
                </span>
                <span style={s.tag("#fffbeb", "#f59e0b")}>
                  <FiClock size={11} /> Одоо явагдаж байна
                </span>
              </div>
            </div>

            {/* Grid or List */}
            {currentProducts.length > 0 ? (
              viewMode === "grid" ? (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 16,
                }}>
                  {currentProducts.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      formatPrice={formatPrice}
                      formatTimeLeft={formatTimeLeft}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {currentProducts.map((product) => (
                    <ProductCard
                      key={product._id}
                      variant="list"
                      product={product}
                      formatPrice={formatPrice}
                      formatTimeLeft={formatTimeLeft}
                    />
                  ))}
                </div>
              )
            ) : (
              /* Empty state */
              <div style={{ ...s.card, padding: "60px 24px", textAlign: "center" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "#f1f5f9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 18px",
                }}>
                  <FiSearch size={28} style={{ color: "#94a3b8" }} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
                  Зүйл олдсонгүй
                </h3>
                <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 22px" }}>
                  Өөр түлхүүр үг хайж эсвэл шүүлтүүрийг өөрчилнө үү.
                </p>
                <button
                  onClick={handleClearFilters}
                  style={s.btn("var(--bn-primary)", "#fff")}
                >
                  Шүүлтүүр арилгах
                </button>
              </div>
            )}

            {/* Pagination */}
            {filtered.length > productsPerPage && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 4, marginTop: 36,
              }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "#fff", border: "1.5px solid #e2e8f0",
                    color: "#64748b", fontSize: 16, cursor: "pointer",
                    opacity: currentPage === 1 ? 0.4 : 1,
                  }}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pg = idx + 1;
                  if (totalPages > 7) {
                    const start = Math.max(1, currentPage - 2);
                    const end = Math.min(totalPages, start + 4);
                    if (pg < start || pg > end) return null;
                  }
                  const isActive = currentPage === pg;
                  return (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      style={{
                        width: 36, height: 36, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isActive ? "var(--bn-primary)" : "#fff",
                        border: isActive ? "none" : "1.5px solid #e2e8f0",
                        color: isActive ? "#fff" : "#64748b",
                        fontSize: 13, fontWeight: isActive ? 700 : 400,
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "#fff", border: "1.5px solid #e2e8f0",
                    color: "#64748b", fontSize: 16, cursor: "pointer",
                    opacity: currentPage === totalPages ? 0.4 : 1,
                  }}
                >
                  ›
                </button>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
};

export default Product;
