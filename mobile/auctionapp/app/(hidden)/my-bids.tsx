import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "../theme";
import { api } from "../../src/api";
import { useTheme } from "../../src/contexts/ThemeContext";

export default function MyBidsScreen() {
  const { isDarkMode, themeColors } = useTheme();
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
        setUser(JSON.parse(userData));
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
      const bidsData = response.data?.bids || response.data?.data || response.data || [];
      setBids(Array.isArray(bidsData) ? bidsData : []);
    } catch (error) {
      setBids([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserAndBids();
  };

  const safeBids = Array.isArray(bids) ? bids : [];
  const activeBids = safeBids.filter(b => (b.auctionStatus || "").toLowerCase() === "active");
  const winningBids = safeBids.filter(b => b.isLeading === true);
  const outbidBids = safeBids.filter(b => b.isLeading === false && (b.auctionStatus || "").toLowerCase() === "active");
  const filteredBids = selectedTab === "active" ? activeBids : safeBids;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.brand600} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Ачаалж байна...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Миний саналууд</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <View style={[styles.iconCircle, { backgroundColor: theme.brand50 }]}>
            <Ionicons name="hammer-outline" size={56} color={theme.brand600} />
          </View>
          <Text style={[styles.guestTitle, { color: themeColors.text }]}>Нэвтрэх шаардлагатай</Text>
          <Text style={[styles.guestSubtitle, { color: themeColors.textSecondary }]}>
            Бүх боломжуудыг ашиглахын тулд нэвтэрнэ үү
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push("/(hidden)/login")}>
            <Text style={styles.loginButtonText}>Нэвтрэх</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Миний саналууд</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>Дуудлагын үйл ажиллагаа</Text>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand600} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Stat cards */}
        <View style={styles.statsRow}>
          {[
            { label: 'Нийт санал', value: safeBids.length, color: '#64748b', bg: isDarkMode ? '#1e293b' : '#f8fafc', border: isDarkMode ? '#334155' : '#e2e8f0' },
            { label: 'Түрүүлж байна', value: winningBids.length, color: '#16a34a', bg: isDarkMode ? '#1e293b' : '#f0fdf4', border: isDarkMode ? '#334155' : '#bbf7d0' },
            { label: 'Хүчингүй', value: outbidBids.length, color: '#dc2626', bg: isDarkMode ? '#1e293b' : '#fef2f2', border: isDarkMode ? '#334155' : '#fecaca' },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: s.bg, borderColor: s.border }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={[styles.tabContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "active" && styles.tabActive]}
            onPress={() => setSelectedTab("active")}
          >
            <Text style={[styles.tabText, { color: selectedTab === "active" ? "#fff" : themeColors.textSecondary }]}>
              Идэвхтэй ({activeBids.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "all" && styles.tabActive]}
            onPress={() => setSelectedTab("all")}
          >
            <Text style={[styles.tabText, { color: selectedTab === "all" ? "#fff" : themeColors.textSecondary }]}>
              Бүгд ({safeBids.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bid list */}
        {filteredBids.length > 0 ? (
          <View style={styles.bidsContainer}>
            {filteredBids.map((bid, index) => {
              const productId = bid.product?._id || bid.productId || bid._id || `bid-${index}`;
              const productTitle = bid.product?.title || bid.title || '';
              const productImage = bid.product?.images?.[0]?.url || bid.image || null;
              const myBid = bid.userMaxBid ?? bid.amount ?? 0;
              const currentBid = bid.currentHighestBid ?? bid.finalPrice ?? bid.price ?? 0;
              const auctionStatus = (bid.auctionStatus || '').toLowerCase();
              const isLeading = bid.isLeading === true;
              const purchaseDate = bid.createdAt || bid.lastBidAt;

              return (
                <TouchableOpacity
                  key={productId}
                  style={[styles.bidCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                  onPress={() => router.push(`/product/${productId}`)}
                  activeOpacity={0.75}
                >
                  <View style={styles.bidCardRow}>
                    {productImage ? (
                      <Image source={{ uri: productImage }} style={styles.bidImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.bidImage, styles.bidImagePlaceholder, { backgroundColor: isDarkMode ? '#1e293b' : theme.gray100 }]}>
                        <Ionicons name="image-outline" size={24} color={theme.gray400} />
                      </View>
                    )}
                    <View style={styles.bidCardInfo}>
                      <Text style={[styles.bidTitle, { color: themeColors.text }]} numberOfLines={2}>{productTitle}</Text>
                      <View style={styles.bidPriceRow}>
                        <View>
                          <Text style={[styles.bidPriceLabel, { color: themeColors.textSecondary }]}>Таны санал</Text>
                          <Text style={styles.bidAmount}>₮{myBid.toLocaleString()}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.bidPriceLabel, { color: themeColors.textSecondary }]}>Одоогийн</Text>
                          <Text style={[styles.currentBid, { color: themeColors.text }]}>₮{currentBid.toLocaleString()}</Text>
                        </View>
                      </View>
                      <View style={styles.bidFooter}>
                        {auctionStatus && (
                          <View style={[styles.statusPill, { backgroundColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                            <Text style={[styles.statusPillText, { color: themeColors.textSecondary }]}>{auctionStatus}</Text>
                          </View>
                        )}
                        <View style={[styles.leadingBadge, { backgroundColor: isLeading ? '#f0fdf4' : '#fef3c7' }]}>
                          <Ionicons name={isLeading ? "trophy" : "alert-circle"} size={13} color={isLeading ? "#16a34a" : "#f59e0b"} />
                          <Text style={[styles.leadingText, { color: isLeading ? "#16a34a" : "#f59e0b" }]}>
                            {isLeading ? "Түрүүлж байна" : "Хүчингүй болсон"}
                          </Text>
                        </View>
                      </View>
                      {purchaseDate && (
                        <Text style={[styles.bidDate, { color: themeColors.textSecondary }]}>
                          Сүүлийн санал: {new Date(purchaseDate).toLocaleDateString("mn-MN")}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="hammer-outline" size={56} color={theme.gray300} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              {selectedTab === "active" ? "Идэвхтэй санал алга байна" : "Санал байхгүй"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>Үнийн санал өгөж эхлээрэй</Text>
            <TouchableOpacity style={styles.browseButton} onPress={() => router.push("/(tabs)/")}>
              <Text style={styles.browseButtonText}>Бараа үзэх</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14 },
  iconCircle: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  guestTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  guestSubtitle: { fontSize: 13, textAlign: "center", marginBottom: 28, lineHeight: 20 },
  loginButton: { width: "100%", backgroundColor: theme.brand600, borderRadius: 12, height: 50, alignItems: "center", justifyContent: "center" },
  loginButtonText: { fontSize: 15, fontWeight: "700", color: theme.white },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800" },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  statsRow: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 16, paddingBottom: 4, gap: 8 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", lineHeight: 26 },
  statLabel: { fontSize: 10, fontWeight: "600", marginTop: 3, textAlign: "center" },
  tabContainer: { flexDirection: "row", marginHorizontal: 16, marginVertical: 12, borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabActive: { backgroundColor: theme.brand600 },
  tabText: { fontSize: 13, fontWeight: "700" },
  bidsContainer: { paddingHorizontal: 16, gap: 12 },
  bidCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  bidCardRow: { flexDirection: "row" },
  bidImage: { width: 100, height: 100 },
  bidImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  bidCardInfo: { flex: 1, padding: 12 },
  bidTitle: { fontSize: 13, fontWeight: "700", marginBottom: 8, lineHeight: 18 },
  bidPriceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  bidPriceLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 2 },
  bidAmount: { fontSize: 15, fontWeight: "800", color: theme.brand600 },
  currentBid: { fontSize: 14, fontWeight: "700" },
  bidFooter: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  statusPillText: { fontSize: 10, fontWeight: "600" },
  leadingBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  leadingText: { fontSize: 11, fontWeight: "700" },
  bidDate: { fontSize: 11, marginTop: 2 },
  emptyContainer: { padding: 40, alignItems: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginTop: 16, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  browseButton: { backgroundColor: theme.brand600, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  browseButtonText: { color: theme.white, fontSize: 14, fontWeight: "700" },
});
