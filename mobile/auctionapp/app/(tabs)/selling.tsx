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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
  const [selectedTab, setSelectedTab] = useState<"active" | "ended">("active");

  useEffect(() => {
    loadUserAndListings();
  }, []);

  const loadUserAndListings = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        await fetchUserListings(parsedUser._id);
      }
    } catch (error) {
      console.error("Error loading user listings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserListings = async (userId: string) => {
    try {
      // Fetch current user's products
      const response = await api.get(`/api/product/my`);
      const listings = response.data?.data || response.data || [];

      // Separate active and ended listings
      const now = new Date();
      const active = listings.filter((item: any) => {
        const deadline = new Date(item.bidDeadline);
        return deadline > now;
      });
      const ended = listings.filter((item: any) => {
        const deadline = new Date(item.bidDeadline);
        return deadline <= now;
      });

      setActiveListings(active);
      setEndedListings(ended);
    } catch (error) {
      console.error("Error fetching listings:", error);
      // For now, show empty state if API not implemented
      setActiveListings([]);
      setEndedListings([]);
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
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            Ачаалж байна...
          </Text>
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
            <View style={styles.iconCircle}>
              <Ionicons name="cube-outline" size={64} color={theme.brand600} />
            </View>
            <Text style={[styles.guestTitle, { color: themeColors.text }]}>
              Нэвтрэх шаардлагатай
            </Text>
            <Text style={[styles.guestSubtitle, { color: themeColors.textSecondary }]}>
              Өөрийн зарыг харахын тулд нэвтэрнэ үү
            </Text>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push("/(hidden)/login")}
            >
              <Text style={styles.loginButtonText}>Нэвтрэх</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push("/(hidden)/register")}
            >
              <Text style={styles.registerButtonText}>Бүртгүүлэх</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const displayListings = selectedTab === "active" ? activeListings : endedListings;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: themeColors.surface,
        borderBottomColor: themeColors.border 
      }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          Миний зарууд
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(hidden)/add-product")}
        >
          <Ionicons name="add" size={20} color={theme.white} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { 
        backgroundColor: themeColors.surface,
        borderBottomColor: themeColors.border 
      }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: themeColors.inputBg },
            selectedTab === "active" && styles.tabActive
          ]}
          onPress={() => setSelectedTab("active")}
        >
          <Text style={[styles.tabText, selectedTab === "active" && styles.tabTextActive, {
            color: selectedTab === "active" ? theme.white : themeColors.text
          }]}>
            Идэвхтэй ({activeListings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: themeColors.inputBg },
            selectedTab === "ended" && styles.tabActive
          ]}
          onPress={() => setSelectedTab("ended")}
        >
          <Text style={[styles.tabText, selectedTab === "ended" && styles.tabTextActive, {
            color: selectedTab === "ended" ? theme.white : themeColors.text
          }]}>
            Дууссан ({endedListings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Listings */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand600} />
        }
      >
        {displayListings.length > 0 ? (
          <View style={styles.listingsContainer}>
            {displayListings.map((listing) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                isActive={selectedTab === "active"}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name={selectedTab === "active" ? "cube-outline" : "time-outline"}
              size={64}
              color={theme.gray400}
            />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              {selectedTab === "active" ? "Идэвхтэй зар байхгүй" : "Дууссан зар байхгүй"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
              {selectedTab === "active"
                ? "Шинэ зар нэмээд худалдаа эхлүүлээрэй"
                : "Таны дууссан зарууд энд харагдана"}
            </Text>
            {selectedTab === "active" && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push("/(tabs)/search")}
              >
                <Ionicons name="add" size={20} color={theme.white} />
                <Text style={styles.emptyButtonText}>Зар нэмэх</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ListingCard({ listing, isActive }: { listing: any; isActive: boolean }) {
  const { themeColors } = useTheme();
  const deadline = new Date(listing.bidDeadline);
  const now = new Date();
  const timeLeft = deadline.getTime() - now.getTime();

  const formatTimeLeft = () => {
    if (timeLeft <= 0) return "Дууссан";

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);

    if (days > 0) return `${days} өдөр үлдсэн`;
    if (hours > 0) return `${hours} цаг үлдсэн`;
    return `${minutes} мин үлдсэн`;
  };

  return (
    <TouchableOpacity
      style={[styles.card, { 
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border 
      }]}
      onPress={() => router.push(`/product/${listing._id}`)}
      activeOpacity={0.7}
    >
      {listing.images?.[0]?.url ? (
        <Image
          source={{ uri: listing.images[0].url }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Ionicons name="image-outline" size={40} color={theme.gray400} />
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: themeColors.text }]} numberOfLines={2}>
          {listing.title}
        </Text>

        <View style={styles.cardStats}>
          <View style={styles.cardStat}>
            <Ionicons name="pricetag" size={16} color={theme.brand600} />
            <Text style={styles.cardPrice}>₮{listing.currentBid?.toLocaleString() || listing.price?.toLocaleString()}</Text>
          </View>
          <View style={styles.cardStat}>
            <Ionicons name="people" size={16} color={theme.gray500} />
            <Text style={[styles.cardBids, { color: themeColors.textSecondary }]}>
              {listing.bids?.length || 0} санал
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusEnded]}>
            <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextEnded]}>
              {formatTimeLeft()}
            </Text>
          </View>

          {!isActive && listing.bids?.length > 0 && (
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
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
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
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
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
    marginBottom: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.white,
  },
  registerButton: {
    width: "100%",
    backgroundColor: theme.white,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.brand600,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.brand600,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.brand600,
    alignItems: "center",
    justifyContent: "center",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: theme.brand600,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
  },
  tabTextActive: {
    color: theme.white,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  listingsContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: "100%",
    height: 200,
    backgroundColor: theme.gray100,
  },
  cardImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 10,
  },
  cardStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.brand600,
  },
  cardBids: {
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: theme.brand100,
  },
  statusEnded: {
    backgroundColor: theme.gray200,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusTextActive: {
    color: theme.brand700,
  },
  statusTextEnded: {
    color: theme.gray600,
  },
  winnerText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.brand600,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.white,
  },
});
