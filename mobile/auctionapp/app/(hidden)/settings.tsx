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
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "../theme";
import { api } from "../../src/api";
import { useTheme } from "../../src/contexts/ThemeContext";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode, themeMode, themeColors, setThemeMode } = useTheme();
  const [themeModalVisible, setThemeModalVisible] = useState(false);
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

  // Legal document modals
  const [eulaModalVisible, setEulaModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [eulaContent, setEulaContent] = useState<any>(null);
  const [loadingEula, setLoadingEula] = useState(false);

  useEffect(() => {
    loadSettings();
    loadUserInfo();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (phoneCountdown > 0) {
      timer = setTimeout(() => setPhoneCountdown((prev) => prev - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phoneCountdown]);

  const loadSettings = async () => {
    try {
      const pushNotifs = await AsyncStorage.getItem("pushNotifications");
      const emailNotifs = await AsyncStorage.getItem("emailNotifications");

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

  const loadEula = async () => {
    setLoadingEula(true);
    try {
      const response = await api.get("/api/legal/eula/current");
      setEulaContent(response.data?.eula || null);
    } catch (error) {
      console.error("Error loading EULA:", error);
      Alert.alert("Алдаа", "EULA ачааллахад алдаа гарлаа");
    } finally {
      setLoadingEula(false);
    }
  };

  const openEulaModal = () => {
    if (!eulaContent) loadEula();
    setEulaModalVisible(true);
  };

  const openTermsModal = () => {
    if (!eulaContent) loadEula();
    setTermsModalVisible(true);
  };

  const openPrivacyModal = () => {
    if (!eulaContent) loadEula();
    setPrivacyModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Тохиргоо</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ backgroundColor: themeColors.background }}
      >
        {/* Appearance Section */}
        <View style={[styles.section, { backgroundColor: themeColors.sectionBg }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
            Харагдах байдал
          </Text>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: themeColors.border }]}
            activeOpacity={0.7}
            onPress={() => setThemeModalVisible(true)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, isDarkMode && styles.iconContainerActive]}>
                <Ionicons
                  name={isDarkMode ? "moon" : "sunny"}
                  size={20}
                  color={isDarkMode ? theme.white : theme.brand600}
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: themeColors.text }]}>
                  Харагдах байдал
                </Text>
                <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
                  {themeMode === 'system' ? 'Утасны тохиргоог дагах' : themeMode === 'dark' ? 'Харанхуй горим' : 'Цайвар горим'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, { backgroundColor: themeColors.sectionBg }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
            Мэдэгдэл
          </Text>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: themeColors.border }]}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, pushNotifications && styles.iconContainerActive]}>
                <Ionicons 
                  name="notifications" 
                  size={20} 
                  color={pushNotifications ? theme.white : theme.brand600} 
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: themeColors.text }]}>
                  Push мэдэгдэл
                </Text>
                <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
                  Утсанд мэдэгдэл илгээх
                </Text>
              </View>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={togglePushNotifications}
              trackColor={{ false: theme.gray300, true: theme.brand600 }}
              thumbColor="#fff"
              ios_backgroundColor={theme.gray300}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: themeColors.border }]}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, emailNotifications && styles.iconContainerActive]}>
                <Ionicons 
                  name="mail" 
                  size={20} 
                  color={emailNotifications ? theme.white : theme.brand600} 
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: themeColors.text }]}>
                  Имэйл мэдэгдэл
                </Text>
                <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
                  Имэйлээр мэдэгдэл авах
                </Text>
              </View>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={toggleEmailNotifications}
              trackColor={{ false: theme.gray300, true: theme.brand600 }}
              thumbColor="#fff"
              ios_backgroundColor={theme.gray300}
            />
          </TouchableOpacity>
        </View>

        {/* Profile Settings */}
        <View style={[styles.section, { backgroundColor: themeColors.sectionBg }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
            Хэрэглэгчийн мэдээлэл
          </Text>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: themeColors.border }]}
            activeOpacity={0.7}
            onPress={openPhoneModal}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, user?.phoneVerified && styles.iconContainerActive]}>
                <Ionicons 
                  name="call" 
                  size={20} 
                  color={user?.phoneVerified ? theme.white : theme.brand600} 
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: themeColors.text }]}>
                  Утасны дугаар
                </Text>
                <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
                  {phoneStatusLabel}
                </Text>
                {user?.phone && (
                  <View style={styles.verificationBadge}>
                    <Ionicons 
                      name={user.phoneVerified ? "checkmark-circle" : "time-outline"} 
                      size={14} 
                      color={user.phoneVerified ? theme.success600 : theme.gray500} 
                    />
                    <Text
                      style={[
                        styles.verificationText,
                        { color: user.phoneVerified ? theme.success600 : theme.gray500 },
                      ]}
                    >
                      {phoneVerifiedLabel}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.actionButton}>
              <Text style={styles.actionText}>
                {user?.phone ? "Өөрчлөх" : "Нэмэх"}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.brand600} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Legal Documents Section */}
        <View style={[styles.section, { backgroundColor: themeColors.sectionBg }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
            Хууль эрх зүй
          </Text>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: themeColors.border }]} 
            onPress={openEulaModal}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="document-text" size={20} color={theme.brand600} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: themeColors.text }]}>
                  Хэрэглэгчийн гэрээ (EULA)
                </Text>
                <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
                  {user?.eulaAccepted ? `Зөвшөөрсөн: ${user.eulaAcceptedAt ? new Date(user.eulaAcceptedAt).toLocaleDateString('mn-MN') : ''}` : 'Хараагүй'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: themeColors.border }]} 
            onPress={openTermsModal}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="newspaper" size={20} color={theme.brand600} />
              </View>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>
                Үйлчилгээний нөхцөл
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: themeColors.border }]} 
            onPress={openPrivacyModal}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="shield" size={20} color={theme.brand600} />
              </View>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>
                Нууцлалын бодлого
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={[styles.section, { backgroundColor: themeColors.sectionBg }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
            Бусад
          </Text>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: themeColors.border }]} 
            onPress={() => Alert.alert("Тусламж", "Тусламжийн төв удахгүй нэмэгдэнэ")}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="help-circle" size={20} color={theme.brand600} />
              </View>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>
                Тусламж
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.settingItem, { borderBottomColor: themeColors.border }]}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="information-circle" size={20} color={theme.brand600} />
              </View>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>
                Хувилбар
              </Text>
            </View>
            <Text style={[styles.versionText, { color: themeColors.textSecondary }]}>
              1.0.0
            </Text>
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

      {/* EULA Modal */}
      <Modal
        visible={eulaModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEulaModalVisible(false)}
      >
        <View style={[styles.fullModalContainer, { 
          backgroundColor: themeColors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom 
        }]}>
          <View style={[styles.fullModalHeader, { 
            backgroundColor: themeColors.surface,
            borderBottomColor: themeColors.border 
          }]}>
            <Text style={[styles.fullModalTitle, { color: themeColors.text }]}>
              Хэрэглэгчийн гэрээ (EULA)
            </Text>
            <TouchableOpacity onPress={() => setEulaModalVisible(false)}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={[styles.fullModalContent, { backgroundColor: themeColors.background }]}>
            {loadingEula ? (
              <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
                Ачаалж байна...
              </Text>
            ) : eulaContent ? (
              <>
                <Text style={[styles.documentTitle, { color: themeColors.text }]}>
                  {eulaContent.title}
                </Text>
                <Text style={[styles.documentVersion, { color: themeColors.textSecondary }]}>
                  Хувилбар: {eulaContent.version}
                </Text>
                <Text style={[styles.documentDate, { color: themeColors.textSecondary }]}>
                  Хүчинтэй огноо: {new Date(eulaContent.effectiveDate).toLocaleDateString('mn-MN')}
                </Text>

                <View style={styles.documentSection}>
                  <Text style={[styles.documentSectionTitle, { color: themeColors.text }]}>
                    1. EULA
                  </Text>
                  <Text style={[styles.documentText, { color: themeColors.textSecondary }]}>
                    {eulaContent.sections?.eula}
                  </Text>
                </View>

                <View style={styles.documentSection}>
                  <Text style={[styles.documentSectionTitle, { color: themeColors.text }]}>
                    2. Нууцлалын бодлого
                  </Text>
                  <Text style={[styles.documentText, { color: themeColors.textSecondary }]}>
                    {eulaContent.sections?.privacyPolicy}
                  </Text>
                </View>

                <View style={styles.documentSection}>
                  <Text style={[styles.documentSectionTitle, { color: themeColors.text }]}>
                    3. Үйлчилгээний нөхцөл
                  </Text>
                  <Text style={[styles.documentText, { color: themeColors.textSecondary }]}>
                    {eulaContent.sections?.termsOfService}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                EULA олдсонгүй
              </Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        visible={termsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={[styles.fullModalContainer, { 
          backgroundColor: themeColors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom 
        }]}>
          <View style={[styles.fullModalHeader, { 
            backgroundColor: themeColors.surface,
            borderBottomColor: themeColors.border 
          }]}>
            <Text style={[styles.fullModalTitle, { color: themeColors.text }]}>
              Үйлчилгээний нөхцөл
            </Text>
            <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={[styles.fullModalContent, { backgroundColor: themeColors.background }]}>
            {loadingEula ? (
              <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
                Ачаалж байна...
              </Text>
            ) : eulaContent?.sections?.termsOfService ? (
              <Text style={[styles.documentText, { color: themeColors.textSecondary }]}>
                {eulaContent.sections.termsOfService}
              </Text>
            ) : (
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                Үйлчилгээний нөхцөл олдсонгүй
              </Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={privacyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={[styles.fullModalContainer, { 
          backgroundColor: themeColors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom 
        }]}>
          <View style={[styles.fullModalHeader, { 
            backgroundColor: themeColors.surface,
            borderBottomColor: themeColors.border 
          }]}>
            <Text style={[styles.fullModalTitle, { color: themeColors.text }]}>
              Нууцлалын бодлого
            </Text>
            <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={[styles.fullModalContent, { backgroundColor: themeColors.background }]}>
            {loadingEula ? (
              <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
                Ачаалж байна...
              </Text>
            ) : eulaContent?.sections?.privacyPolicy ? (
              <Text style={[styles.documentText, { color: themeColors.textSecondary }]}>
                {eulaContent.sections.privacyPolicy}
              </Text>
            ) : (
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                Нууцлалын бодлого олдсонгүй
              </Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Theme Selection Modal */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Харагдах байдлыг сонгох
            </Text>
            
            <TouchableOpacity
              style={[
                styles.themeOption,
                { 
                  backgroundColor: themeMode === 'system' ? theme.brand50 : 'transparent',
                  borderColor: themeColors.border 
                }
              ]}
              onPress={() => {
                setThemeMode('system');
                setThemeModalVisible(false);
              }}
            >
              <View style={styles.themeOptionLeft}>
                <Ionicons 
                  name="phone-portrait-outline" 
                  size={24} 
                  color={themeMode === 'system' ? theme.brand600 : themeColors.textSecondary} 
                />
                <View style={styles.themeOptionText}>
                  <Text style={[styles.themeOptionTitle, { color: themeColors.text }]}>
                    Утасны тохиргоог дагах
                  </Text>
                  <Text style={[styles.themeOptionDescription, { color: themeColors.textSecondary }]}>
                    Утасны харанхуй/цайвар горимыг дагана
                  </Text>
                </View>
              </View>
              {themeMode === 'system' && (
                <Ionicons name="checkmark-circle" size={24} color={theme.brand600} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { 
                  backgroundColor: themeMode === 'light' ? theme.brand50 : 'transparent',
                  borderColor: themeColors.border 
                }
              ]}
              onPress={() => {
                setThemeMode('light');
                setThemeModalVisible(false);
              }}
            >
              <View style={styles.themeOptionLeft}>
                <Ionicons 
                  name="sunny" 
                  size={24} 
                  color={themeMode === 'light' ? theme.brand600 : themeColors.textSecondary} 
                />
                <View style={styles.themeOptionText}>
                  <Text style={[styles.themeOptionTitle, { color: themeColors.text }]}>
                    Цайвар горим
                  </Text>
                  <Text style={[styles.themeOptionDescription, { color: themeColors.textSecondary }]}>
                    Цайвар дэлгэц ашиглах
                  </Text>
                </View>
              </View>
              {themeMode === 'light' && (
                <Ionicons name="checkmark-circle" size={24} color={theme.brand600} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { 
                  backgroundColor: themeMode === 'dark' ? theme.brand50 : 'transparent',
                  borderColor: themeColors.border 
                }
              ]}
              onPress={() => {
                setThemeMode('dark');
                setThemeModalVisible(false);
              }}
            >
              <View style={styles.themeOptionLeft}>
                <Ionicons 
                  name="moon" 
                  size={24} 
                  color={themeMode === 'dark' ? theme.brand600 : themeColors.textSecondary} 
                />
                <View style={styles.themeOptionText}>
                  <Text style={[styles.themeOptionTitle, { color: themeColors.text }]}>
                    Харанхуй горим
                  </Text>
                  <Text style={[styles.themeOptionDescription, { color: themeColors.textSecondary }]}>
                    Нүдэнд ээлтэй харанхуй дэлгэц
                  </Text>
                </View>
              </View>
              {themeMode === 'dark' && (
                <Ionicons name="checkmark-circle" size={24} color={theme.brand600} />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalClose} 
              onPress={() => setThemeModalVisible(false)}
            >
              <Text style={[styles.modalCloseText, { color: themeColors.textSecondary }]}>
                Хаах
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Phone Modal */}
      <Modal
        visible={phoneModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closePhoneModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Утасны дугаар баталгаажуулах
            </Text>
            {phoneStep === "phone" ? (
              <>
                <TextInput
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  placeholder="Утасны дугаар (8 цифр)"
                  placeholderTextColor={themeColors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={8}
                  style={[styles.modalInput, { 
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }]}
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
                  placeholderTextColor={themeColors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.modalInput, { 
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }]}
                />
                {phoneCountdown > 0 ? (
                  <Text style={[styles.countdownText, { color: themeColors.textSecondary }]}>
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
              <Text style={[styles.modalCloseText, { color: themeColors.textSecondary }]}>
                Хаах
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
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
    borderBottomColor: themeColors.border,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerActive: {
    backgroundColor: theme.brand600,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: theme.brand600,
    fontWeight: "600",
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: "500",
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: theme.white,
    borderRadius: 20,
    padding: 28,
    gap: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.gray900,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: theme.gray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: theme.gray900,
    backgroundColor: theme.gray50,
    fontWeight: "500",
  },
  modalButton: {
    backgroundColor: theme.brand600,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: theme.brand600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
  fullModalContainer: {
    flex: 1,
  },
  fullModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  fullModalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  fullModalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 32,
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  documentVersion: {
    fontSize: 14,
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 14,
    marginBottom: 24,
  },
  documentSection: {
    marginBottom: 24,
  },
  documentSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  documentText: {
    fontSize: 15,
    lineHeight: 24,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  themeOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  themeOptionText: {
    flex: 1,
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  themeOptionDescription: {
    fontSize: 13,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
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
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerActive: {
    backgroundColor: theme.brand600,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: theme.brand600,
    fontWeight: "600",
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: "500",
  },
  versionText: {
    fontSize: 14,
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: theme.white,
    borderRadius: 20,
    padding: 28,
    gap: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.gray900,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: theme.gray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: theme.gray900,
    backgroundColor: theme.gray50,
    fontWeight: "500",
  },
  modalButton: {
    backgroundColor: theme.brand600,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: theme.brand600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
  fullModalContainer: {
    flex: 1,
  },
  fullModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  fullModalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  fullModalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 32,
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  documentVersion: {
    fontSize: 14,
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 14,
    marginBottom: 24,
  },
  documentSection: {
    marginBottom: 24,
  },
  documentSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  documentText: {
    fontSize: 15,
    lineHeight: 24,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  themeOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  themeOptionText: {
    flex: 1,
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  themeOptionDescription: {
    fontSize: 13,
  },
});
