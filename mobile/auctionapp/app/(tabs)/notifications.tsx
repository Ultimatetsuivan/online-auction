import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProductCard from "../components/ProductCard";
import theme from "../theme";
import { api } from "../../src/api";

export default function MyListScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedProducts, setLikedProducts] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<"liked" | "filters">("liked");

  useFocusEffect(
    useCallback(() => {
      loadUserAndLikedProducts();
    }, [])
  );

  const loadUserAndLikedProducts = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        await fetchLikedProducts(parsedUser._id || parsedUser.id);
      }
    } catch (error) {
      console.error("Error loading liked products:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchLikedProducts = async (userId: string) => {
    try {
      // Get liked product IDs from AsyncStorage
      const likedProductsKey = `likedProducts_${userId}`;
      const likedIds = await AsyncStorage.getItem(likedProductsKey);

      if (!likedIds) {
        setLikedProducts([]);
        return;
      }

      const likedProductIds = JSON.parse(likedIds);

      if (likedProductIds.length === 0) {
        setLikedProducts([]);
        return;
      }

      // Fetch all products
      const response = await api.get("/api/product/products");
      const allProducts = response.data?.data || response.data || [];

      // Filter products that are in the liked list
      const liked = allProducts.filter((product: any) =>
        likedProductIds.includes(product._id)
      );

      // Transform products
      const transformedProducts = liked.map((product: any) => ({
        id: product._id,
        title: product.title,
        price: product.currentBid || product.price,
        image: product.images?.[0]?.url || null,
        sold: product.sold,
        available: product.available,
        bids: product.bids?.length || 0,
      }));

      setLikedProducts(transformedProducts);
    } catch (error) {
      console.error("Error fetching liked products:", error);
      setLikedProducts([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserAndLikedProducts();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.brand600} />
          <Text style={styles.loadingText}>Ачаалж байна...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.guestContainer}>
          <View style={styles.guestContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="heart-outline" size={64} color={theme.brand600} />
            </View>
            <Text style={styles.guestTitle}>Нэвтрэх шаардлагатай</Text>
            <Text style={styles.guestSubtitle}>
              Таалагдсан зарууд харахын тулд нэвтэрнэ үү
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push("/(hidden)/login")}
            >
              <Text style={styles.loginButtonText}>Нэвтрэх</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="heart" size={24} color={theme.brand600} />
          <Text style={styles.headerTitle}>Миний жагсаалт</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "liked" && styles.tabActive]}
          onPress={() => setSelectedTab("liked")}
        >
          <Ionicons
            name="heart"
            size={18}
            color={selectedTab === "liked" ? theme.brand600 : theme.gray500}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === "liked" && styles.tabTextActive,
            ]}
          >
            Таалагдсан ({likedProducts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === "filters" && styles.tabActive]}
          onPress={() => setSelectedTab("filters")}
        >
          <Ionicons
            name="funnel"
            size={18}
            color={selectedTab === "filters" ? theme.brand600 : theme.gray500}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === "filters" && styles.tabTextActive,
            ]}
          >
            Хадгалсан шүүлтүүр
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.brand600}
          />
        }
      >
        {selectedTab === "liked" ? (
          likedProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {likedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => router.push(`/product/${product.id}`)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={64} color={theme.gray300} />
              <Text style={styles.emptyTitle}>Таалагдсан зар байхгүй</Text>
              <Text style={styles.emptySubtitle}>
                Зарын зүрх дээр дарж таалагдсан зарууддаа нэмээрэй
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push("/(tabs)/")}
              >
                <Text style={styles.browseButtonText}>Зар үзэх</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="funnel-outline" size={64} color={theme.gray300} />
            <Text style={styles.emptyTitle}>Хадгалсан шүүлтүүр байхгүй</Text>
            <Text style={styles.emptySubtitle}>
              Хайлтын шүүлтүүрээ хадгалаад дараа дахин ашиглаарай
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.gray50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray200,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.gray900,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: theme.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray200,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.gray100,
    gap: 6,
  },
  tabActive: {
    backgroundColor: theme.brand50,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.gray500,
  },
  tabTextActive: {
    color: theme.brand600,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 16,
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
  guestContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  guestContent: {
    alignItems: "center",
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.brand100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.gray900,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: theme.gray500,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  loginButton: {
    width: "100%",
    backgroundColor: theme.brand600,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.white,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.gray700,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.gray500,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: theme.brand600,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: theme.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
