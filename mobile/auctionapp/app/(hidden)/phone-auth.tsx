import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "../../src/api";
import theme from "../theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PhoneAuthScreen() {
  const [step, setStep] = useState<"phone" | "otp" | "register">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpInputs = useRef<Array<TextInput | null>>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    if (!phone || phone.length !== 8) {
      Alert.alert("Алдаа", "Утасны дугаараа зөв оруулна уу (8 орон)");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/auth/send-otp", {
        phone: phone.trim(),
      });

      if (response.status === 200) {
        Alert.alert("Амжилттай", "Баталгаажуулах код илгээгдлээ");
        setStep("otp");
        setCountdown(180); // 3 minutes
      }
    } catch (error: any) {
      console.error("Send OTP error:", error);
      const errorMessage =
        error.response?.data?.error || "Код илгээхэд алдаа гарлаа";
      Alert.alert("Алдаа", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      Alert.alert("Алдаа", "6 оронтой код оруулна уу");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/auth/verify-otp", {
        phone: phone.trim(),
        code: otpCode,
      });

      if (response.status === 200) {
        // Check if user exists (has name)
        if (response.data.user.name) {
          // Existing user - login successful
          await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
          await AsyncStorage.setItem("token", response.data.accessToken);

          Alert.alert("Амжилттай", "Нэвтрэлт амжилттай боллоо", [
            {
              text: "OK",
              onPress: () => router.replace("/(tabs)"),
            },
          ]);
        } else {
          // New user - need to register
          setStep("register");
        }
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      const errorMessage =
        error.response?.data?.error || "Код буруу байна";
      Alert.alert("Алдаа", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || name.trim().length < 2) {
      Alert.alert("Алдаа", "Нэрээ оруулна уу");
      return;
    }

    const otpCode = otp.join("");
    setLoading(true);
    try {
      const response = await api.post("/api/auth/register-phone", {
        phone: phone.trim(),
        code: otpCode,
        name: name.trim(),
      });

      if (response.status === 201) {
        await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
        await AsyncStorage.setItem("token", response.data.accessToken);

        Alert.alert("Баяр хүргэе!", "Бүртгэл амжилттай үүслээ", [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)"),
          },
        ]);
      }
    } catch (error: any) {
      console.error("Register error:", error);
      const errorMessage =
        error.response?.data?.error || "Бүртгэлд алдаа гарлаа";
      Alert.alert("Алдаа", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const renderPhoneStep = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Утасны дугаар</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="call-outline" size={40} color={theme.brand600} />
          </View>
        </View>

        <Text style={styles.title}>Утасны дугаар оруулна уу</Text>
        <Text style={styles.subtitle}>
          Бид танд баталгаажуулах код илгээх болно
        </Text>

        <View style={styles.phoneInputContainer}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>+976</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="99001122"
            placeholderTextColor={theme.gray400}
            value={phone}
            onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            maxLength={8}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.white} />
          ) : (
            <Text style={styles.buttonText}>Үргэлжлүүлэх</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backToEmailButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backToEmailText}>
            Имэйлээр нэвтрэх
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderOtpStep = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep("phone")}
        >
          <Ionicons name="arrow-back" size={24} color={theme.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Баталгаажуулах</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="chatbox-outline" size={40} color={theme.brand600} />
          </View>
        </View>

        <Text style={styles.title}>Код оруулна уу</Text>
        <Text style={styles.subtitle}>
          +976 {phone} дугаарт илгээгдсэн кодыг оруулна уу
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (otpInputs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleOtpKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {countdown > 0 ? (
          <Text style={styles.countdownText}>
            Дахин илгээх: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
          </Text>
        ) : (
          <TouchableOpacity onPress={handleSendOTP}>
            <Text style={styles.resendText}>Дахин илгээх</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerifyOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.white} />
          ) : (
            <Text style={styles.buttonText}>Баталгаажуулах</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderRegisterStep = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep("otp")}
        >
          <Ionicons name="arrow-back" size={24} color={theme.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Бүртгүүлэх</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="person-add-outline" size={40} color={theme.brand600} />
          </View>
        </View>

        <Text style={styles.title}>Таны мэдээлэл</Text>
        <Text style={styles.subtitle}>
          Нэрээ оруулаад бүртгэлээ дуусгана уу
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Нэр</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={20}
              color={theme.gray500}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Таны нэр"
              placeholderTextColor={theme.gray400}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoFocus
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.white} />
          ) : (
            <Text style={styles.buttonText}>Бүртгүүлэх</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {step === "phone" && renderPhoneStep()}
        {step === "otp" && renderOtpStep()}
        {step === "register" && renderRegisterStep()}
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.brand100,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.gray900,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.gray500,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  phoneInputContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  countryCode: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: theme.gray100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.gray200,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.gray900,
  },
  phoneInput: {
    flex: 1,
    height: 56,
    backgroundColor: theme.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.gray200,
    paddingHorizontal: 16,
    fontSize: 18,
    color: theme.gray900,
    fontWeight: "600",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: theme.gray200,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: theme.gray900,
  },
  otpInputFilled: {
    borderColor: theme.brand600,
    backgroundColor: theme.brand50,
  },
  countdownText: {
    fontSize: 14,
    color: theme.gray500,
    textAlign: "center",
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: theme.brand600,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
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
  button: {
    backgroundColor: theme.brand600,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.white,
  },
  backToEmailButton: {
    marginTop: 16,
    alignItems: "center",
  },
  backToEmailText: {
    fontSize: 14,
    color: theme.brand600,
    fontWeight: "600",
  },
});
