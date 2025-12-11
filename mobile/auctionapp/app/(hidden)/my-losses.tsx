import React, { useState, useEffect, useCallback } from "react";
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

export default function MyLossesScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [losses, setLosses] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadUserAndLosses();
    }, [])
  );

  const loadUserAndLosses = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        await fetchLosses();
      }
    } catch (error) {
      console.error("Error loading losses:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchLosses = async () => {
    try {
      const response = await api.get("/api/bidding/my-losses");
      const lossesData = response.data?.data || response.data || [];
      setLosses(lossesData);
    } catch (error) {
      console.error("Error fetching losses:", error);
      setLosses([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserAndLosses();
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
          <Text style={styles.headerTitle}>Алдсан дуудлагууд</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.guestContainer}>
          <View style={styles.guestContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="close-circle-outline" size={64} color={theme.brand600} />
            </View>
            <Text style={styles.guestTitle}>Нэвтрэх шаардлагатай</Text>
            <Text style={styles.guestSubtitle}>
              Алдсан дуудлага худалдаагаа харахын тулд нэвтэрнэ үү
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Алдсан дуудлагууд</Text>
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
        {losses.length > 0 ? (
          <View style={styles.lossesContainer}>
            {losses.map((loss) => (
              <View key={loss._id} style={styles.lossItem}>
                <View style={styles.lossBadge}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                  <Text style={styles.lossBadgeText}>Давагдсан</Text>
                </View>

                <TouchableOpacity
                  style={styles.productSection}
                  onPress={() => router.push(`/product/${loss.product._id}`)}
                >
                  <ProductCard
                    product={{
                      id: loss.product._id,
                      title: loss.product.title,
                      price: loss.product.currentBid || loss.product.price,
                      image: loss.product.images?.[0]?.url || null,
                      sold: loss.product.sold,
                      available: loss.product.available,
                      bids: loss.product.bids?.length || 0,
                    }}
                    onPress={() => router.push(`/product/${loss.product._id}`)}
                  />
                </TouchableOpacity>

                <View style={styles.lossInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Миний сүүлийн санал:</Text>
                    <Text style={styles.myBid}>₮{loss.price.toLocaleString()}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Хожсон үнэ:</Text>
                    <Text style={styles.winningBid}>
                      ₮{(loss.product.currentBid || loss.product.price).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Огноо:</Text>
                    <Text style={styles.infoDate}>
                      {new Date(loss.createdAt).toLocaleDateString("mn-MN")}
                    </Text>
                  </View>

                  <View style={styles.tipBox}>
                    <Ionicons name="information-circle" size={18} color={theme.brand600} />
                    <Text style={styles.tipText}>
                      Дараагийн удаа илүү эрт санал өгч үзээрэй
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="close-circle-outline" size={64} color={theme.gray300} />
            <Text style={styles.emptyTitle}>Алдсан дуудлага байхгүй</Text>
            <Text style={styles.emptySubtitle}>
              Энэ нь сайн шинж! Та дуудлагадаа хожиж байна.
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
  lossesContainer: {
    padding: 16,
  },
  lossItem: {
    backgroundColor: theme.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  lossBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    paddingVertical: 10,
    gap: 6,
  },
  lossBadgeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#EF4444",
  },
  productSection: {
    padding: 12,
  },
  lossInfo: {
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
  myBid: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.gray700,
  },
  winningBid: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
  },
  infoDate: {
    fontSize: 14,
    color: theme.gray700,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.brand50,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: theme.gray700,
    lineHeight: 18,
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
