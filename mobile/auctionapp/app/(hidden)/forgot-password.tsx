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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "../../src/api";
import theme from "../theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Алдаа", "Имэйл хаягаа оруулна уу");
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert("Алдаа", "Зөв имэйл хаяг оруулна уу");
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const response = await api.post("/api/users/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      if (response.status === 200) {
        setSuccess(true);
        Alert.alert(
          "Амжилттай",
          "Хэрэв энэ имэйл бүртгэлтэй бол нууц үг сэргээх линк имэйл хаягруу илгээгдсэн болно.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Алдаа гарлаа. Дахин оролдоно уу.";
      Alert.alert("Алдаа", errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.headerTitle}>Нууц үг сэргээх</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed" size={48} color={theme.brand600} />
              </View>
            </View>

            {/* Title and Description */}
            <Text style={styles.title}>Нууц үг мартсан уу?</Text>
            <Text style={styles.description}>
              Бүртгэлтэй имэйл хаягаа оруулбал, нууц үг сэргээх линк имэйл хаягруу илгээгдэнэ.
            </Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Имэйл хаяг</Text>
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
                  editable={!loading}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.white} />
              ) : (
                <>
                  <Ionicons name="send" size={20} color={theme.white} />
                  <Text style={styles.submitButtonText}>Илгээх</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Success Message */}
            {success && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={24} color={theme.success600} />
                <Text style={styles.successText}>
                  Имэйл илгээгдлээ. Имэйл хаягаа шалгана уу.
                </Text>
              </View>
            )}

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => router.back()}
            >
              <Text style={styles.backToLoginText}>
                Нэвтрэх хуудас руу буцах
              </Text>
            </TouchableOpacity>
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.brand100,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.gray900,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: theme.gray600,
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
    color: theme.gray900,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.gray50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.gray200,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.gray900,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.brand600,
    borderRadius: 12,
    height: 56,
    gap: 8,
    shadowColor: theme.brand600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.white,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.success50,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.success200,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: theme.success700,
    lineHeight: 20,
  },
  backToLogin: {
    marginTop: 24,
    alignItems: "center",
  },
  backToLoginText: {
    fontSize: 14,
    color: theme.brand600,
    fontWeight: "600",
  },
});

