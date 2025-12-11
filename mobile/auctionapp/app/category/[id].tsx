import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import ProductCard from "../components/ProductCard";
import theme from "../theme";
import { api } from "../../src/api";
import { useTheme } from "../../src/contexts/ThemeContext";

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDarkMode, themeColors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);

  const fetchCategoryAndProducts = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all categories to find subcategories
      const allCategoriesResponse = await api.get("/api/category/");
      const allCategories = allCategoriesResponse.data?.data || allCategoriesResponse.data || [];

      // Fetch category details
      const categoryResponse = await api.get(`/api/category/${id}`);
      const currentCategory = categoryResponse.data?.data || categoryResponse.data;
      setCategory(currentCategory);

      // Find all subcategories of the current category
      const subcategories = allCategories.filter((cat: any) => {
        const parentId = cat.parent?._id?.toString() || cat.parent?.toString();
        return parentId && parentId === id.toString();
      });

      const subcategoryIds = subcategories.map((cat: any) =>
        (cat._id || cat.id).toString()
      );

      // Include the current category ID and all its subcategory IDs
      const categoryIdsToMatch = [id.toString(), ...subcategoryIds];

      // Fetch all products
      const productsResponse = await api.get("/api/product/products");
      const allProducts = productsResponse.data?.data || productsResponse.data || [];

      // Get all matching category titles (parent + subcategories)
      const matchingCategoryTitles = [
        ...subcategories.flatMap((cat: any) =>
          [cat.title, cat.titleMn].filter(Boolean)
        ),
      ];

      // Also include parent category titles
      if (currentCategory) {
        if (currentCategory.title) matchingCategoryTitles.push(currentCategory.title);
        if (currentCategory.titleMn) matchingCategoryTitles.push(currentCategory.titleMn);
      }

      // Filter products by category (include parent and all subcategories)
      const filtered = allProducts.filter((product: any) => {
        const productCategory = product.category;

        // If category is an object (populated), check by ID or title
        if (typeof productCategory === 'object' && productCategory !== null) {
          const productCategoryId = (productCategory._id || productCategory.id)?.toString();
          const productCategoryTitle = productCategory.title || productCategory.titleMn;
          return categoryIdsToMatch.includes(productCategoryId) ||
                 matchingCategoryTitles.includes(productCategoryTitle);
        }

        // If category is a string, it could be either:
        // 1. A title string like "Cars"
        // 2. An ObjectId string like "69300b1e3e742bba00fd0cca"
        if (typeof productCategory === 'string') {
          // Check if it matches any ID
          if (categoryIdsToMatch.includes(productCategory)) {
            return true;
          }
          // Check if it matches any title
          if (matchingCategoryTitles.includes(productCategory)) {
            return true;
          }
        }

        return false;
      });

      setProducts(filtered);
    } catch (error) {
      console.error("Error fetching category products:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCategoryAndProducts();
  }, [fetchCategoryAndProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategoryAndProducts();
  };

  const renderProduct = ({ item }: { item: any }) => (
    <ProductCard
      product={{
        id: item._id,
        title: item.title,
        price: item.currentBid || item.price,
        image: item.images?.[0]?.url || null,
        sold: item.sold,
        available: item.available,
        bids: item.bids?.length || 0,
      }}
      onPress={() => router.push(`/product/${item._id}`)}
    />
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.brand600} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            Ачаалж байна...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: themeColors.surface,
        borderBottomColor: themeColors.border 
      }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]} numberOfLines={1}>
          {category?.titleMn || category?.title || "Ангилал"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.brand600}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="albums-outline" size={64} color={themeColors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              Бараа олдсонгүй
            </Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
              Энэ ангилалд одоогоор бараа байхгүй байна
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Буцах</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Results Counter */}
      {products.length > 0 && (
        <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
          <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
            {products.length} бараа олдлоо
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: theme.brand600,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
});
