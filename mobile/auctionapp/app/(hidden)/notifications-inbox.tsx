import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { api } from "../../src/api";
import theme from "../theme";
import { useTheme } from "../../src/contexts/ThemeContext";

const TYPE_META: Record<string, { icon: string; color: string }> = {
  outbid:          { icon: "trending-up",           color: "#f59e0b" },
  won_auction:     { icon: "trophy",                 color: "#16a34a" },
  sold:            { icon: "cash",                   color: "#16a34a" },
  new_bid:         { icon: "hammer",                 color: theme.brand600 },
  auction_ending:  { icon: "time",                   color: "#ef4444" },
  payment_success: { icon: "checkmark-circle",       color: "#16a34a" },
  deposit_return:  { icon: "return-down-back",       color: "#3b82f6" },
  like_update:     { icon: "heart",                  color: "#ec4899" },
  price_drop:      { icon: "arrow-down-circle",      color: "#f59e0b" },
  expiring_soon:   { icon: "alarm",                  color: "#ef4444" },
};

export default function NotificationsInbox() {
  const { isDarkMode, themeColors } = useTheme();
  const styles = getStyles(themeColors, isDarkMode);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/api/notifications?limit=50");
      const data = res.data?.notifications || res.data || [];
      setNotifications(Array.isArray(data) ? data : []);
      setUnreadCount(res.data?.unreadCount ?? data.filter((n: any) => !n.read).length);
    } catch (e) {
      console.error("fetchNotifications:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      fetchNotifications();
    }, [fetchNotifications])
  );

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error("markAsRead:", e);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.post("/api/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      Alert.alert("Алдаа", "Бүгдийг уншсан гэж тэмдэглэхэд алдаа гарлаа");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (e) {
      console.error("deleteNotification:", e);
    }
  };

  const handleTap = async (item: any) => {
    if (!item.read) handleMarkAsRead(item._id);
    if (item.product?._id || item.productId) {
      router.push(`/product/${item.product?._id || item.productId}`);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const meta = TYPE_META[item.type] || { icon: "notifications", color: theme.brand600 };
    const isUnread = !item.read;
    const timeStr = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString("mn-MN", {
          month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        })
      : "";

    return (
      <TouchableOpacity
        style={[styles.item, isUnread && styles.itemUnread]}
        onPress={() => handleTap(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.iconBox, { backgroundColor: `${meta.color}1A` }]}>
          <Ionicons name={meta.icon as any} size={22} color={meta.color} />
        </View>
        <View style={styles.itemBody}>
          <Text style={[styles.itemTitle, isUnread && styles.itemTitleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.itemMsg} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.itemTime}>{timeStr}</Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => handleDelete(item._id)}
          style={styles.deleteBtn}
        >
          <Ionicons name="close" size={16} color={themeColors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Мэдэгдлүүд</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} disabled={markingAll} style={styles.markAllBtn}>
            {markingAll
              ? <ActivityIndicator size="small" color={theme.brand600} />
              : <Text style={styles.markAllText}>Бүгдийг уншсан</Text>}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.brand600} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={64} color={themeColors.border} />
          <Text style={styles.emptyTitle}>Мэдэгдэл байхгүй</Text>
          <Text style={styles.emptyHint}>Дуудлага, худалдааны мэдэгдлүүд энд гарна</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (themeColors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: themeColors.surface,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    backBtn: { width: 36, alignItems: "flex-start" },
    headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: themeColors.text },
    badge: {
      backgroundColor: "#ef4444",
      borderRadius: 10,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
    markAllBtn: { width: 80, alignItems: "flex-end" },
    markAllText: { fontSize: 12, fontWeight: "600", color: theme.brand600 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
    emptyTitle: { fontSize: 17, fontWeight: "700", color: themeColors.text },
    emptyHint: { fontSize: 13, color: themeColors.textSecondary, textAlign: "center" },
    item: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: themeColors.surface,
      gap: 12,
    },
    itemUnread: {
      backgroundColor: isDark ? "#1e3a5f" : "#eff6ff",
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    itemBody: { flex: 1 },
    itemTitle: { fontSize: 14, fontWeight: "500", color: themeColors.text, marginBottom: 3 },
    itemTitleUnread: { fontWeight: "700" },
    itemMsg: { fontSize: 13, color: themeColors.textSecondary, lineHeight: 18 },
    itemTime: { fontSize: 11, color: themeColors.textSecondary, marginTop: 4 },
    unreadDot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: theme.brand600, flexShrink: 0,
    },
    deleteBtn: { paddingLeft: 4, flexShrink: 0 },
    separator: { height: 1, backgroundColor: themeColors.border, marginLeft: 72 },
  });
