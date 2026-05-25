import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "../../src/api";
import theme from "../theme";
import { useTheme } from "../../src/contexts/ThemeContext";

export default function ForgotPasswordScreen() {
  const { isDarkMode, themeColors } = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [showTempPassword, setShowTempPassword] = useState(false);

  const handleRequestTempPassword = async () => {
    if (!identifier) {
      Alert.alert("Алдаа", "Имэйл эсвэл утасны дугаараа оруулна уу");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/users/forgot-password-temp", {
        identifier: identifier.trim(),
      });

      if (response.data.success && response.data.tempPassword) {
        setTempPassword(response.data.tempPassword);
        setShowTempPassword(true);
        Alert.alert(
          "Амжилттай",
          `Түр нууц үг: ${response.data.tempPassword}\n\nЭнэ нууц үгээр нэвтэрч, шинэ нууц үг үүсгэнэ үү.\n\nХүчинтэй хугацаа: ${response.data.expiresIn}`,
          [{ text: "OK" }]
        );
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Түр нууц үг үүсгэхэд алдаа гарлаа";
      Alert.alert("Алдаа", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    Clipboard.setString(tempPassword);
    Alert.alert("Хуулагдлаа", "Түр нууц үг clipboard-д хуулагдлаа");
  };

  const handleGoToLogin = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: theme.brand100 }]}>
            <Ionicons name="lock-closed-outline" size={48} color={theme.brand600} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: themeColors.text }]}>
            Нууц үг сэргээх
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {showTempPassword
              ? "Түр нууц үгээ хуулж аваад нэвтэрч орно уу"
              : "Имэйл эсвэл утасны дугаараа оруулна уу. Танд түр нууц үг үүсгэгдэнэ."}
          </Text>

          {!showTempPassword ? (
            <>
              {/* Input Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: themeColors.text }]}>
                  Имэйл / Утас
                </Text>
                <View style={[styles.inputWrapper, {
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.border
                }]}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={themeColors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder="example@email.com эсвэл 99999999"
                    placeholderTextColor={themeColors.textSecondary}
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleRequestTempPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.white} />
                ) : (
                  <>
                    <Ionicons name="key-outline" size={20} color={theme.white} />
                    <Text style={styles.submitButtonText}>Түр нууц үг авах</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Temporary Password Display */}
              <View style={[styles.tempPasswordCard, { backgroundColor: theme.success100 }]}>
                <View style={styles.tempPasswordHeader}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.success600} />
                  <Text style={[styles.tempPasswordTitle, { color: theme.success800 }]}>
                    Түр нууц үг үүсгэгдлээ
                  </Text>
                </View>

                <View style={[styles.tempPasswordBox, { backgroundColor: themeColors.surface }]}>
                  <Text style={[styles.tempPasswordLabel, { color: themeColors.textSecondary }]}>
                    Түр нууц үг:
                  </Text>
                  <View style={styles.tempPasswordRow}>
                    <Text style={[styles.tempPasswordValue, { color: themeColors.text }]}>
                      {tempPassword}
                    </Text>
                    <TouchableOpacity onPress={handleCopyPassword}>
                      <Ionicons name="copy-outline" size={24} color={theme.brand600} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.infoBox, { backgroundColor: theme.warning100 }]}>
                  <Ionicons name="time-outline" size={20} color={theme.warning700} />
                  <Text style={[styles.infoText, { color: theme.warning800 }]}>
                    Энэ нууц үг 24 цагийн турш хүчинтэй байна
                  </Text>
                </View>

                <View style={[styles.instructionsBox, { backgroundColor: themeColors.surface }]}>
                  <Text style={[styles.instructionsTitle, { color: themeColors.text }]}>
                    Дараагийн алхамууд:
                  </Text>
                  <View style={styles.instructionStep}>
                    <Text style={[styles.stepNumber, { color: theme.brand600, backgroundColor: theme.brand100 }]}>1</Text>
                    <Text style={[styles.stepText, { color: themeColors.textSecondary }]}>
                      Түр нууц үгээ хуулж авна уу
                    </Text>
                  </View>
                  <View style={styles.instructionStep}>
                    <Text style={[styles.stepNumber, { color: theme.brand600, backgroundColor: theme.brand100 }]}>2</Text>
                    <Text style={[styles.stepText, { color: themeColors.textSecondary }]}>
                      Нэвтрэх хуудас руу буцна уу
                    </Text>
                  </View>
                  <View style={styles.instructionStep}>
                    <Text style={[styles.stepNumber, { color: theme.brand600, backgroundColor: theme.brand100 }]}>3</Text>
                    <Text style={[styles.stepText, { color: themeColors.textSecondary }]}>
                      Түр нууц үгээр нэвтэрнэ үү
                    </Text>
                  </View>
                  <View style={styles.instructionStep}>
                    <Text style={[styles.stepNumber, { color: theme.brand600, backgroundColor: theme.brand100 }]}>4</Text>
                    <Text style={[styles.stepText, { color: themeColors.textSecondary }]}>
                      Шинэ нууц үг үүсгэнэ үү
                    </Text>
                  </View>
                </View>
              </View>

              {/* Go to Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: theme.brand600 }]}
                onPress={handleGoToLogin}
              >
                <Ionicons name="log-in-outline" size={20} color={theme.white} />
                <Text style={styles.loginButtonText}>Нэвтрэх хуудас руу очих</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Back to Login Link */}
          {!showTempPassword && (
            <View style={styles.backToLoginContainer}>
              <Text style={[styles.backToLoginText, { color: themeColors.textSecondary }]}>
                Нууц үгээ санаж байна уу?{" "}
              </Text>
              <TouchableOpacity onPress={handleGoToLogin}>
                <Text style={[styles.backToLoginLink, { color: theme.brand600 }]}>
                  Нэвтрэх
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: theme.brand600,
    borderRadius: 12,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: "600",
  },
  tempPasswordCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  tempPasswordHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  tempPasswordTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  tempPasswordBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tempPasswordLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  tempPasswordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tempPasswordValue: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
    fontWeight: "500",
  },
  instructionsBox: {
    borderRadius: 12,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  instructionStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: "center",
    lineHeight: 24,
    fontSize: 14,
    fontWeight: "700",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 24,
  },
  loginButton: {
    borderRadius: 12,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  loginButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: "600",
  },
  backToLoginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  backToLoginText: {
    fontSize: 14,
  },
  backToLoginLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});

