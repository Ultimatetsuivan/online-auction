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
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProductCard from "../components/ProductCard";
import theme from "../theme";
import { api } from "../../src/api";

export default function WatchlistScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [watchlist, setWatchlist] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadUserAndWatchlist();
    }, [])
  );

  const loadUserAndWatchlist = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        await fetchWatchlist();
      }
    } catch (error) {
      console.error("Error loading watchlist:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const response = await api.get("/api/watchlist");
      const watchlistData = response.data?.data || response.data || [];
      setWatchlist(watchlistData);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      setWatchlist([]);
    }
  };

  const handleToggleNotification = async (
    watchlistId: string,
    field: string,
    currentValue: boolean
  ) => {
    try {
      await api.put(`/api/watchlist/${watchlistId}`, {
        [field]: !currentValue,
      });

      // Update local state
      setWatchlist((prev) =>
        prev.map((item) =>
          item._id === watchlistId ? { ...item, [field]: !currentValue } : item
        )
      );
    } catch (error) {
      console.error("Error updating notification settings:", error);
      Alert.alert("Алдаа", "Мэдэгдлийн тохиргоо шинэчлэхэд алдаа гарлаа");
    }
  };

  const handleRemoveFromWatchlist = async (watchlistId: string) => {
    Alert.alert(
      "Хасах",
      "Энэ бараагуудийг хянах жагсаалтаас хасах уу?",
      [
        { text: "Болих", style: "cancel" },
        {
          text: "Хасах",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/api/watchlist/${watchlistId}`);
              setWatchlist((prev) => prev.filter((item) => item._id !== watchlistId));
              Alert.alert("Амжилттай", "Хасагдлаа");
            } catch (error) {
              console.error("Error removing from watchlist:", error);
              Alert.alert("Алдаа", "Хасахад алдаа гарлаа");
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserAndWatchlist();
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
          <Text style={styles.headerTitle}>Хянах жагсаалт</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.guestContainer}>
          <View style={styles.guestContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="eye-outline" size={64} color={theme.brand600} />
            </View>
            <Text style={styles.guestTitle}>Нэвтрэх шаардлагатай</Text>
            <Text style={styles.guestSubtitle}>
              Хянах жагсаалт харахын тулд нэвтэрнэ үү
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
        <Text style={styles.headerTitle}>Хянах жагсаалт</Text>
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
        {watchlist.length > 0 ? (
          <View style={styles.listContainer}>
            {watchlist.map((item) => (
              <View key={item._id} style={styles.watchlistItem}>
                <TouchableOpacity
                  style={styles.productSection}
                  onPress={() => router.push(`/product/${item.product._id}`)}
                >
                  <ProductCard
                    product={{
                      id: item.product._id,
                      title: item.product.title,
                      price: item.product.currentBid || item.product.price,
                      image: item.product.images?.[0]?.url || null,
                      sold: item.product.sold,
                      available: item.product.available,
                      bids: item.product.bids?.length || 0,
                    }}
                    onPress={() => router.push(`/product/${item.product._id}`)}
                  />
                </TouchableOpacity>

                <View style={styles.notificationSettings}>
                  <Text style={styles.settingsTitle}>Мэдэгдлийн тохиргоо</Text>

                  <View style={styles.settingRow}>
                    <View style={styles.settingLeft}>
                      <Ionicons name="play-circle-outline" size={20} color={theme.gray700} />
                      <Text style={styles.settingText}>Дуудлага эхлэх үед</Text>
                    </View>
                    <Switch
                      value={item.notifyOnStart}
                      onValueChange={() =>
                        handleToggleNotification(item._id, "notifyOnStart", item.notifyOnStart)
                      }
                      trackColor={{ false: theme.gray300, true: theme.brand200 }}
                      thumbColor={item.notifyOnStart ? theme.brand600 : theme.white}
                    />
                  </View>

                  <View style={styles.settingRow}>
                    <View style={styles.settingLeft}>
                      <Ionicons name="time-outline" size={20} color={theme.gray700} />
                      <Text style={styles.settingText}>Дуусахад ойртоход</Text>
                    </View>
                    <Switch
                      value={item.notifyOnEndingSoon}
                      onValueChange={() =>
                        handleToggleNotification(
                          item._id,
                          "notifyOnEndingSoon",
                          item.notifyOnEndingSoon
                        )
                      }
                      trackColor={{ false: theme.gray300, true: theme.brand200 }}
                      thumbColor={item.notifyOnEndingSoon ? theme.brand600 : theme.white}
                    />
                  </View>

                  <View style={styles.settingRow}>
                    <View style={styles.settingLeft}>
                      <Ionicons name="pricetag-outline" size={20} color={theme.gray700} />
                      <Text style={styles.settingText}>Үнэ өөрчлөгдөх үед</Text>
                    </View>
                    <Switch
                      value={item.notifyOnPriceChange}
                      onValueChange={() =>
                        handleToggleNotification(
                          item._id,
                          "notifyOnPriceChange",
                          item.notifyOnPriceChange
                        )
                      }
                      trackColor={{ false: theme.gray300, true: theme.brand200 }}
                      thumbColor={item.notifyOnPriceChange ? theme.brand600 : theme.white}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFromWatchlist(item._id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.removeButtonText}>Хасах</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="eye-outline" size={64} color={theme.gray300} />
            <Text style={styles.emptyTitle}>Хянах жагсаалт хоосон</Text>
            <Text style={styles.emptySubtitle}>
              Сонирхолтой зарууддаа нэмээд мэдэгдэл авч байгаарай
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
  listContainer: {
    padding: 16,
  },
  watchlistItem: {
    backgroundColor: theme.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  productSection: {
    padding: 12,
  },
  notificationSettings: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.gray200,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.gray900,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  settingText: {
    fontSize: 14,
    color: theme.gray700,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    gap: 6,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
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
