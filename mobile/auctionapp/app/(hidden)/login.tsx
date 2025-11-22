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
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";

type GoogleClientIds = {
  web?: string | null;
  android?: string | null;
  ios?: string | null;
  expo?: string | null;
};

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleClients, setGoogleClients] = useState<GoogleClientIds>({});

  const resolvedGoogleIds = useMemo(() => {
    const web = googleClients.web ?? null;
    const android = googleClients.android ?? null;
    const ios = googleClients.ios ?? null;
    const expo = googleClients.expo ?? null;
    return { web, android, ios, expo };
  }, [googleClients]);

  const defaultGoogleClientId =
    resolvedGoogleIds.expo ||
    resolvedGoogleIds.android ||
    resolvedGoogleIds.ios ||
    resolvedGoogleIds.web ||
    "DUMMY.apps.googleusercontent.com";
  const hasGoogleClientConfig = Boolean(
    resolvedGoogleIds.expo ||
      resolvedGoogleIds.android ||
      resolvedGoogleIds.ios ||
      resolvedGoogleIds.web
  );

  const redirectUri = useMemo(() => {
    if (Platform.OS === 'web') {
      return makeRedirectUri({
        scheme: 'https',
        path: 'auth/callback'
      });
    }
    // For mobile, we must use the proxy
    return 'https://auth.expo.io/@buhuu/auctionapp';
  }, []);

  console.log("Google OAuth redirectUri =>", redirectUri);

  const [googleRequest, googleResponse, googlePromptAsync] =
    Google.useAuthRequest({
      expoClientId: resolvedGoogleIds.expo || "377856194024-6ud79er14h5nnfhgpqbtuh2umldrk156.apps.googleusercontent.com",
      iosClientId: resolvedGoogleIds.ios || "377856194024-6ud79er14h5nnfhgpqbtuh2umldrk156.apps.googleusercontent.com",
      androidClientId: resolvedGoogleIds.android || undefined,
      webClientId: resolvedGoogleIds.web || "377856194024-6ud79er14h5nnfhgpqbtuh2umldrk156.apps.googleusercontent.com",
      redirectUri,
    });

  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const response = await api.get("/api/users/google/client-id");
        if (response.data) {
          const ids = response.data.clientIds || {};
          console.log("Fetched Google Client IDs:", ids);
          setGoogleClients({
            web: ids.web ?? response.data.clientId ?? null,
            android: ids.android ?? null,
            ios: ids.ios ?? null,
            expo: ids.expo ?? null,
          });
        }
      } catch (error) {
        console.error("Failed to fetch Google client ID:", error);
      }
    };
    fetchClientId();
  }, []);

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

  const handleGoogleCredential = async (accessToken: string) => {
    try {
      // Get user info from Google
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const userInfo = await userInfoResponse.json();
      console.log("Google user info:", userInfo);

      // Send user info to backend
      const response = await api.post("/api/users/google-mobile", {
        googleId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      });

      if (response.status === 200) {
        await persistUserSession(response.data);
        navigateHome();
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Google нэвтрэх үед алдаа гарлаа.";
      Alert.alert("Алдаа", errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLoginPress = async () => {
    if (!hasGoogleClientConfig || !googleRequest) {
      Alert.alert(
        "Анхааруулга",
        "Google нэвтрэх тохиргоо байхгүй байна. Энэ функцийг дараа ашиглах боломжтой."
      );
      return;
    }
    try {
      setGoogleLoading(true);
      const result = await googlePromptAsync({ useProxy: true });
      if (!result || result.type !== "success") {
        setGoogleLoading(false);
      }
    } catch (error) {
      console.error("Google prompt error:", error);
      Alert.alert(
        "Алдаа",
        "Google нэвтрэх явцад алдаа гарлаа. Дахин оролдоно уу."
      );
      setGoogleLoading(false);
    }
  };
  useEffect(() => {
    if (googleResponse?.type === "success") {
      const accessToken = googleResponse.authentication?.accessToken;
      console.log("Google auth success, access token:", accessToken ? "present" : "missing");
      if (accessToken) {
        handleGoogleCredential(accessToken);
        return;
      } else {
        Alert.alert("Алдаа", "Google access token олдсонгүй");
        setGoogleLoading(false);
      }
    }

    if (googleResponse && googleResponse.type !== "success") {
      console.log("Google auth not successful:", googleResponse.type);
      setGoogleLoading(false);
    }
  }, [googleResponse]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.gray900} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Нэвтрэх</Text>
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
              <Text style={styles.label}>Имэйл</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.gray500}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor={theme.gray400}
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
              <Text style={styles.label}>Нууц үг</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.gray500}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.gray400}
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
                    color={theme.gray500}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPasswordContainer}>
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

            {/* Google Auth Button */}
            <TouchableOpacity
              style={[
                styles.googleButton,
                (!hasGoogleClientConfig || googleLoading) && styles.googleButtonDisabled,
              ]}
              onPress={handleGoogleLoginPress}
              disabled={!hasGoogleClientConfig || googleLoading}
            >
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              {googleLoading ? (
                <ActivityIndicator color={theme.gray700} />
              ) : (
                <Text style={styles.googleButtonText}>Google-ээр нэвтрэх</Text>
              )}
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
});
