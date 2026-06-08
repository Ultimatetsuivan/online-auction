import React, { useState, useEffect } from "react";
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

export default function SellingScreen() {
  const { isDarkMode, themeColors } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeListings, setActiveListings] = useState<any[]>([]);
  const [endedListings, setEndedListings] = useState<any[]>([]);
  const [soldListings, setSoldListings] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<"active" | "ended">("active");

  useEffect(() => {
    loadUserAndListings();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserAndListings();
    }, [])
  );

  const loadUserAndListings = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        await fetchUserListings();
      } else {
        setUser(null);
        setActiveListings([]);
        setEndedListings([]);
        setSoldListings([]);
      }
    } catch (error) {
      console.error("Error loading user listings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserListings = async () => {
    try {
      const response = await api.get(`/api/product/my`);
      const listings = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || response.data?.products || []);

      const now = new Date();
      const active = listings.filter((item: any) => {
        if (item.sold) return false;
        if (!item.bidDeadline) return true;
        return new Date(item.bidDeadline) > now;
      });
      const ended = listings.filter((item: any) => {
        if (item.sold) return false;
        if (!item.bidDeadline) return false;
        return new Date(item.bidDeadline) <= now;
      });
      const sold = listings.filter((item: any) => item.sold === true);

      setActiveListings(active);
      setEndedListings(ended);
      setSoldListings(sold);
    } catch (error: any) {
      setActiveListings([]);
      setEndedListings([]);
      setSoldListings([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserAndListings();
  };

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
        <ScrollView contentContainerStyle={styles.guestContainer}>
          <View style={styles.guestContent}>
            <View style={[styles.iconCircle, { backgroundColor: theme.brand50 }]}>
              <Ionicons name="cube-outline" size={56} color={theme.brand600} />
            </View>
            <Text style={[styles.guestTitle, { color: themeColors.text }]}>Нэвтрэх шаардлагатай</Text>
            <Text style={[styles.guestSubtitle, { color: themeColors.textSecondary }]}>Өөрийн зарыг харахын тулд нэвтэрнэ үү</Text>
            <TouchableOpacity style={styles.loginButton} onPress={() => router.push("/(hidden)/login")}>
              <Text style={styles.loginButtonText}>Нэвтрэх</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.registerButton, { borderColor: theme.brand600 }]} onPress={() => router.push("/(hidden)/register")}>
              <Text style={[styles.registerButtonText, { color: theme.brand600 }]}>Бүртгүүлэх</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const totalListings = activeListings.length + endedListings.length + soldListings.length;
  const displayListings = selectedTab === "active" ? activeListings : endedListings;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Миний зарууд</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>Таны бүх зарын жагсаалт</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push("/(hidden)/add-product")}>
          <Ionicons name="add" size={22} color={theme.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { backgroundColor: themeColors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand600} />}
      >
        {/* Stat cards */}
        <View style={styles.statsRow}>
          {[
            { label: 'Нийт', value: totalListings, color: '#64748b', bg: isDarkMode ? '#1e293b' : '#f8fafc', border: isDarkMode ? '#334155' : '#e2e8f0' },
            { label: 'Идэвхтэй', value: activeListings.length, color: theme.brand600, bg: isDarkMode ? '#1e293b' : '#fff7ed', border: isDarkMode ? '#334155' : '#fed7aa' },
            { label: 'Дууссан', value: endedListings.length, color: '#f59e0b', bg: isDarkMode ? '#1e293b' : '#fffbeb', border: isDarkMode ? '#334155' : '#fde68a' },
            { label: 'Зарагдсан', value: soldListings.length, color: '#16a34a', bg: isDarkMode ? '#1e293b' : '#f0fdf4', border: isDarkMode ? '#334155' : '#bbf7d0' },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: s.bg, borderColor: s.border }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={[styles.tabContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          {([
            { key: 'active', label: `Идэвхтэй (${activeListings.length})` },
            { key: 'ended',  label: `Дууссан (${endedListings.length})` },
          ] as const).map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
              onPress={() => setSelectedTab(tab.key)}
            >
              <Text style={[styles.tabText, { color: selectedTab === tab.key ? '#fff' : themeColors.textSecondary }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Listings */}
        {displayListings.length > 0 ? (
          <View style={styles.listingsContainer}>
            {displayListings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} isActive={selectedTab === "active"} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name={selectedTab === "active" ? "cube-outline" : "time-outline"} size={56} color={theme.gray300} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              {selectedTab === "active" ? "Идэвхтэй зар байхгүй" : "Дууссан зар байхгүй"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
              {selectedTab === "active" ? "Дээд талын + товч дарж шинэ зар нэмээрэй" : "Таны дууссан зарууд энд харагдана"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ListingCard({ listing, isActive }: { listing: any; isActive: boolean }) {
  const { isDarkMode, themeColors } = useTheme();
  const deadline = listing.bidDeadline ? new Date(listing.bidDeadline) : null;
  const now = new Date();
  const timeLeft = deadline ? deadline.getTime() - now.getTime() : 0;

  const formatTimeLeft = () => {
    if (!deadline || timeLeft <= 0) return "Дууссан";
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    if (days > 0) return `${days} өдөр үлдсэн`;
    if (hours > 0) return `${hours} цаг үлдсэн`;
    return `${minutes} мин үлдсэн`;
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
      onPress={() => router.push(`/product/${listing._id}`)}
      activeOpacity={0.75}
    >
      {listing.images?.[0]?.url ? (
        <Image source={{ uri: listing.images[0].url }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder, { backgroundColor: isDarkMode ? '#1e293b' : theme.gray100 }]}>
          <Ionicons name="image-outline" size={36} color={theme.gray400} />
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: themeColors.text }]} numberOfLines={2}>{listing.title}</Text>
        <View style={styles.cardStats}>
          <View style={styles.cardStat}>
            <Ionicons name="pricetag" size={15} color={theme.brand600} />
            <Text style={styles.cardPrice}>₮{(listing.currentBid || listing.price || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.cardStat}>
            <Ionicons name="people" size={15} color={theme.gray400} />
            <Text style={[styles.cardBids, { color: themeColors.textSecondary }]}>{listing.bids?.length || 0} санал</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusEnded]}>
            <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextEnded]}>
              {formatTimeLeft()}
            </Text>
          </View>
          {!isActive && (listing.bids?.length || 0) > 0 && (
            <Text style={[styles.winnerText, { color: themeColors.textSecondary }]}>
              Хамгийн өндөр: ₮{listing.currentBid?.toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 14, marginTop: 12 },
  guestContainer: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 32 },
  guestContent: { alignItems: "center" },
  iconCircle: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  guestTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8 },
  guestSubtitle: { fontSize: 14, textAlign: "center", marginBottom: 32, lineHeight: 20 },
  loginButton: { width: "100%", backgroundColor: theme.brand600, borderRadius: 12, height: 52, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  loginButtonText: { fontSize: 16, fontWeight: "700", color: theme.white },
  registerButton: { width: "100%", backgroundColor: "transparent", borderRadius: 12, height: 52, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  registerButtonText: { fontSize: 16, fontWeight: "700" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: "800" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  addButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.brand600, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingBottom: 32 },
  statsRow: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 16, paddingBottom: 4, gap: 8 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", lineHeight: 26 },
  statLabel: { fontSize: 10, fontWeight: "600", marginTop: 3, textAlign: "center" },
  tabContainer: { flexDirection: "row", marginHorizontal: 16, marginVertical: 12, borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabActive: { backgroundColor: theme.brand600 },
  tabText: { fontSize: 13, fontWeight: "700" },
  listingsContainer: { paddingHorizontal: 16, gap: 12 },
  card: { borderRadius: 14, overflow: "hidden", borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardImage: { width: "100%", height: 180 },
  cardImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  cardContent: { padding: 14 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10, lineHeight: 21 },
  cardStats: { flexDirection: "row", gap: 16, marginBottom: 10 },
  cardStat: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardPrice: { fontSize: 15, fontWeight: "800", color: theme.brand600 },
  cardBids: { fontSize: 13 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusActive: { backgroundColor: "#fff7ed" },
  statusEnded: { backgroundColor: theme.gray100 },
  statusText: { fontSize: 12, fontWeight: "700" },
  statusTextActive: { color: theme.brand600 },
  statusTextEnded: { color: theme.gray500 },
  winnerText: { fontSize: 12 },
  emptyContainer: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, textAlign: "center", lineHeight: 20 },
});
