import React, { useEffect, useMemo, useState, useRef } from "react";
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
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../src/api";
import theme from "../theme";

export default function RegisterScreen() {
  const nameInputRef = useRef<TextInput>(null);
  const [surname, setSurname] = useState("");
  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: verification code, 3: eula (separate screen), 4: user details, 5: success
  const [verificationCode, setVerificationCode] = useState("");
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [agreeEula, setAgreeEula] = useState(false);
  const [eula, setEula] = useState<any>(null);
  const [eulaError, setEulaError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Clear old registration data and fetch EULA on mount
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        // Clear any old registration data when first opening the screen
        await AsyncStorage.removeItem('eulaAccepted');
        await AsyncStorage.removeItem('registrationEmail');
        await AsyncStorage.removeItem('registrationCode');

        // Fetch EULA
        const response = await api.get("/api/legal/eula/current");
        setEula(response.data?.eula || null);
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };

    initializeScreen();
  }, []);

  // Countdown timer for resending code
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus name input when reaching step 4
  // Disabled due to iOS autofill conflicts
  // useEffect(() => {
  //   if (step === 4) {
  //     setTimeout(() => {
  //       nameInputRef.current?.focus();
  //     }, 100);
  //   }
  // }, [step]);

  // Save current step to AsyncStorage for EULA screen
  useEffect(() => {
    const saveStep = async () => {
      await AsyncStorage.setItem('currentRegistrationStep', step.toString());
    };
    saveStep();
  }, [step]);

  // Check if returning from EULA acceptance screen
  useFocusEffect(
    React.useCallback(() => {
      const checkEulaAcceptance = async () => {
        try {
          const accepted = await AsyncStorage.getItem('eulaAccepted');
          const regEmail = await AsyncStorage.getItem('registrationEmail');

          // Only proceed if we have both values AND we're not already on step 4
          if (accepted === 'true' && regEmail && step !== 4) {
            setEmail(regEmail);
            setAgreeEula(true);
            setEulaError(null);
            setStep(4); // Move to final registration step (user details)
          }
        } catch (error) {
          console.error('Error checking EULA acceptance:', error);
        }
      };

      checkEulaAcceptance();
    }, [step])
  );

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
      setStep(2); // Go to verification code step
      setResendTimer(60); // Start 60 second countdown
      setCanResend(false);
      await AsyncStorage.setItem('currentRegistrationStep', '2'); // Now on verification step
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Код илгээхэд алдаа гарлаа";
      Alert.alert("Алдаа", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setLoading(true);
    try {
      await api.post("/api/users/send-code", { email: email.trim() });
      Alert.alert("Амжилттай", "Код дахин илгээгдлээ");
      setResendTimer(60); // Restart countdown
      setCanResend(false);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Код илгээхэд алдаа гарлаа";
      Alert.alert("Алдаа", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      Alert.alert("Алдаа", "Баталгаажуулах кодоо оруулна уу");
      return;
    }

    setIsVerifying(true);
    try {
      // Verify the code
      await api.post("/api/users/verify-email", {
        email: email.trim(),
        code: verificationCode.trim(),
      });

      // Save email and code for later use
      await AsyncStorage.setItem('registrationEmail', email.trim());
      await AsyncStorage.setItem('registrationCode', verificationCode.trim());
      await AsyncStorage.setItem('currentRegistrationStep', '3'); // Now on EULA step

      // Go to EULA screen
      router.push('/(hidden)/eula-acceptance');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Код баталгаажуулахад алдаа гарлаа";
      Alert.alert("Алдаа", errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!surname || !name || !registrationNumber || !password || !confirmPassword) {
      Alert.alert("Алдаа", "Бүх мэдээллээ бөглөнө үү");
      return;
    }

    // Validate registration number format (УГ + 8 digits)
    const regNumberRegex = /^УГ\d{8}$/;
    if (!regNumberRegex.test(registrationNumber)) {
      Alert.alert("Алдаа", "Регистрийн дугаар буруу байна. Жишээ: УГ99999999");
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

    setIsVerifying(true);
    try {
      // Register user
      console.log("Starting registration...");
      const registerResponse = await api.post("/api/users/register", {
        surname: surname.trim(),
        name: name.trim(),
        registrationNumber: registrationNumber.trim(),
        email: email.trim(),
        password,
        eulaAccepted: true,
        eulaAcceptedAt: new Date().toISOString(),
      });
      console.log("Registration successful:", registerResponse.data);

      // Auto-login after successful registration
      console.log("Starting auto-login...");
      const loginResponse = await api.post("/api/users/login", {
        email: email.trim(),
        password,
      });
      console.log("Login successful:", loginResponse.data);

      // Save token
      if (loginResponse.data?.token) {
        console.log("Saving token...");
        await AsyncStorage.setItem('authToken', loginResponse.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(loginResponse.data));

        // Show success screen first
        setRegistrationComplete(true);
        setStep(5);

        // Clear registration data after a delay so user sees success screen
        setTimeout(async () => {
          await AsyncStorage.removeItem('registrationEmail');
          await AsyncStorage.removeItem('registrationCode');
          await AsyncStorage.removeItem('eulaAccepted');
          await AsyncStorage.removeItem('currentRegistrationStep');
        }, 100);
      } else {
        console.error("No token in login response");
        Alert.alert("Алдаа", "Нэвтрэх токен олдсонгүй");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      console.error("Error response:", error.response?.data);
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
          scrollEnabled={true}
          nestedScrollEnabled={true}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (step === 4) {
                  // Go back to EULA
                  router.push('/(hidden)/eula-acceptance');
                } else if (step === 2) {
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
            <View style={[styles.progressStep, step > 1 && styles.progressStepActive]}>
              <Text style={[styles.progressText, step > 1 && styles.progressTextActive]}>1</Text>
            </View>
            <View style={[styles.progressLine, step > 2 && styles.progressLineActive]} />
            <View style={[styles.progressStep, step > 2 && styles.progressStepActive]}>
              <Text style={[styles.progressText, step > 2 && styles.progressTextActive]}>2</Text>
            </View>
            <View style={[styles.progressLine, step > 3 && styles.progressLineActive]} />
            <View style={[styles.progressStep, step > 3 && styles.progressStepActive]}>
              <Text style={[styles.progressText, step > 3 && styles.progressTextActive]}>3</Text>
            </View>
            <View style={[styles.progressLine, step > 4 && styles.progressLineActive]} />
            <View style={[styles.progressStep, step > 4 && styles.progressStepActive]}>
              <Text style={[styles.progressText, step > 4 && styles.progressTextActive]}>4</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer} importantForAutofill="noExcludeDescendants">
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
                      textContentType="emailAddress"
                      importantForAutofill="yes"
                      autoComplete="email"
                      clearButtonMode="while-editing"
                      selectTextOnFocus={true}
                      editable={true}
                      underlineColorAndroid="transparent"
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
            ) : step === 2 ? (
              <>
                <Text style={styles.stepTitle}>Имэйл баталгаажуулах</Text>
                <Text style={styles.stepDescription}>
                  {email} хаягт илгээсэн 6 оронтой кодыг оруулна уу
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
                      autoFocus
                    />
                  </View>
                </View>

                {/* Resend Code Button */}
                <View style={styles.resendContainer}>
                  <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={!canResend || loading}
                    style={styles.resendButton}
                  >
                    <Text
                      style={[
                        styles.resendText,
                        (!canResend || loading) && styles.resendTextDisabled,
                      ]}
                    >
                      {resendTimer > 0
                        ? `Код дахин авах (${resendTimer} секунд)`
                        : "Код дахин авах"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.button, isVerifying && styles.buttonDisabled]}
                  onPress={handleVerifyCode}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <ActivityIndicator color={theme.white} />
                  ) : (
                    <Text style={styles.buttonText}>Баталгаажуулах</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : step === 4 ? (
              <>
                <Text style={styles.stepTitle}>Бүртгэл дуусгах</Text>
                <Text style={styles.stepDescription}>
                  Таны мэдээллийг оруулж бүртгэлээ дуусгана уу
                </Text>

                {/* Dummy fields to prevent iOS AutoFill from targeting real fields */}
                <View style={{ height: 0, overflow: 'hidden' }}>
                  <TextInput
                    style={{ height: 0, width: 0, opacity: 0 }}
                    autoComplete="off"
                    textContentType="none"
                  />
                  <TextInput
                    style={{ height: 0, width: 0, opacity: 0 }}
                    autoComplete="off"
                    textContentType="none"
                  />
                  <TextInput
                    style={{ height: 0, width: 0, opacity: 0 }}
                    autoComplete="off"
                    textContentType="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Нэр</Text>
                  <TextInput
                    ref={nameInputRef}
                    style={[styles.inputWrapper, { paddingLeft: 12, paddingRight: 12, height: 52 }]}
                    placeholder="Таны нэр"
                    placeholderTextColor={theme.gray400}
                    value={name}
                    onChangeText={setName}
                    editable={true}
                    keyboardType="default"
                    autoComplete="off"
                    textContentType="none"
                    importantForAutofill="no"
                    autoCorrect={false}
                    spellCheck={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Овог</Text>
                  <TextInput
                    style={[styles.inputWrapper, { paddingLeft: 12, paddingRight: 12, height: 52 }]}
                    placeholder="Таны овог"
                    placeholderTextColor={theme.gray400}
                    value={surname}
                    onChangeText={setSurname}
                    editable={true}
                    keyboardType="default"
                    autoComplete="off"
                    textContentType="none"
                    importantForAutofill="no"
                    autoCorrect={false}
                    spellCheck={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Регистрийн дугаар</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="card-outline"
                      size={20}
                      color={theme.gray500}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="УГ99999999"
                      placeholderTextColor={theme.gray400}
                      value={registrationNumber}
                      onChangeText={(text) => {
                        // Auto-format: convert to uppercase and ensure УГ prefix
                        let formatted = text.toUpperCase();
                        if (!formatted.startsWith('УГ') && formatted.length > 0) {
                          formatted = 'УГ' + formatted.replace(/[^0-9]/g, '');
                        }
                        // Limit to УГ + 8 digits
                        if (formatted.length > 10) {
                          formatted = formatted.substring(0, 10);
                        }
                        setRegistrationNumber(formatted);
                      }}
                      editable={true}
                      keyboardType="default"
                      maxLength={10}
                      autoComplete="off"
                      textContentType="none"
                      importantForAutofill="no"
                      autoCorrect={false}
                      spellCheck={false}
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

                <TouchableOpacity
                  style={[styles.button, isVerifying && styles.buttonDisabled]}
                  onPress={handleCompleteRegistration}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <ActivityIndicator color={theme.white} />
                  ) : (
                    <Text style={styles.buttonText}>Бүртгүүлэх</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : step === 5 ? (
              <>
                {/* Success Screen */}
                <View style={styles.successContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={80}
                    color={theme.brand600}
                    style={styles.successIcon}
                  />
                  <Text style={styles.successTitle}>
                    Амжилттай бүртгэгдлээ!
                  </Text>
                  <Text style={styles.successMessage}>
                    Таны бүртгэл амжилттай баталгаажлаа. Одоо апп-аа ашиглаж эхэлж болно.
                  </Text>

                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.replace("/(tabs)")}
                  >
                    <Text style={styles.buttonText}>Зарлалцах</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}

            {/* Login Link */}
            {step < 5 && (
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Бүртгэлтэй юу? </Text>
                <TouchableOpacity onPress={() => router.push("/(hidden)/login")}>
                  <Text style={styles.loginLink}>Нэвтрэх</Text>
                </TouchableOpacity>
              </View>
            )}
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
    overflow: 'visible',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.gray900,
    height: 52,
    paddingVertical: 0,
    minHeight: 52,
    backgroundColor: 'transparent',
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
  resendContainer: {
    alignItems: "center",
    marginBottom: 16,
    marginTop: -8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resendText: {
    fontSize: 14,
    color: theme.brand600,
    fontWeight: "600",
  },
  resendTextDisabled: {
    color: theme.gray400,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.gray900,
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: theme.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
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
    flex: 1,
  },
  modalCloseButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
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
  eulaButton: {
    backgroundColor: theme.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.gray200,
    padding: 16,
    marginBottom: 16,
  },
  eulaButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eulaButtonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.gray900,
    marginBottom: 4,
  },
  eulaButtonSubtitle: {
    fontSize: 13,
    color: theme.gray600,
    marginTop: 4,
  },
});
