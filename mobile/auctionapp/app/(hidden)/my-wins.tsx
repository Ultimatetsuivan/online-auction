import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

export default function MyWinsScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wins, setWins] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadUserAndWins();
    }, [])
  );

  const loadUserAndWins = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        await fetchWins();
      }
    } catch (error) {
      console.error("Error loading wins:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchWins = async () => {
    try {
      const response = await api.get("/api/bidding/my-wins");
      const winsData = response.data?.wins || response.data?.data || response.data || [];
      setWins(winsData);
    } catch (error) {
      setWins([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserAndWins();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.brand600} />
          <Text style={styles.loadingText}>Уншиж байна...</Text>
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
          <Text style={styles.headerTitle}>Миний хожлууд</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.guestContainer}>
          <View style={styles.guestContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="trophy-outline" size={64} color={theme.brand600} />
            </View>
            <Text style={styles.guestTitle}>Нэвтэрч орно уу</Text>
            <Text style={styles.guestSubtitle}>
              Хожсон дуудлагуудаа харахын тулд нэвтэрнэ үү.
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

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mиний хожлууд</Text>
        <View style={{ width: 24 }} />
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
        {wins.length > 0 ? (
          <View style={styles.winsContainer}>
            {wins.map((win, index) => {
              const productId = win.product?._id || win.productId || win._id || `win-${index}`;
              const productTitle = win.product?.title || win.title || "";
              const productImage = win.product?.images?.[0]?.url || win.image || null;
              const productPrice =
                win.product?.currentBid ??
                win.product?.price ??
                win.finalPrice ??
                win.userMaxBid ??
                0;
              const bidsCount = win.product?.bids?.length || win.bids || 0;
              const isSold =
                (win.product?.sold ?? win.result === "won") ||
                (win.auctionStatus || "").toLowerCase() === "ended";
              const purchaseDate = win.createdAt || win.lastBidAt;

              const handleProductPress = () => {
                if (productId) {
                  router.push(`/product/${productId}`);
                }
              };

              return (
                <View key={productId} style={styles.winItem}>
                  <View style={styles.winBadge}>
                    <Ionicons name="trophy" size={20} color="#F59E0B" />
                    <Text style={styles.winBadgeText}>Та хожсон байна!</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.productSection}
                    onPress={handleProductPress}
                  >
                    <ProductCard
                      product={{
                        id: productId,
                        title: productTitle,
                        price: productPrice,
                        image: productImage,
                        sold: isSold,
                        available: win.product?.available,
                        bids: bidsCount,
                      }}
                      onPress={handleProductPress}
                    />
                  </TouchableOpacity>

                  <View style={styles.winInfo}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Эцсийн үнэ:</Text>
                      <Text style={styles.infoValue}>MNT {productPrice.toLocaleString()}</Text>
                    </View>

                    {purchaseDate && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Огноо:</Text>
                        <Text style={styles.infoDate}>
                          {new Date(purchaseDate).toLocaleDateString("mn-MN")}
                        </Text>
                      </View>
                    )}

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Төлөв:</Text>
                      <View style={styles.statusTag}>
                        {isSold ? (
                          <>
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            <Text style={styles.statusSold}>Баталгаажсан</Text>
                          </>
                        ) : (
                          <>
                            <Ionicons name="time" size={16} color="#F59E0B" />
                            <Text style={styles.statusPending}>Хүлээгдэж байна</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color={theme.gray300} />
            <Text style={styles.emptyTitle}>Одоогоор хожсон зүйл байхгүй</Text>
            <Text style={styles.emptySubtitle}>
              Дуудлагад оролцоод хожлоо энд харагдана.
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push("/(tabs)/")}
            >
              <Text style={styles.browseButtonText}>Бараа үзэх</Text>
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
  winsContainer: {
    padding: 16,
  },
  winItem: {
    backgroundColor: theme.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  winBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    paddingVertical: 10,
    gap: 6,
  },
  winBadgeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F59E0B",
  },
  productSection: {
    padding: 12,
  },
  winInfo: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.gray200,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.gray600,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.brand600,
  },
  infoDate: {
    fontSize: 14,
    color: theme.gray700,
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusSold: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },
  statusPending: {
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
