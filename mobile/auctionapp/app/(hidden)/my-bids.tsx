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

export default function MyBidsScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bids, setBids] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<"active" | "all">("active");

  useFocusEffect(
    useCallback(() => {
      loadUserAndBids();
    }, [])
  );

  const loadUserAndBids = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        await fetchBids();
      }
    } catch (error) {
      console.error("Error loading bids:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBids = async () => {
    try {
      const response = await api.get("/api/bidding/my");
      const bidsData = response.data?.data || response.data || [];
      setBids(bidsData);
    } catch (error) {
      console.error("Error fetching bids:", error);
      setBids([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserAndBids();
  };

  const getFilteredBids = () => {
    // Safety check: ensure bids is always an array
    const safeBids = Array.isArray(bids) ? bids : [];

    if (selectedTab === "active") {
      // Show active bids: not sold AND auction is active
      return safeBids.filter((bid) =>
        !bid.product?.sold &&
        bid.product?.auctionStatus === 'active'
      );
    }
    return safeBids;
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Миний санал</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.guestContainer}>
          <View style={styles.guestContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="hammer-outline" size={64} color={theme.brand600} />
            </View>
            <Text style={styles.guestTitle}>Нэвтрэх шаардлагатай</Text>
            <Text style={styles.guestSubtitle}>
              Өөрийн саналыг харахын тулд нэвтэрнэ үү
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

  const filteredBids = getFilteredBids();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Миний санал</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "active" && styles.tabActive]}
          onPress={() => setSelectedTab("active")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "active" && styles.tabTextActive,
            ]}
          >
            Идэвхтэй ({Array.isArray(bids) ? bids.filter((b) => !b.product?.sold && b.product?.auctionStatus === 'active').length : 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === "all" && styles.tabActive]}
          onPress={() => setSelectedTab("all")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "all" && styles.tabTextActive,
            ]}
          >
            Бүгд ({Array.isArray(bids) ? bids.length : 0})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.brand600}
          />
        }
      >
        {filteredBids.length > 0 ? (
          <View style={styles.bidsContainer}>
            {filteredBids.map((bid) => (
              <View key={bid._id} style={styles.bidItem}>
                <TouchableOpacity
                  style={styles.productSection}
                  onPress={() => router.push(`/product/${bid.product._id}`)}
                >
                  <ProductCard
                    product={{
                      id: bid.product._id,
                      title: bid.product.title,
                      price: bid.product.currentBid || bid.product.price,
                      image: bid.product.images?.[0]?.url || null,
                      sold: bid.product.sold,
                      available: bid.product.available,
                      bids: bid.product.bids?.length || 0,
                    }}
                    onPress={() => router.push(`/product/${bid.product._id}`)}
                  />
                </TouchableOpacity>

                <View style={styles.bidInfo}>
                  <View style={styles.bidRow}>
                    <Text style={styles.bidLabel}>Миний санал:</Text>
                    <Text style={styles.bidAmount}>₮{bid.price.toLocaleString()}</Text>
                  </View>

                  <View style={styles.bidRow}>
                    <Text style={styles.bidLabel}>Огноо:</Text>
                    <Text style={styles.bidDate}>
                      {new Date(bid.createdAt).toLocaleDateString("mn-MN")}
                    </Text>
                  </View>

                  {bid.product.highestBidder?.toString() === user._id?.toString() ||
                  bid.product.highestBidder?.toString() === user.id?.toString() ? (
                    <View style={styles.statusBadge}>
                      <Ionicons name="trophy" size={16} color="#10B981" />
                      <Text style={styles.statusWinning}>Та тэргүүлж байна</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, styles.statusBadgeOutbid]}>
                      <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                      <Text style={styles.statusOutbid}>Давагдсан</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="hammer-outline" size={64} color={theme.gray300} />
            <Text style={styles.emptyTitle}>
              {selectedTab === "active" ? "Идэвхтэй санал байхгүй" : "Санал байхгүй"}
            </Text>
            <Text style={styles.emptySubtitle}>
              Сонирхолтой зар дээр санал өгч эхлээрэй
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push("/(tabs)/")}
            >
              <Text style={styles.browseButtonText}>Зар үзэх</Text>
            </TouchableOpacity>
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.gray100,
    alignItems: "center",
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
  bidsContainer: {
    padding: 16,
  },
  bidItem: {
    backgroundColor: theme.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  productSection: {
    padding: 12,
  },
  bidInfo: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.gray200,
  },
  bidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  bidLabel: {
    fontSize: 14,
    color: theme.gray600,
  },
  bidAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.brand600,
  },
  bidDate: {
    fontSize: 14,
    color: theme.gray700,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#D1FAE5",
    marginTop: 8,
    gap: 6,
  },
  statusBadgeOutbid: {
    backgroundColor: "#FEF3C7",
  },
  statusWinning: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },
  statusOutbid: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F59E0B",
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
