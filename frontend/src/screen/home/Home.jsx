import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { buildApiUrl } from "../../config/api";
import { ProductCard, Container, Badge } from "../../components/design-system";

export const Home = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("all");

  const currentUserId = useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      const u = stored ? JSON.parse(stored) : null;
      return u?._id || u?.id || null;
    } catch { return null; }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, catRes, brandRes] = await Promise.all([
          axios.get(buildApiUrl("/api/product/products")),
          axios.get(buildApiUrl("/api/category/")),
          axios.get(buildApiUrl("/api/brand/")).catch(() => ({ data: [] })),
        ]);

        const productList = Array.isArray(productRes.data) ? productRes.data : productRes.data?.data || [];
        const categoryList = Array.isArray(catRes.data) ? catRes.data : catRes.data?.data || [];
        const brandList = Array.isArray(brandRes.data) ? brandRes.data : brandRes.data?.data || [];

        setProducts(productList.filter(Boolean));
        setCategories(categoryList.filter((c) => c && c._id));
        setBrands(brandList.filter(Boolean));
      } catch (err) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let result = products.filter(Boolean);

    // Never show the logged-in user's own listings in the home feed
    if (currentUserId) {
      result = result.filter((p) => {
        const ownerId = typeof p.user === "object" && p.user !== null ? p.user._id : p.user;
        return ownerId?.toString() !== currentUserId.toString();
      });
    }

    if (selectedCategory !== "all") {
      result = result.filter((p) => {
        const catId = typeof p.category === "object" && p.category !== null ? p.category._id : p.category;
        return catId?.toString() === selectedCategory.toString();
      });
    }

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result;
  }, [products, selectedCategory, currentUserId]);

  const sortedCategories = useMemo(() => {
    const countMap = {};
    products.forEach((p) => {
      if (!p) return;
      const catId = typeof p.category === "object" && p.category !== null ? p.category._id : p.category;
      if (catId) countMap[catId.toString()] = (countMap[catId.toString()] || 0) + 1;
    });
    return [...categories].sort((a, b) => (countMap[b._id.toString()] || 0) - (countMap[a._id.toString()] || 0));
  }, [categories, products]);

  const featured = filtered.filter((p) => p && p._id).slice(0, 24);
  const popular = filtered.filter((p) => p && p._id).slice(0, 12);
  const recent = products.filter((p) => p && p._id).slice(-12).reverse();
  const isCategoryFiltered = selectedCategory !== "all";
  const selectedCategoryName = useMemo(() => {
    if (selectedCategory === "all") return null;
    const match = categories.find((c) => c?._id?.toString() === selectedCategory?.toString());
    return match?.title || match?.titleMn || "Selected category";
  }, [categories, selectedCategory]);

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

  const staggerContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bn-spinner w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-16">
        <div className="text-center bg-red-50 text-bn-danger p-6 rounded-bn-lg">
          {error}
        </div>
      </Container>
    );
  }

  return (
    <div className="bg-bn-bg">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-primary-50/30 py-16 md:py-20">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-5xl font-bold text-bn-text leading-tight"
            >
              Онлайн дуудлага худалдаанд
              <span className="text-bn-primary"> оролцоорой</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 text-lg text-bn-text-secondary"
            >
              Монголын тэргүүлэх онлайн дуудлага худалдааны платформ
            </motion.p>
          </div>
        </Container>
      </section>

      {/* Category Pills */}
      <section className="border-b border-bn-border bg-bn-surface sticky top-[var(--bn-header-height)] z-30">
        <Container>
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === "all"
                  ? "bg-bn-primary text-white"
                  : "bg-bn-bg-secondary text-bn-text-secondary hover:bg-bn-surface-hover"
              }`}
            >
              Бүгд
            </button>
            {sortedCategories.map((cat) =>
              cat ? (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat._id
                      ? "bg-bn-primary text-white"
                      : "bg-bn-bg-secondary text-bn-text-secondary hover:bg-bn-surface-hover"
                  }`}
                >
                  {cat.titleMn || cat.title}
                </button>
              ) : null
            )}
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <Container className="py-8 md:py-12">
        {isCategoryFiltered ? (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-bn-text">{selectedCategoryName}</h2>
              <Badge variant="neutral" size="lg">{filtered.length} бараа</Badge>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            >
              {filtered.length ? (
                filtered.map((p) => (
                  <motion.div key={p._id} variants={staggerItem}>
                    <ProductCard
                      product={p}
                      formatPrice={formatPrice}
                      formatTimeLeft={formatTimeLeft}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-16 text-bn-text-secondary">
                  Энэ ангилалд бараа олдсонгүй.
                </div>
              )}
            </motion.div>
          </section>
        ) : (
          <div className="space-y-12 md:space-y-16">
            {/* Featured */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-bn-text">Танд санал болгох</h2>
                <Link
                  to="/allproduct"
                  className="text-sm font-medium text-bn-primary hover:text-bn-primary-dark transition-colors no-underline"
                >
                  Бүгдийг харах &rarr;
                </Link>
              </div>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              >
                {featured.map((p) => (
                  <motion.div key={p._id} variants={staggerItem}>
                    <ProductCard
                      product={p}
                      formatPrice={formatPrice}
                      formatTimeLeft={formatTimeLeft}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {/* CTA Banner */}
            <section className="bg-gradient-to-r from-bn-primary to-primary-600 rounded-bn-xl p-8 md:p-12 text-white text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Зарах гэж байна уу?</h2>
              <p className="text-white/80 mb-6 max-w-md mx-auto">
                Бараагаа нийтлэн Монгол даяарх олон мянган худалдан авагчдад хүрээрэй.
              </p>
              <button
                onClick={() => navigate('/profile/tab/addProduct')}
                className="px-6 py-3 bg-white text-bn-primary font-semibold rounded-bn-md hover:shadow-soft-lg transition-all"
              >
                Зарах эхлэх
              </button>
            </section>

            {/* Popular Now */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-bn-text">Их эрэлттэй</h2>
              </div>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              >
                {popular.map((p) => (
                  <motion.div key={p._id} variants={staggerItem}>
                    <ProductCard
                      product={p}
                      formatPrice={formatPrice}
                      formatTimeLeft={formatTimeLeft}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {/* New Arrivals */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-bn-text">Шинэ бараанууд</h2>
              </div>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              >
                {recent.map((p) => (
                  <motion.div key={p._id} variants={staggerItem}>
                    <ProductCard
                      product={p}
                      formatPrice={formatPrice}
                      formatTimeLeft={formatTimeLeft}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          </div>
        )}
      </Container>
    </div>
  );
};

export default Home;
