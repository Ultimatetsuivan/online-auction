import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import theme from "../theme";
import { api } from "../../src/api";

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Ачаалж байна...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.guestContainer}>
          <View style={styles.guestContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={64} color={theme.brand600} />
            </View>
            <Text style={styles.guestTitle}>Нэвтрэх шаардлагатай</Text>
            <Text style={styles.guestSubtitle}>
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Профайл</Text>
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>{user.name || "User"}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.balance !== undefined && (
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Үлдэгдэл</Text>
              <Text style={styles.balanceAmount}>₮{user.balance.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* Verification Status */}
        {user && (
          <View style={styles.verificationSection}>
            {user.isVerified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                <Text style={styles.verifiedText}>Баталгаажсан хэрэглэгч</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={() => setVerificationModalVisible(true)}
              >
                <Ionicons name="shield-outline" size={20} color={theme.brand600} />
                <Text style={styles.verifyButtonText}>Хэрэглэгч баталгаажуулах</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.brand600} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="add-circle-outline"
            title="Бүтээгдэхүүн нэмэх"
            onPress={() => router.push("/(tabs)/search")}
            highlight
          />
          <MenuItem
            icon="cube-outline"
            title="Миний зарууд"
            onPress={() => router.push("/(tabs)/selling")}
          />
          <MenuItem
            icon="bag-handle-outline"
            title="Худалдан авсан"
            onPress={() => {}}
          />
          <MenuItem
            icon="heart-outline"
            title="Хадгалсан"
            onPress={() => router.push("/(tabs)/notifications")}
          />
          <MenuItem
            icon="card-outline"
            title="Төлбөрийн хэрэгсэл"
            onPress={() => {}}
          />
          <MenuItem
            icon="settings-outline"
            title="Тохиргоо"
            onPress={() => router.push("/(hidden)/settings")}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Гарах</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Verification Modal */}
      <Modal
        visible={verificationModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVerificationModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setVerificationModalVisible(false)}>
              <Ionicons name="close" size={28} color={theme.gray900} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Хэрэглэгч баталгаажуулах</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Хэрэглэгчийн баталгаажуулалт хийхийн тулд өөрийн иргэний үнэмлэх эсвэл гадаад паспортын зургийг болон таны нүүрний селфи зургийг авна уу.
            </Text>

            {/* Document Upload */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadTitle}>
                <Ionicons name="card-outline" size={18} color={theme.gray700} /> Бичиг баримт
              </Text>
              {documentImage ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: documentImage }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setDocumentImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadButtons}>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => takePhoto("document")}
                  >
                    <Ionicons name="camera" size={24} color={theme.brand600} />
                    <Text style={styles.uploadButtonText}>Камераар авах</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickImage("document")}
                  >
                    <Ionicons name="image" size={24} color={theme.brand600} />
                    <Text style={styles.uploadButtonText}>Зураг сонгох</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Selfie Upload */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadTitle}>
                <Ionicons name="person-outline" size={18} color={theme.gray700} /> Селфи зураг
              </Text>
              {selfieImage ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: selfieImage }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setSelfieImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadButtons}>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => takePhoto("selfie")}
                  >
                    <Ionicons name="camera" size={24} color={theme.brand600} />
                    <Text style={styles.uploadButtonText}>Камераар авах</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickImage("selfie")}
                  >
                    <Ionicons name="image" size={24} color={theme.brand600} />
                    <Text style={styles.uploadButtonText}>Зураг сонгох</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={theme.brand600} />
              <Text style={styles.infoText}>
                Таны хувийн мэдээлэл нууцлагдах бөгөөд зөвхөн баталгаажуулалтын зориулалтаар ашиглагдана.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!documentImage || !selfieImage || uploading) && styles.submitButtonDisabled,
              ]}
              onPress={submitVerification}
              disabled={!documentImage || !selfieImage || uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Илгээх</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  title,
  onPress,
  highlight,
}: {
  icon: string;
  title: string;
  onPress: () => void;
  highlight?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, highlight && styles.menuItemHighlight]}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons
          name={icon as any}
          size={22}
          color={highlight ? theme.brand600 : theme.gray700}
        />
        <Text style={[styles.menuItemText, highlight && styles.menuItemTextHighlight]}>
          {title}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={highlight ? theme.brand600 : theme.gray400}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.gray50,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: theme.gray500,
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
    backgroundColor: theme.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray200,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.gray900,
  },
  userSection: {
    backgroundColor: theme.white,
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
    color: theme.gray900,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.gray500,
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
    backgroundColor: theme.white,
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
    borderBottomColor: theme.gray100,
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
    color: theme.gray900,
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
    backgroundColor: theme.white,
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
});
