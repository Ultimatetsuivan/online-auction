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
  Switch,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "../../src/api";
import theme from "../theme";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: email verification, 2: registration
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [agreeEula, setAgreeEula] = useState(false);
  const [eula, setEula] = useState<any>(null);
  const [eulaModalVisible, setEulaModalVisible] = useState(false);
  const [eulaError, setEulaError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEula = async () => {
      try {
        const response = await api.get("/api/legal/eula/current");
        setEula(response.data?.eula || null);
      } catch (error) {
        console.error("EULA fetch error:", error);
      }
    };

    fetchEula();
  }, []);

  const eulaPlainText = useMemo(() => {
    if (!eula) return "";
    const raw = eula?.contentMn || eula?.content || "";
    return raw.replace(/<[^>]+>/g, "");
  }, [eula]);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert("Алдаа", "Имэйл хаягаа оруулна уу");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Алдаа", "Зөв имэйл хаяг оруулна уу");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/users/send-code", { email: email.trim() });
      Alert.alert("Амжилттай", "Баталгаажуулах код таны имэйл рүү илгээгдлээ");
      setStep(2);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Код илгээхэд алдаа гарлаа";
      Alert.alert("Алдаа", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!verificationCode) {
      Alert.alert("Алдаа", "Баталгаажуулах кодоо оруулна уу");
      return;
    }

    if (!name || !password || !confirmPassword) {
      Alert.alert("Алдаа", "Бүх мэдээллээ бөглөнө үү");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Алдаа", "Нууц үг таарахгүй байна");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Алдаа", "Нууц үг хамгийн багадаа 6 тэмдэгтээс бүрдэнэ");
      return;
    }

    if (!agreeEula) {
      setEulaError("Үйлчилгээний нөхцөлийг зөвшөөрнө үү.");
      return;
    }
    setEulaError(null);

    setIsVerifying(true);
    try {
      // First verify the code
      await api.post("/api/users/verify-email", {
        email: email.trim(),
        code: verificationCode.trim(),
      });

      // Then register
      await api.post("/api/users/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      Alert.alert("Амжилттай", "Бүртгэл амжилттай боллоо. Нэвтэрнэ үү", [
        {
          text: "OK",
          onPress: () => router.replace("/(hidden)/login"),
        },
      ]);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Бүртгэл үүсгэхэд алдаа гарлаа";
      Alert.alert("Алдаа", errorMessage);
    } finally {
      setIsVerifying(false);
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
              onPress={() => {
                if (step === 2) {
                  setStep(1);
                } else {
                  router.back();
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color={theme.gray900} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Бүртгүүлэх</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]}>
              <Text style={[styles.progressText, step >= 1 && styles.progressTextActive]}>1</Text>
            </View>
            <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
            <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]}>
              <Text style={[styles.progressText, step >= 2 && styles.progressTextActive]}>2</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {step === 1 ? (
              <>
                <Text style={styles.stepTitle}>Имэйл баталгаажуулах</Text>
                <Text style={styles.stepDescription}>
                  Бүртгүүлэхийн тулд имэйл хаягаа баталгаажуулна уу
                </Text>

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

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.white} />
                  ) : (
                    <Text style={styles.buttonText}>Код илгээх</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.stepTitle}>Бүртгэл үүсгэх</Text>
                <Text style={styles.stepDescription}>
                  {email} хаягт илгээсэн кодыг оруулна уу
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Баталгаажуулах код</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={20}
                      color={theme.gray500}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="6 оронтой код"
                      placeholderTextColor={theme.gray400}
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </View>

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
                    />
                  </View>
                </View>

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

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Нууц үг давтах</Text>
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
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color={theme.gray500}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.eulaContainer}>
                  <View style={styles.eulaHeader}>
                    <Text style={styles.eulaTitle}>
                      {(eula?.titleMn || eula?.title || 'EULA')} {eula?.version ? `(v${eula.version})` : ''}
                    </Text>
                    {eula ? (
                      <TouchableOpacity onPress={() => setEulaModalVisible(true)}>
                        <Text style={styles.eulaLink}>Дэлгэрэнгүй</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.eulaLink}>Ачааллаж байна...</Text>
                    )}
                  </View>
                  <View style={styles.eulaToggle}>
                    <Text style={styles.eulaToggleText}>Үйлчилгээний нөхцөлийг зөвшөөрнө үү</Text>
                    <Switch
                      value={agreeEula}
                      onValueChange={(value) => {
                        setAgreeEula(value);
                        if (value) setEulaError(null);
                      }}
                    />
                  </View>
                  {eulaError && <Text style={styles.eulaError}>{eulaError}</Text>}
                </View>

                <TouchableOpacity
                  style={[styles.button, isVerifying && styles.buttonDisabled]}
                  onPress={handleVerifyAndRegister}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <ActivityIndicator color={theme.white} />
                  ) : (
                    <Text style={styles.buttonText}>Бүртгүүлэх</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Бүртгэлтэй юу? </Text>
              <TouchableOpacity onPress={() => router.push("/(hidden)/login")}>
                <Text style={styles.loginLink}>Нэвтрэх</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={Boolean(eula) && eulaModalVisible}
        animationType="slide"
        onRequestClose={() => setEulaModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{eula?.titleMn || eula?.title || 'EULA'}</Text>
            <TouchableOpacity onPress={() => setEulaModalVisible(false)}>
              <Text style={styles.modalCloseText}>Хаах</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalBody}>
              {eulaPlainText || 'EULA-ийн агуулга одоогоор бэлэн биш байна.'}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 80,
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  progressStepActive: {
    backgroundColor: theme.brand600,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.gray500,
  },
  progressTextActive: {
    color: theme.white,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: theme.gray200,
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: theme.brand600,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.gray900,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: theme.gray500,
    marginBottom: 24,
    lineHeight: 20,
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
  button: {
    backgroundColor: theme.brand600,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.white,
  },
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
    color: theme.gray500,
  },
  loginLink: {
    fontSize: 14,
    color: theme.brand600,
    fontWeight: "600",
  },
  eulaContainer: {
    backgroundColor: theme.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.gray200,
  },
  eulaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  eulaTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.gray900,
    flex: 1,
    marginRight: 12,
  },
  eulaLink: {
    fontSize: 14,
    color: theme.brand600,
    fontWeight: "600",
  },
  eulaToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eulaToggleText: {
    flex: 1,
    marginRight: 12,
    color: theme.gray700,
  },
  eulaError: {
    color: "#dc3545",
    marginTop: 8,
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.white,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.gray900,
  },
  modalCloseText: {
    fontSize: 16,
    color: theme.brand600,
    fontWeight: "600",
  },
  modalContent: {
    padding: 20,
  },
  modalBody: {
    fontSize: 14,
    color: theme.gray800,
    lineHeight: 20,
  },
});
