import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  // Modal, // REMOVED - no longer using modal
  // ActivityIndicator, // REMOVED - no longer using
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as ImagePicker from "expo-image-picker"; // REMOVED - no longer using
import theme from "../theme";
import { api } from "../../src/api";
import { useTheme } from "../../src/contexts/ThemeContext";

export default function ProfileScreen() {
  const { isDarkMode, themeColors } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // OLD verification modal state - COMMENTED OUT
  // const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  // const [documentImage, setDocumentImage] = useState<string | null>(null);
  // const [selfieImage, setSelfieImage] = useState<string | null>(null);
  // const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  // Reload user data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUser();
    }, [])
  );

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  // OLD verification functions - COMMENTED OUT (Now using identity-verification screen)
  /*
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Зөвшөөрөл хэрэгтэй", "Камер ашиглахын тулд зөвшөөрөл өгнө үү");
      return false;
    }
    return true;
  };

  const takePhoto = async (type: "document" | "selfie") => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === "document" ? [4, 3] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === "document") {
          setDocumentImage(result.assets[0].uri);
        } else {
          setSelfieImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Алдаа", "Зураг авахад алдаа гарлаа");
    }
  };

  const pickImage = async (type: "document" | "selfie") => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === "document" ? [4, 3] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === "document") {
          setDocumentImage(result.assets[0].uri);
        } else {
          setSelfieImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Алдаа", "Зураг сонгоход алдаа гарлаа");
    }
  };

  const submitVerification = async () => {
    if (!documentImage || !selfieImage) {
      Alert.alert("Анхааруулга", "Бичиг баримт болон селфи зургийг авна уу");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();

      // Add document image
      formData.append("documentImage", {
        uri: documentImage,
        type: "image/jpeg",
        name: "document.jpg",
      } as any);

      // Add selfie image
      formData.append("selfieImage", {
        uri: selfieImage,
        type: "image/jpeg",
        name: "selfie.jpg",
      } as any);

      const response = await api.post("/api/users/verify", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Амжилттай", "Баталгаажуулалтын хүсэлт илгээгдлээ", [
          {
            text: "OK",
            onPress: () => {
              setVerificationModalVisible(false);
              setDocumentImage(null);
              setSelfieImage(null);
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      Alert.alert("Алдаа", error.response?.data?.error || "Баталгаажуулалт илгээхэд алдаа гарлаа");
    } finally {
      setUploading(false);
    }
  };
  */

  const handleLogout = () => {
    Alert.alert("Гарах", "Та гарахдаа итгэлтэй байна уу?", [
      { text: "Үгүй", style: "cancel" },
      {
        text: "Тийм",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("user");
            await AsyncStorage.removeItem("token");
            setUser(null);
            Alert.alert("Амжилттай", "Амжилттай гарлаа");
          } catch (error) {
            Alert.alert("Алдаа", "Гарахад алдаа гарлаа");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
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
              <Ionicons name="person-outline" size={64} color={theme.brand600} />
            </View>
            <Text style={[styles.guestTitle, { color: themeColors.text }]}>
              Нэвтрэх шаардлагатай
            </Text>
            <Text style={[styles.guestSubtitle, { color: themeColors.textSecondary }]}>
              Бүх боломжуудыг ашиглахын тулд нэвтэрнэ үү
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <ScrollView>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Профайл</Text>
        </View>

        {/* User Info */}
        <View style={[styles.userSection, { backgroundColor: themeColors.surface }]}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
          </View>
          <Text style={[styles.userName, { color: themeColors.text }]}>
            {user.name || "User"}
          </Text>
          <Text style={[styles.userEmail, { color: themeColors.textSecondary }]}>
            {user.email}
          </Text>
          {user.balance !== undefined && (
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Үлдэгдэл</Text>
              <Text style={styles.balanceAmount}>₮{user.balance.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* Personal Information Section */}
        <View style={[styles.personalInfoSection, { backgroundColor: themeColors.sectionBg }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Хувийн мэдээлэл
          </Text>

          <View style={[styles.infoCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            {user.surname && (
              <View style={[styles.infoRow, { borderBottomColor: themeColors.border }]}>
                <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Овог:</Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>{user.surname}</Text>
              </View>
            )}

            {user.name && (
              <View style={[styles.infoRow, { borderBottomColor: themeColors.border }]}>
                <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Нэр:</Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>{user.name}</Text>
              </View>
            )}

            {user.email && (
              <View style={[styles.infoRow, { borderBottomColor: themeColors.border }]}>
                <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Имэйл:</Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>{user.email}</Text>
              </View>
            )}

            {user.phone && (
              <View style={[styles.infoRow, { borderBottomColor: themeColors.border }]}>
                <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Утас:</Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>{user.phone}</Text>
              </View>
            )}

            {user.registrationNumber && (
              <View style={[styles.infoRow, { borderBottomColor: themeColors.border }]}>
                <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Регистр:</Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>
                  {user.registrationNumber}
                </Text>
              </View>
            )}
          </View>

          {/* eMongolia Verification Status */}
          {user.eMongoliaVerified ? (
            <View style={styles.eMongoliaVerifiedCard}>
              <Ionicons name="shield-checkmark" size={24} color="#10B981" />
              <View style={styles.eMongoliaTextContainer}>
                <Text style={styles.eMongoliaVerifiedTitle}>eMongolia баталгаажсан</Text>
                <Text style={styles.eMongoliaVerifiedSubtitle}>
                  {user.eMongoliaData?.verifiedAt &&
                    `Баталгаажуулсан: ${new Date(user.eMongoliaData.verifiedAt).toLocaleDateString('mn-MN')}`
                  }
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.eMongoliaButton}
              onPress={() => Alert.alert(
                "eMongolia баталгаажуулалт",
                "Та eMongolia-аар өөрийн мэдээллээ баталгаажуулах уу?",
                [
                  { text: "Цуцлах", style: "cancel" },
                  {
                    text: "Баталгаажуулах",
                    onPress: () => {
                      Alert.alert("eMongolia", "eMongolia баталгаажуулалт тун удахгүй нэмэгдэнэ");
                      // TODO: Implement eMongolia OAuth flow here
                    }
                  }
                ]
              )}
            >
              <Ionicons name="shield-checkmark" size={20} color="#0066CC" />
              <Text style={styles.eMongoliaButtonText}>eMongolia-аар баталгаажуулах</Text>
              <Ionicons name="chevron-forward" size={20} color="#0066CC" />
            </TouchableOpacity>
          )}
        </View>

        {/* Verification Status */}
        {user && (
          <View style={[styles.verificationSection, { backgroundColor: themeColors.sectionBg }]}>
            {user.isVerified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                <Text style={[styles.verifiedText, { color: themeColors.text }]}>
                  Хэрэглэгч баталгаажсан
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.verifyButton, { backgroundColor: themeColors.surface }]}
                onPress={() => router.push("/(hidden)/identity-verification")}
              >
                <Ionicons name="shield-outline" size={20} color={theme.brand600} />
                <Text style={[styles.verifyButtonText, { color: themeColors.text }]}>
                  Иргэний үнэмлэхээр баталгаажуулах
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.brand600} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Menu Items */}
        <View style={[styles.menuSection, { backgroundColor: themeColors.sectionBg }]}>
          <MenuItem
            icon="add-circle-outline"
            title="Бүтээгдэхүүн нэмэх"
            onPress={() => router.push("/(tabs)/search")}
            highlight
            themeColors={themeColors}
          />
          <MenuItem
            icon="cube-outline"
            title="Миний зарууд"
            onPress={() => router.push("/(tabs)/selling")}
            themeColors={themeColors}
          />
          <MenuItem
            icon="wallet-outline"
            title="Данс"
            onPress={() => router.push("/(hidden)/balance")}
            themeColors={themeColors}
          />
        </View>

        {/* Bidding Section */}
        <View style={[styles.menuSection, { backgroundColor: themeColors.sectionBg }]}>
          <MenuItem
            icon="hammer-outline"
            title="Миний санал"
            onPress={() => router.push("/(hidden)/my-bids")}
            themeColors={themeColors}
          />
          <MenuItem
            icon="trophy-outline"
            title="Миний хожлууд"
            onPress={() => router.push("/(hidden)/my-wins")}
            themeColors={themeColors}
          />
          <MenuItem
            icon="close-circle-outline"
            title="Алдсан дуудлагууд"
            onPress={() => router.push("/(hidden)/my-losses")}
            themeColors={themeColors}
          />
        </View>

        {/* Saved & Settings */}
        <View style={[styles.menuSection, { backgroundColor: themeColors.sectionBg }]}>
          <MenuItem
            icon="heart-outline"
            title="Таалагдсан"
            onPress={() => router.push("/(tabs)/notifications")}
            themeColors={themeColors}
          />
          <MenuItem
            icon="eye-outline"
            title="Хянах жагсаалт"
            onPress={() => router.push("/(hidden)/watchlist")}
            themeColors={themeColors}
          />
          <MenuItem
            icon="notifications-outline"
            title="Мэдэгдлийн тохиргоо"
            onPress={() => router.push("/(hidden)/notification-settings")}
            themeColors={themeColors}
          />
          <MenuItem
            icon="settings-outline"
            title="Тохиргоо"
            onPress={() => router.push("/(hidden)/settings")}
            themeColors={themeColors}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: themeColors.surface }]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Гарах</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* OLD Verification Modal - REMOVED (Now using identity-verification screen) */}
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  title,
  onPress,
  highlight,
  themeColors,
}: {
  icon: string;
  title: string;
  onPress: () => void;
  highlight?: boolean;
  themeColors?: any;
}) {
  const { themeColors: defaultThemeColors } = useTheme();
  const colors = themeColors || defaultThemeColors;
  
  return (
    <TouchableOpacity
      style={[styles.menuItem, highlight && styles.menuItemHighlight, {
        backgroundColor: colors.surface,
        borderBottomColor: colors.border
      }]}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons
          name={icon as any}
          size={22}
          color={highlight ? theme.brand600 : colors.textSecondary}
        />
        <Text style={[styles.menuItemText, highlight && styles.menuItemTextHighlight, {
          color: highlight ? theme.brand600 : colors.text
        }]}>
          {title}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={highlight ? theme.brand600 : colors.textSecondary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  userSection: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.brand600,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: theme.brand50,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 12,
    color: theme.gray600,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.brand600,
  },
  menuSection: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemHighlight: {
    backgroundColor: theme.brand50,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
  menuItemTextHighlight: {
    color: theme.brand600,
    fontWeight: "700",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginBottom: 32,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 8,
  },
  verificationSection: {
    backgroundColor: theme.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1FAE5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  verifiedText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10B981",
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.brand50,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.brand200,
  },
  verifyButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: theme.brand700,
    marginLeft: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.white,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.gray900,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: theme.gray600,
    lineHeight: 20,
    marginBottom: 24,
  },
  uploadSection: {
    marginBottom: 24,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.gray900,
    marginBottom: 12,
  },
  uploadButtons: {
    flexDirection: "row",
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.gray50,
    borderWidth: 2,
    borderColor: theme.brand600,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 24,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.brand600,
  },
  imagePreview: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: theme.brand50,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.gray700,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.brand600,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: theme.gray300,
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.white,
  },
  personalInfoSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  eMongoliaVerifiedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  eMongoliaTextContainer: {
    flex: 1,
  },
  eMongoliaVerifiedTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10B981",
    marginBottom: 2,
  },
  eMongoliaVerifiedSubtitle: {
    fontSize: 12,
    color: "#059669",
  },
  eMongoliaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EFF6FF",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0066CC",
  },
  eMongoliaButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#0066CC",
    marginLeft: 12,
  },
});
