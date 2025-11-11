import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CategoryIcon from "../components/CategoryIcon";
import AuctionCard from "../components/AuctionCard";
import BadgeIcon from "../components/BadgeIcon";
import PaymentModal from "../components/PaymentModal";
import theme from "../theme";
import { api } from "../../src/api";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function HomeScreen() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<"category" | "brand" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [categoriesRes, productsRes] = await Promise.all([
        api.get("/api/category/"),
        api.get("/api/product/products"),
      ]);
      
      // Handle different response formats
      const categoriesData = categoriesRes.data?.data || categoriesRes.data || [];
      const productsData = productsRes.data?.data || productsRes.data || [];
      
      setCategories(categoriesData);
      // Transform products with countdown timer
      const transformedProducts = (productsData || []).map((product: any) => {
        const deadline = product.bidDeadline ? new Date(product.bidDeadline) : null;
        const now = new Date();
        let timeLeft = null;
        
        if (deadline && deadline > now) {
          const diff = deadline.getTime() - now.getTime();
          timeLeft = {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60),
          };
        }

        return {
          id: product._id,
          title: product.title,
          price: product.currentBid || product.price,
          currentBid: product.currentBid,
          image: product.images?.[0]?.url || null,
          bidDeadline: product.bidDeadline,
          timeLeft,
          bids: product.bids?.length || 0,
          product: product, // Keep full product data
        };
      });
      setProducts(transformedProducts);
      
      // Fetch user balance if authenticated
      try {
        const balanceRes = await api.get("/api/users/userbalance");
        setUserBalance(balanceRes.data?.balance || 0);
      } catch (err) {
        // Not authenticated or error - ignore
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load data");
      Alert.alert(
        "Error",
        "Failed to load auction data. Please check your connection.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const filtered = selectedCategory
    ? products.filter((p) => {
        // Find the selected category to compare by title
        const selectedCat = categories.find(c => (c._id || c.id) === selectedCategory);
        return p.product?.category === selectedCat?.title || p.product?.category === selectedCat?.titleMn;
      })
    : query
    ? products.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()))
    : products;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.brand600} />
          <Text style={styles.loadingText}>Loading auctions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && products.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      {/* 🔍 Search bar + icons */}
      <View style={styles.searchBarContainer}>
        <View style={{ flex: 1, position: "relative" }}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              placeholder="Search anything..."
              placeholderTextColor="#999"
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => setDropdownOpen(false)}
              returnKeyType="search"
            />
            <Ionicons name="chevron-down" size={18} color="#999" />
          </View>

          {/* Dropdown under input */}
          {dropdownOpen && (
            <View style={styles.dropdown}>
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    searchMode === "category" && styles.tabActive,
                  ]}
                  onPress={() => setSearchMode("category")}
                >
                  <Ionicons 
                    name="grid-outline" 
                    size={16} 
                    color={searchMode === "category" ? "#fff" : theme.gray700} 
                  />
                  <Text style={searchMode === "category" ? styles.tabTextActive : styles.tabText}>Category</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tab,
                    searchMode === "brand" && styles.tabActive,
                  ]}
                  onPress={() => setSearchMode("brand")}
                >
                  <Ionicons 
                    name="pricetag-outline" 
                    size={16} 
                    color={searchMode === "brand" ? "#fff" : theme.gray700} 
                  />
                  <Text style={searchMode === "brand" ? styles.tabTextActive : styles.tabText}>Brand</Text>
                </TouchableOpacity>
              </View>

              {searchMode === "category" && (
                <CategoryBrowser
                  data={categories}
                  onSelect={(c) => {
                    setSelectedCategory(c);
                    setDropdownOpen(false);
                  }}
                />
              )}

              {searchMode === "brand" && (
                <View style={{ padding: 12 }}>
                  <Text style={{ color: "#aaa" }}>Brand search coming soon</Text>
                </View>
              )}
            </View>
          )}
        </View>

      </View>

      {/* 🛍️ Scrollable content */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand600} />
        }
      >
        {/* Categories - Show only parent categories */}
        {!selectedCategory && categories.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Категориор хайх</Text>
            <FlatList
              data={categories.filter(cat => !cat.parent).slice(0, 8)}
              horizontal
              keyExtractor={(item) => item._id || item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <CategoryIcon
                  title={item.titleMn || item.title || item.name}
                  image={item.image ? { uri: item.image } : null}
                  icon={item.icon || "cube-outline"}
                  onPress={() => setSelectedCategory(item._id || item.id)}
                />
              )}
              contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 10 }}
            />
          </>
        )}

        {/* Category Filter Chip - Show when category is selected */}
        {selectedCategory && (
          <View style={styles.filterChipContainer}>
            <View style={styles.filterChip}>
              <Ionicons name="funnel" size={16} color={theme.brand600} />
              <Text style={styles.filterChipText}>
                {categories.find(c => (c._id || c.id) === selectedCategory)?.titleMn || "Категори"}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                style={styles.filterChipClose}
              >
                <Ionicons name="close-circle" size={20} color={theme.brand600} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>
              {selectedCategory ? "Категорийн зарууд" : "Бүх зарууд"}
            </Text>
            <Text style={styles.subtitle}>
              {filtered.length} {filtered.length === 1 ? "зар" : "зар"} олдлоо
            </Text>
          </View>
          <TouchableOpacity
            style={styles.balanceCard}
            onPress={() => setPaymentModalVisible(true)}
          >
            <Text style={styles.balanceLabel}>Үлдэгдэл</Text>
            <Text style={styles.balanceAmount}>₮{userBalance.toLocaleString()}</Text>
          </TouchableOpacity>
        </View>

        {/* Auction Products */}
        {filtered.length > 0 ? (
          <View style={styles.auctionsList}>
            {filtered.map((p) => (
              <AuctionCard
                key={p.id}
                product={p}
                onPress={() => {
                  // Navigate to product detail
                  router.push(`/product/${p.id}`);
                }}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="infinite-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>
              {query ? "No products found matching your search" : "No products available"}
            </Text>
            {query && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Text style={styles.clearSearchText}>Clear search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        amount={5000}
        onSuccess={() => {
          setPaymentModalVisible(false);
          fetchData(); // Refresh balance
        }}
      />
    </SafeAreaView>
  );
}

/* ---------- Category Browser (Hierarchical like Mercari JP) ---------- */
function CategoryBrowser({
  data,
  onSelect,
}: {
  data: any[];
  onSelect: (id: string) => void;
}) {
  const [currentLevel, setCurrentLevel] = useState<any[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize with parent categories (no parent field)
  useEffect(() => {
    if (data && data.length > 0) {
      const parents = data.filter(cat => !cat.parent);
      setCurrentLevel(parents);
    }
  }, [data]);

  const handleCategoryClick = async (category: any) => {
    setLoading(true);
    try {
      // Check if this category has children
      const response = await api.get(`/api/category/`);
      const allCategories = response.data?.data || response.data || [];
      const children = allCategories.filter((cat: any) => cat.parent === (category._id || category.id));

      if (children.length > 0) {
        // Has children - navigate deeper
        setCurrentLevel(children);
        setBreadcrumb([...breadcrumb, category]);
      } else {
        // Leaf category - select it
        onSelect(category._id || category.id);
        // Reset navigation
        setCurrentLevel(data.filter(cat => !cat.parent));
        setBreadcrumb([]);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBreadcrumbClick = async (index: number) => {
    if (index === -1) {
      // Back to root
      const parents = data.filter(cat => !cat.parent);
      setCurrentLevel(parents);
      setBreadcrumb([]);
    } else {
      // Navigate to specific breadcrumb level
      const targetCategory = breadcrumb[index];
      setLoading(true);
      try {
        const response = await api.get(`/api/category/`);
        const allCategories = response.data?.data || response.data || [];
        const children = allCategories.filter((cat: any) => cat.parent === (targetCategory._id || targetCategory.id));

        setCurrentLevel(children);
        setBreadcrumb(breadcrumb.slice(0, index + 1));
      } catch (error) {
        console.error("Error navigating breadcrumb:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!data || data.length === 0) {
    return (
      <View style={styles.dropdownList}>
        <Text style={styles.rowText}>Категори байхгүй байна</Text>
      </View>
    );
  }

  return (
    <View style={styles.dropdownList}>
      {/* Breadcrumb Navigation */}
      {breadcrumb.length > 0 && (
        <View style={styles.breadcrumbContainer}>
          <TouchableOpacity
            onPress={() => handleBreadcrumbClick(-1)}
            style={styles.breadcrumbItem}
          >
            <Ionicons name="home-outline" size={14} color={theme.brand600} />
            <Text style={styles.breadcrumbText}>Бүгд</Text>
          </TouchableOpacity>
          {breadcrumb.map((cat, index) => (
            <View key={cat._id || cat.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="chevron-forward" size={12} color="#999" style={{ marginHorizontal: 4 }} />
              <TouchableOpacity
                onPress={() => handleBreadcrumbClick(index)}
                style={styles.breadcrumbItem}
              >
                <Text style={[
                  styles.breadcrumbText,
                  index === breadcrumb.length - 1 && styles.breadcrumbTextActive
                ]}>
                  {cat.titleMn || cat.title}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Category List */}
      {loading ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={theme.brand600} />
        </View>
      ) : (
        <>
          {currentLevel.map((cat) => (
            <TouchableOpacity
              key={cat._id || cat.id}
              style={styles.row}
              onPress={() => handleCategoryClick(cat)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={cat.icon || "cube-outline"} size={18} color={theme.brand600} />
                <Text style={styles.rowText}>{cat.titleMn || cat.title || cat.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#aaa" />
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingBottom: 100 },
  sectionTitle: {
    color: theme.gray900,
    fontSize: 20,
    fontWeight: "700",
    marginHorizontal: 16,
    marginVertical: 12,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.gray100,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.gray200,
  },
  input: {
    flex: 1,
    color: theme.gray900,
    fontSize: 15,
    paddingLeft: 8,
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginTop: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.gray200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tabRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.gray100,
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  tabActive: { backgroundColor: theme.brand600 },
  tabText: { color: theme.gray900, fontWeight: "600" },
  tabTextActive: { color: "#fff", fontWeight: "600" },
  dropdownList: { paddingHorizontal: 14 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomColor: theme.gray200,
    borderBottomWidth: 1,
  },
  rowText: { color: theme.gray900, fontSize: 15 },
  backRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  backText: { color: theme.gray900, marginLeft: 6, fontWeight: "600" },
  breadcrumbContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: theme.gray50,
    borderRadius: 8,
    marginBottom: 8,
  },
  breadcrumbItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  breadcrumbText: {
    fontSize: 13,
    color: theme.brand600,
    fontWeight: "500",
  },
  breadcrumbTextActive: {
    fontWeight: "700",
    color: theme.brand700,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  filterChipContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.brand100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 6,
  },
  filterChipText: {
    color: theme.brand700,
    fontSize: 14,
    fontWeight: "600",
  },
  filterChipClose: {
    marginLeft: 4,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 13,
    color: theme.gray500,
    marginTop: 4,
  },
  balanceCard: {
    backgroundColor: theme.brand600,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 11,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  auctionsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    color: theme.gray700,
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: "#ff6b6b",
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.brand600,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#999",
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  clearSearchText: {
    color: theme.brand600,
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },
});
