import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "../theme";
import { api } from "../../src/api";

export default function SettingsScreen() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [phoneStep, setPhoneStep] = useState<"phone" | "otp">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    loadUserInfo();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (phoneCountdown > 0) {
      timer = setTimeout(() => setPhoneCountdown((prev) => prev - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phoneCountdown]);

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

  const loadUserInfo = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading user info:", error);
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

  const openPhoneModal = () => {
    setPhoneStep("phone");
    setPhoneInput(user?.phone || "");
    setOtpInput("");
    setPhoneCountdown(0);
    setPhoneModalVisible(true);
  };

  const closePhoneModal = () => {
    setPhoneModalVisible(false);
    setPhoneStep("phone");
    setOtpInput("");
    setPhoneCountdown(0);
    setPhoneLoading(false);
  };

  const handleSendPhoneOtp = async () => {
    const trimmed = phoneInput.trim();
    if (!/^[0-9]{8}$/.test(trimmed)) {
      Alert.alert("Алдаа", "Утасны дугаар 8 оронтой байх ёстой.");
      return;
    }

    setPhoneLoading(true);
    try {
      await api.post("/api/auth/link/request", { phone: trimmed });
      setPhoneStep("otp");
      setPhoneCountdown(180);
      Alert.alert("Амжилттай", "Баталгаажуулах код илгээлээ. OTP кодоо оруулаарай");
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.message ||
        "OTP илгээх үед алдаа гарлаа.";
      Alert.alert("Алдаа", message);
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    const trimmedOtp = otpInput.trim();
    if (trimmedOtp.length !== 6) {
      Alert.alert("Алдаа", "6 оронтой OTP кодоо оруулна уу.");
      return;
    }

    setPhoneLoading(true);
    try {
      const response = await api.post("/api/auth/link/verify", { code: trimmedOtp });
      if (response.data?.user) {
        setUser(response.data.user);
        await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
        Alert.alert("Амжилттай", "Утасны дугаар баталгаажлаа.");
        closePhoneModal();
      }
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.message ||
        "OTP баталгаажуулах үед алдаа гарлаа.";
      Alert.alert("Алдаа", message);
    } finally {
      setPhoneLoading(false);
    }
  };

  const deleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await api.delete("/api/users/me");
      await AsyncStorage.multiRemove(["user", "token"]);
      router.replace("/(hidden)/login");
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Аккаунтыг устгах боломжгүй байна. Дараа дахин оролдоно уу.";
      Alert.alert("Алдаа", message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Аккаунтыг устгах",
      "Энэ үйлдлийг буцаах боломжгүй. Та итгэлтэй байна уу?",
      [
        { text: "Цуцлах", style: "cancel" },
        { text: "Устгах", style: "destructive", onPress: deleteAccount },
      ]
    );
  };

  const phoneStatusLabel = useMemo(() => {
    if (!user?.phone) return "Утасны дугаар нэмэх";
    return `+976 ${user.phone}`;
  }, [user]);

  const phoneVerifiedLabel = user?.phoneVerified ? "Баталгаажсан" : "Баталгаажаагүй";

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

        {/* Profile Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Хэрэглэгчийн мэдээлэл</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="call" size={20} color={theme.brand600} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Утасны дугаар</Text>
                <Text style={styles.settingDescription}>{phoneStatusLabel}</Text>
                {user?.phone && (
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: user.phoneVerified ? theme.brand600 : theme.gray500 },
                    ]}
                  >
                    {phoneVerifiedLabel}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={openPhoneModal}>
              <Text style={styles.actionText}>
                {user?.phone ? "Өөрчлөх" : "Нэмэх"}
              </Text>
            </TouchableOpacity>
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

        {/* Danger Section */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, styles.dangerSectionTitle]}>Аккаунтыг устгах</Text>
          <Text style={styles.dangerDescription}>
            Аккаунтыг устгаснаар таны мэдээлэл болон хэрэглэгчийн түүхүүдийг сэргээх боломжгүй.
          </Text>
          <TouchableOpacity
            style={[styles.deleteButton, deleteLoading && styles.deleteButtonDisabled]}
            onPress={confirmDeleteAccount}
            disabled={deleteLoading}
          >
            <Ionicons name="trash" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.deleteButtonText}>
              {deleteLoading ? "Устгаж байна..." : "Аккаунт устгах"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="checkmark-circle" size={24} color={theme.brand600} />
          <Text style={styles.infoText}>
            Таны тохиргоо хадгалагдаж, дараа дахин нэвтрэхэд хэрэгжинэ.
          </Text>
        </View>
      </ScrollView>

      {/* Phone Modal */}
      <Modal
        visible={phoneModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closePhoneModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Утасны дугаар баталгаажуулах</Text>
            {phoneStep === "phone" ? (
              <>
                <TextInput
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  placeholder="Утасны дугаар (8 цифр)"
                  placeholderTextColor={theme.gray400}
                  keyboardType="number-pad"
                  maxLength={8}
                  style={styles.modalInput}
                />
                <TouchableOpacity
                  style={[styles.modalButton, phoneLoading && styles.modalButtonDisabled]}
                  onPress={handleSendPhoneOtp}
                  disabled={phoneLoading}
                >
                  <Text style={styles.modalButtonText}>
                    {phoneLoading ? "Илгээж байна..." : "OTP илгээх"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  value={otpInput}
                  onChangeText={setOtpInput}
                  placeholder="OTP код"
                  placeholderTextColor={theme.gray400}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.modalInput}
                />
                {phoneCountdown > 0 ? (
                  <Text style={styles.countdownText}>
                    Дахин илгээх хүртэл: {Math.floor(phoneCountdown / 60)}:
                    {String(phoneCountdown % 60).padStart(2, "0")}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleSendPhoneOtp}>
                    <Text style={styles.resendText}>Код дахин илгээх</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.modalButton, phoneLoading && styles.modalButtonDisabled]}
                  onPress={handleVerifyPhoneOtp}
                  disabled={phoneLoading}
                >
                  <Text style={styles.modalButtonText}>
                    {phoneLoading ? "Баталгаажуулж байна..." : "Баталгаажуулах"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.modalClose} onPress={closePhoneModal}>
              <Text style={styles.modalCloseText}>Хаах</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  actionText: {
    fontSize: 14,
    color: theme.brand600,
    fontWeight: "600",
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: theme.white,
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.gray900,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.gray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.gray900,
    backgroundColor: theme.gray50,
  },
  modalButton: {
    backgroundColor: theme.brand600,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.white,
  },
  modalClose: {
    alignItems: "center",
    paddingTop: 8,
  },
  modalCloseText: {
    fontSize: 14,
    color: theme.gray500,
  },
  countdownText: {
    fontSize: 14,
    textAlign: "center",
    color: theme.gray600,
  },
  resendText: {
    fontSize: 14,
    textAlign: "center",
    color: theme.brand600,
    fontWeight: "600",
  },
  dangerSection: {
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f5c2c7",
    backgroundColor: "#fff5f5",
  },
  dangerSectionTitle: {
    color: "#dc3545",
  },
  dangerDescription: {
    fontSize: 13,
    color: "#b02a37",
    marginBottom: 16,
    lineHeight: 18,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: "#dc3545",
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
