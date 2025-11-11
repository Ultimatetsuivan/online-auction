import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "../theme";

export default function SettingsScreen() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const darkMode = await AsyncStorage.getItem("darkMode");
      const pushNotifs = await AsyncStorage.getItem("pushNotifications");
      const emailNotifs = await AsyncStorage.getItem("emailNotifications");

      if (darkMode !== null) setIsDarkMode(darkMode === "true");
      if (pushNotifs !== null) setPushNotifications(pushNotifs === "true");
      if (emailNotifs !== null) setEmailNotifications(emailNotifs === "true");
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const toggleDarkMode = async (value: boolean) => {
    setIsDarkMode(value);
    try {
      await AsyncStorage.setItem("darkMode", value.toString());
      // TODO: Apply dark theme to app
      Alert.alert(
        "Харанхуй горим",
        value ? "Харанхуй горим идэвхжлээ" : "Цайвар горим идэвхжлээ"
      );
    } catch (error) {
      console.error("Error saving dark mode:", error);
    }
  };

  const togglePushNotifications = async (value: boolean) => {
    setPushNotifications(value);
    try {
      await AsyncStorage.setItem("pushNotifications", value.toString());
    } catch (error) {
      console.error("Error saving push notifications:", error);
    }
  };

  const toggleEmailNotifications = async (value: boolean) => {
    setEmailNotifications(value);
    try {
      await AsyncStorage.setItem("emailNotifications", value.toString());
    } catch (error) {
      console.error("Error saving email notifications:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Тохиргоо</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Харагдах байдал</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={isDarkMode ? "moon" : "sunny"}
                  size={20}
                  color={theme.brand600}
                />
              </View>
              <View>
                <Text style={styles.settingTitle}>Харанхуй горим</Text>
                <Text style={styles.settingDescription}>
                  Нүдэнд ээлтэй харанхуй дэлгэц
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: theme.gray300, true: theme.brand600 }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Мэдэгдэл</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="notifications" size={20} color={theme.brand600} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Push мэдэгдэл</Text>
                <Text style={styles.settingDescription}>
                  Утсанд мэдэгдэл илгээх
                </Text>
              </View>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={togglePushNotifications}
              trackColor={{ false: theme.gray300, true: theme.brand600 }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail" size={20} color={theme.brand600} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Имэйл мэдэгдэл</Text>
                <Text style={styles.settingDescription}>
                  Имэйлээр мэдэгдэл авах
                </Text>
              </View>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={toggleEmailNotifications}
              trackColor={{ false: theme.gray300, true: theme.brand600 }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Бусад</Text>

          <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="help-circle" size={20} color={theme.brand600} />
              </View>
              <Text style={styles.settingTitle}>Тусламж</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="document-text" size={20} color={theme.brand600} />
              </View>
              <Text style={styles.settingTitle}>Үйлчилгээний нөхцөл</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="shield" size={20} color={theme.brand600} />
              </View>
              <Text style={styles.settingTitle}>Нууцлалын бодлого</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.gray400} />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="information-circle" size={20} color={theme.brand600} />
              </View>
              <Text style={styles.settingTitle}>Хувилбар</Text>
            </View>
            <Text style={styles.versionText}>1.0.0</Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="checkmark-circle" size={24} color={theme.brand600} />
          <Text style={styles.infoText}>
            Таны тохиргоо хадгалагдаж, дараа дахин нэвтрэхэд хэрэгжинэ.
          </Text>
        </View>
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
    paddingVertical: 12,
    backgroundColor: theme.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray200,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.gray900,
  },
  section: {
    backgroundColor: theme.white,
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.gray500,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingVertical: 12,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray100,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.gray900,
  },
  settingDescription: {
    fontSize: 13,
    color: theme.gray500,
    marginTop: 2,
  },
  versionText: {
    fontSize: 14,
    color: theme.gray500,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.brand50,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.gray700,
    lineHeight: 18,
  },
});
