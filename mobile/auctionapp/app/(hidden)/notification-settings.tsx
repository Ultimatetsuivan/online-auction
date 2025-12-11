import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "../theme";
import { api } from "../../src/api";

export default function NotificationSettingsScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    outbidAlerts: true,
    winningAlerts: true,
    auctionEndingAlerts: true,
    newBidAlerts: true,
    priceChangeAlerts: true,
    emailNotifications: true,
    pushNotifications: true,
  });

  useEffect(() => {
    loadUserAndSettings();
  }, []);

  const loadUserAndSettings = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
        await fetchSettings();
      }
    } catch (error) {
      console.error("Error loading user and settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get("/api/notification-settings");
      if (response.data?.data || response.data) {
        const fetchedSettings = response.data?.data || response.data;
        setSettings({
          outbidAlerts: fetchedSettings.outbidAlerts !== false,
          winningAlerts: fetchedSettings.winningAlerts !== false,
          auctionEndingAlerts: fetchedSettings.auctionEndingAlerts !== false,
          newBidAlerts: fetchedSettings.newBidAlerts !== false,
          priceChangeAlerts: fetchedSettings.priceChangeAlerts !== false,
          emailNotifications: fetchedSettings.emailNotifications !== false,
          pushNotifications: fetchedSettings.pushNotifications !== false,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleToggle = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      setSaving(true);
      await api.put("/api/notification-settings", newSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
      Alert.alert("Алдаа", "Тохиргоо хадгалахад алдаа гарлаа");
      // Revert
      setSettings(settings);
    } finally {
      setSaving(false);
    }
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
          <Text style={styles.headerTitle}>Мэдэгдлийн тохиргоо</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.guestContainer}>
          <View style={styles.guestContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="notifications-outline" size={64} color={theme.brand600} />
            </View>
            <Text style={styles.guestTitle}>Нэвтрэх шаардлагатай</Text>
            <Text style={styles.guestSubtitle}>
              Мэдэгдлийн тохиргоог өөрчлөхийн тулд нэвтэрнэ үү
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
        <Text style={styles.headerTitle}>Мэдэгдлийн тохиргоо</Text>
        {saving && <ActivityIndicator size="small" color={theme.brand600} />}
        {!saving && <View style={{ width: 24 }} />}
      </View>

      <ScrollView style={styles.content}>
        {/* Auction Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="hammer" size={20} color={theme.brand600} />
            <Text style={styles.sectionTitle}>Дуудлага худалдааны мэдэгдэл</Text>
          </View>

          <SettingRow
            icon="alert-circle-outline"
            title="Давагдсан үед"
            description="Таны санал давагдсан үед мэдэгдэнэ"
            value={settings.outbidAlerts}
            onToggle={(val) => handleToggle("outbidAlerts", val)}
          />

          <SettingRow
            icon="trophy-outline"
            title="Хожсон үед"
            description="Дуудлага худалдаанд хожсон үед мэдэгдэнэ"
            value={settings.winningAlerts}
            onToggle={(val) => handleToggle("winningAlerts", val)}
          />

          <SettingRow
            icon="time-outline"
            title="Дуусахад ойртоход"
            description="Дуудлага дуусахад 1 цаг үлдэхэд мэдэгдэнэ"
            value={settings.auctionEndingAlerts}
            onToggle={(val) => handleToggle("auctionEndingAlerts", val)}
          />

          <SettingRow
            icon="trending-up-outline"
            title="Шинэ санал ирэхэд"
            description="Таны барааны санал ирэх бүрт мэдэгдэнэ"
            value={settings.newBidAlerts}
            onToggle={(val) => handleToggle("newBidAlerts", val)}
            isLast
          />
        </View>

        {/* Watchlist Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye" size={20} color={theme.brand600} />
            <Text style={styles.sectionTitle}>Хянах жагсаалт</Text>
          </View>

          <SettingRow
            icon="pricetag-outline"
            title="Үнэ өөрчлөгдөх үед"
            description="Хянаж буй барааны үнэ өөрчлөгдөхөд мэдэгдэнэ"
            value={settings.priceChangeAlerts}
            onToggle={(val) => handleToggle("priceChangeAlerts", val)}
            isLast
          />
        </View>

        {/* Notification Channels */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={20} color={theme.brand600} />
            <Text style={styles.sectionTitle}>Мэдэгдлийн хэлбэр</Text>
          </View>

          <SettingRow
            icon="mail-outline"
            title="Имэйл мэдэгдэл"
            description="Имэйл хаягаар мэдэгдэл хүлээн авах"
            value={settings.emailNotifications}
            onToggle={(val) => handleToggle("emailNotifications", val)}
          />

          <SettingRow
            icon="notifications-outline"
            title="Push мэдэгдэл"
            description="Утсан дээр шууд мэдэгдэл хүлээн авах"
            value={settings.pushNotifications}
            onToggle={(val) => handleToggle("pushNotifications", val)}
            isLast
          />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={theme.brand600} />
          <Text style={styles.infoText}>
            Мэдэгдлүүд таны үйл ажиллагааг хөнгөвчилж, дуудлага худалдаагаас хоцрохгүй байхад
            тусална.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  icon,
  title,
  description,
  value,
  onToggle,
  isLast,
}: {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.settingRow, !isLast && styles.settingRowBorder]}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIconContainer}>
          <Ionicons name={icon as any} size={20} color={theme.gray700} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.gray300, true: theme.brand200 }}
        thumbColor={value ? theme.brand600 : theme.white}
      />
    </View>
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.white,
    marginTop: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.gray900,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.gray100,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.gray900,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: theme.gray500,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: theme.brand50,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.gray700,
    lineHeight: 20,
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
});
