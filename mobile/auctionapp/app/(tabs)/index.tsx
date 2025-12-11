import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import CategoryIcon from "../components/CategoryIcon";
import AuctionCard from "../components/AuctionCard";
import BadgeIcon from "../components/BadgeIcon";
import PaymentModal from "../components/PaymentModal";
import { ProductCardSkeleton } from "../../src/components/SkeletonLoader";
import { useDebounce } from "../../src/hooks/useDebounce";
import theme from "../theme";
import { api } from "../../src/api";
import { useTheme } from "../../src/contexts/ThemeContext";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function HomeScreen() {
  const router = useRouter();
  const { isDarkMode, themeColors } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

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
    loadSearchHistory();
    loadRecentlyViewed();
  }, [fetchData]);

  // Load search history from AsyncStorage
  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  // Load recently viewed products from AsyncStorage
  const loadRecentlyViewed = async () => {
    try {
      const viewed = await AsyncStorage.getItem('recentlyViewed');
      if (viewed) {
        setRecentlyViewed(JSON.parse(viewed));
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  };

  // Save search to history
  const saveSearchToHistory = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    try {
      const trimmedSearch = searchTerm.trim();
      let updatedHistory = [trimmedSearch, ...searchHistory.filter(item => item !== trimmedSearch)];
      updatedHistory = updatedHistory.slice(0, 10); // Keep only last 10 searches

      await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      setSearchHistory(updatedHistory);
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  // Clear all search history
  const clearSearchHistory = async () => {
    try {
      await AsyncStorage.removeItem('searchHistory');
      setSearchHistory([]);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  // Save product to recently viewed
  const saveToRecentlyViewed = async (product: any) => {
    try {
      let updatedViewed = [product, ...recentlyViewed.filter(item => item.id !== product.id)];
      updatedViewed = updatedViewed.slice(0, 10); // Keep only last 10 viewed

      await AsyncStorage.setItem('recentlyViewed', JSON.stringify(updatedViewed));
      setRecentlyViewed(updatedViewed);
    } catch (error) {
      console.error('Error saving recently viewed:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Memoize filtered products for better performance
  const filtered = useMemo(() => {
    let result = products;

    // Filter by category
    if (selectedCategory) {
      const selectedCat = categories.find(c => (c._id || c.id) === selectedCategory);
      result = result.filter((p) => {
        return p.product?.category === selectedCat?.title || 
               p.product?.category === selectedCat?.titleMn ||
               (typeof p.product?.category === 'object' && p.product?.category?._id === selectedCategory);
      });
    }

    // Filter by search query (using debounced query)
    if (debouncedQuery) {
      const queryLower = debouncedQuery.toLowerCase();
      result = result.filter((p) => 
        p.title.toLowerCase().includes(queryLower)
      );
    }

    return result;
  }, [products, selectedCategory, debouncedQuery, categories]);

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
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      {/* 🔍 Search bar + icons */}
      <View style={styles.searchBarContainer}>
        <View style={{ flex: 1, position: "relative" }}>
          <View style={[styles.searchBar, dropdownOpen && styles.searchBarFocused, {
            backgroundColor: themeColors.inputBg,
            borderColor: dropdownOpen ? theme.brand600 : themeColors.border,
          }]}>
            <Ionicons name="search" size={20} color={dropdownOpen ? theme.brand600 : themeColors.textSecondary} />
            <TextInput
              placeholder="Хайх..."
              placeholderTextColor={themeColors.textSecondary}
              style={[styles.input, { color: themeColors.text }]}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
              onSubmitEditing={() => {
                if (query.trim()) {
                  saveSearchToHistory(query);
                  setDropdownOpen(false);
                }
              }}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery("")}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={themeColors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Dropdown under input */}
          {dropdownOpen && (
            <View style={[styles.dropdown, { 
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border 
            }]}>
              <SearchHistoryDropdown
                searchHistory={searchHistory}
                recentlyViewed={recentlyViewed}
                onSearchSelect={(searchTerm) => {
                  setQuery(searchTerm);
                  setDropdownOpen(false);
                }}
                onProductSelect={(product) => {
                  router.push(`/product/${product.id}`);
                  setDropdownOpen(false);
                }}
                onClearHistory={clearSearchHistory}
              />
            </View>
          )}
        </View>

      </View>

      {/* 🛍️ Main Content - FlatList with header (no nested ScrollView) */}
      {loading && !refreshing ? (
        <View style={styles.auctionsList}>
          {[1, 2, 3].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AuctionCard
              product={item}
              onPress={() => {
                saveToRecentlyViewed(item);
                router.push(`/product/${item.id}`);
              }}
            />
          )}
          ListHeaderComponent={
            <>
              {/* Categories - Show only parent categories */}
              {!selectedCategory && categories.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                    Категориор хайх
                  </Text>
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
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                    {selectedCategory ? "Категорийн зарууд" : "Бүх зарууд"}
                  </Text>
                  <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
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
            </>
          }
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand600} />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={5}
          windowSize={10}
          getItemLayout={(data, index) => ({
            length: 300, // Approximate card height
            offset: 300 * index,
            index,
          })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="infinite-outline" size={48} color={themeColors.textSecondary} />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                {debouncedQuery ? "No products found matching your search" : "No products available"}
              </Text>
              {debouncedQuery && (
                <TouchableOpacity onPress={() => setQuery("")}>
                  <Text style={[styles.clearSearchText, { color: theme.brand600 }]}>
                    Clear search
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Floating Action Button - Add Product */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/(hidden)/add-product")}
      >
        <Ionicons name="add" size={28} color={theme.white} />
      </TouchableOpacity>

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

/* ---------- Search History Dropdown ---------- */
function SearchHistoryDropdown({
  searchHistory,
  recentlyViewed,
  onSearchSelect,
  onProductSelect,
  onClearHistory,
}: {
  searchHistory: string[];
  recentlyViewed: any[];
  onSearchSelect: (searchTerm: string) => void;
  onProductSelect: (product: any) => void;
  onClearHistory: () => void;
}) {
  const hasHistory = searchHistory.length > 0 || recentlyViewed.length > 0;

  if (!hasHistory) {
    return (
      <View style={styles.dropdownList}>
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Ionicons name="time-outline" size={32} color={theme.gray400} />
          <Text style={{ color: theme.gray500, marginTop: 8, fontSize: 14 }}>
            Хайлтын түүх байхгүй байна
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
      {/* Search History Section */}
      {searchHistory.length > 0 && (
        <View>
          <View style={styles.historyHeader}>
            <Text style={styles.historyHeaderText}>Хайлтын түүх</Text>
            <TouchableOpacity onPress={onClearHistory}>
              <Text style={styles.clearButton}>Цэвэрлэх</Text>
            </TouchableOpacity>
          </View>
          {searchHistory.map((search, index) => (
            <TouchableOpacity
              key={`search-${index}`}
              style={styles.historyRow}
              onPress={() => onSearchSelect(search)}
            >
              <Ionicons name="time-outline" size={18} color={theme.gray500} />
              <Text style={styles.historyText}>{search}</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.gray400} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <View style={{ marginTop: searchHistory.length > 0 ? 16 : 0 }}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyHeaderText}>Саяхан үзсэн</Text>
          </View>
          {recentlyViewed.map((product, index) => (
            <TouchableOpacity
              key={`viewed-${index}`}
              style={styles.historyRow}
              onPress={() => onProductSelect(product)}
            >
              <Ionicons name="eye-outline" size={18} color={theme.gray500} />
              <View style={{ flex: 1 }}>
                <Text style={styles.historyText} numberOfLines={1}>
                  {product.title}
                </Text>
                <Text style={styles.historyPrice}>₮{product.price?.toLocaleString()}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={theme.gray400} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  sectionTitle: {
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
    backgroundColor: theme.gray50,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: theme.gray200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchBarFocused: {
    borderColor: theme.brand600,
    backgroundColor: theme.white,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  input: {
    flex: 1,
    color: theme.gray900,
    fontSize: 15,
    paddingLeft: 8,
  },
  dropdown: {
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 400,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownList: {
    paddingVertical: 8,
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
    marginTop: 4,
  },
  balanceCard: {
    backgroundColor: theme.brand600,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: theme.brand600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 100,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.brand600,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.brand600,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 3,
    borderColor: theme.white,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.gray50,
  },
  historyHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.gray700,
  },
  clearButton: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.brand600,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray100,
  },
  historyText: {
    flex: 1,
    fontSize: 15,
    color: theme.gray900,
  },
  historyPrice: {
    fontSize: 13,
    color: theme.brand600,
    fontWeight: '600',
    marginTop: 2,
  },
});
