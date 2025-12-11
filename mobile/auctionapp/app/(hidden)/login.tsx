import React, { useEffect, useMemo, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "../../src/api";
import theme from "../theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../src/contexts/ThemeContext";

// Google Sign-In temporarily disabled - will be implemented later
// import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';


export default function LoginScreen() {
  const { isDarkMode, themeColors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Google Sign-In configuration - temporarily disabled
  // useEffect(() => {
  //   const configureGoogleSignIn = async () => {
  //     try {
  //       const response = await api.get("/api/users/google/client-id");
  //       const webClientId = response.data?.clientIds?.web || response.data?.clientId || "377856194024-6ud79er14h5nnfhgpqbtuh2umldrk156.apps.googleusercontent.com";
  //       GoogleSignin.configure({
  //         webClientId: webClientId,
  //         offlineAccess: true,
  //         forceCodeForRefreshToken: true,
  //       });
  //       console.log("Google Sign In configured with webClientId:", webClientId);
  //     } catch (error) {
  //       console.error("Failed to configure Google Sign In:", error);
  //     }
  //   };
  //   configureGoogleSignIn();
  // }, []);

  const persistUserSession = async (userData: any) => {
    await AsyncStorage.setItem("user", JSON.stringify(userData));
    if (userData?.token) {
      await AsyncStorage.setItem("token", userData.token);
    }
  };

  const navigateHome = () => {
    Alert.alert("Амжилттай", "Нэвтрэлт амжилттай боллоо", [
      {
        text: "OK",
        onPress: () => router.replace("/(tabs)"),
      },
    ]);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Алдаа", "Имэйл болон нууц үгээ оруулна уу");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/users/login", {
        email: email.trim(),
        password,
      });

      if (response.status === 200) {
        await persistUserSession(response.data);
        navigateHome();
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Нэвтрэх үед алдаа гарлаа";
      Alert.alert("Алдаа", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In handler - temporarily disabled, will show "not available" message
  const handleGoogleSignIn = () => {
    Alert.alert(
      "Одоогоор ашиглах боломжгүй",
      "Google нэвтрэх систем тун удахгүй нэмэгдэнэ."
    );
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
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={themeColors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Нэвтрэх</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Logo or App Name */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="bag-handle" size={48} color={theme.brand600} />
            </View>
            <Text style={styles.appName}>Дуудлага худалдаа</Text>
            <Text style={styles.subtitle}>Өөрийн бүтээгдэхүүнээ зарж, худалдан аваарай</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: themeColors.text }]}>Имэйл</Text>
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
                  placeholder="example@email.com"
                  placeholderTextColor={themeColors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: themeColors.text }]}>Нууц үг</Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: themeColors.inputBg,
                borderColor: themeColors.border 
              }]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={themeColors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput, { color: themeColors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={themeColors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={() => router.push("/(hidden)/forgot-password")}
            >
              <Text style={styles.forgotPasswordText}>Нууц үг мартсан?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.white} />
              ) : (
                <Text style={styles.loginButtonText}>Нэвтрэх</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>эсвэл</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Phone Auth Button */}
            <TouchableOpacity
              style={styles.phoneButton}
              onPress={() => router.push("/(hidden)/phone-auth")}
            >
              <Ionicons name="call-outline" size={20} color={theme.gray700} />
              <Text style={styles.phoneButtonText}>Утасны дугаараар нэвтрэх</Text>
            </TouchableOpacity>

            {/* Google Auth Button - Shows "not available" message when clicked */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
            >
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={styles.googleButtonText}>Google-ээр нэвтрэх</Text>
            </TouchableOpacity>

            {/* eMongolia Auth Button */}
            <TouchableOpacity
              style={styles.eMongoliaButton}
              onPress={() => Alert.alert("eMongolia", "eMongolia нэвтрэх систем тун удахгүй нэмэгдэнэ")}
            >
              <Ionicons name="shield-checkmark" size={20} color="#0066CC" />
              <Text style={styles.eMongoliaButtonText}>eMongolia-аар нэвтрэх</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Бүртгэлгүй юу? </Text>
              <TouchableOpacity onPress={() => router.push("/(hidden)/register")}>
                <Text style={styles.registerLink}>Бүртгүүлэх</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.gray900,
  },
  placeholder: {
    width: 40,
  },
  logoContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.brand100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.gray900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.gray500,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.gray900,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.gray200,
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.gray900,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    padding: 8,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: theme.brand600,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: theme.brand600,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.white,
  },
  registerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  registerText: {
    fontSize: 14,
    color: theme.gray500,
  },
  registerLink: {
    fontSize: 14,
    color: theme.brand600,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.gray200,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: theme.gray400,
  },
  phoneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.white,
    borderWidth: 1.5,
    borderColor: theme.gray300,
    borderRadius: 12,
    height: 52,
    marginBottom: 12,
    gap: 8,
  },
  phoneButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.gray700,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.white,
    borderWidth: 1.5,
    borderColor: theme.gray300,
    borderRadius: 12,
    height: 52,
    marginBottom: 16,
    gap: 8,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.gray700,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  eMongoliaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.white,
    borderWidth: 1.5,
    borderColor: "#0066CC",
    borderRadius: 12,
    height: 52,
    marginBottom: 16,
    gap: 8,
  },
  eMongoliaButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0066CC",
  },
});
