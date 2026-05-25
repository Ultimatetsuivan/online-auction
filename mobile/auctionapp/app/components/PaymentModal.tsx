import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api";
import theme from "../../app/theme";

type Step = "amount" | "qr" | "success";

interface BankUrl {
  name: string;
  description: string;
  logo: string;
  link: string;
}

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  /** Pre-fill the amount (e.g. required deposit amount) */
  amount?: number;
  /** If provided, shown as context label */
  label?: string;
  onSuccess?: () => void;
}

const QUICK_AMOUNTS = [10000, 50000, 100000, 500000];
const POLL_MS = 3000;

export default function PaymentModal({
  visible,
  onClose,
  amount: initialAmount,
  label,
  onSuccess,
}: PaymentModalProps) {
  const [step, setStep] = useState<Step>("amount");
  const [amountInput, setAmountInput] = useState(initialAmount ? initialAmount.toString() : "");
  const [creating, setCreating] = useState(false);

  const [requestId, setRequestId] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [bankUrls, setBankUrls] = useState<BankUrl[]>([]);
  const [paidAmount, setPaidAmount] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Reset when modal opens/closes
  useEffect(() => {
    if (visible) {
      setStep("amount");
      setAmountInput(initialAmount ? initialAmount.toString() : "");
      setCreating(false);
      setRequestId("");
      setQrImage("");
      setBankUrls([]);
    } else {
      stopPolling();
    }
  }, [visible]);

  // ── Create invoice ────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const amount = parseInt(amountInput, 10);
    if (!amountInput || isNaN(amount) || amount < 1000) {
      Alert.alert("Анхаар", "Доод дүн 1,000₮ байна");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post("/api/request", { amount });
      const { _id, payment } = res.data;

      if (!payment?.qrImage) {
        Alert.alert("Алдаа", "QPay QR код хүлээж авсангүй. Дахин оролдоно уу.");
        return;
      }

      setRequestId(_id);
      setQrImage(payment.qrImage);
      setBankUrls(payment.urls || []);
      setPaidAmount(amount);
      setStep("qr");
      startPolling(_id, amount);
    } catch (e: any) {
      Alert.alert(
        "QPay алдаа",
        e.response?.data?.message || "Нэхэмжлэл үүсгэхэд алдаа гарлаа."
      );
    } finally {
      setCreating(false);
    }
  };

  // ── Poll status every 3s ─────────────────────────────────────────────────
  const startPolling = (id: string, amount: number) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/request/${id}`);
        const { status, paymentStatus } = res.data;

        if (status === "completed" || paymentStatus === "paid") {
          stopPolling();
          setStep("success");
        } else if (paymentStatus === "expired" || paymentStatus === "failed") {
          stopPolling();
          const msg =
            paymentStatus === "expired"
              ? "Төлбөрийн хугацаа дууссан. Дахин оролдоно уу."
              : "Төлбөр амжилтгүй болсон. Дахин оролдоно уу.";
          Alert.alert("Амжилтгүй", msg, [{ text: "OK", onPress: handleClose }]);
        }
      } catch (err) {
        console.error("poll error:", err);
      }
    }, POLL_MS);
  };

  const handleOpenBank = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      Alert.alert("Банкны апп олдсонгүй", "QPay QR кодыг уншуулна уу.");
    }
  };

  const handleClose = () => {
    stopPolling();
    setStep("amount");
    onClose();
  };

  const handleSuccessDone = () => {
    handleClose();
    onSuccess?.();
  };

  // ── Steps ──────────────────────────────────────────────────────────────────

  const renderAmountStep = () => (
    <ScrollView contentContainerStyle={styles.body}>
      {label && (
        <View style={styles.labelBadge}>
          <Ionicons name="information-circle" size={16} color={theme.brand600} />
          <Text style={styles.labelText}>{label}</Text>
        </View>
      )}

      <Text style={styles.fieldLabel}>Дүн (₮)</Text>
      <TextInput
        style={styles.input}
        value={amountInput}
        onChangeText={setAmountInput}
        keyboardType="numeric"
        placeholder="Дүн оруулна уу"
        placeholderTextColor={theme.gray400}
        editable={!initialAmount}
      />
      <Text style={styles.hint}>Доод дүн: ₮1,000</Text>

      {!initialAmount && (
        <View style={styles.quickGrid}>
          {QUICK_AMOUNTS.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.quickBtn, amountInput === a.toString() && styles.quickBtnActive]}
              onPress={() => setAmountInput(a.toString())}
            >
              <Text style={[styles.quickBtnText, amountInput === a.toString() && styles.quickBtnTextActive]}>
                ₮{(a / 1000).toFixed(0)}k
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {amountInput ? (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Нийт дүн</Text>
          <Text style={styles.totalAmount}>
            ₮{(parseInt(amountInput, 10) || 0).toLocaleString()}
          </Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={creating}>
          <Text style={styles.cancelBtnText}>Буцах</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.payBtn, (!amountInput || creating) && styles.payBtnDisabled]}
          onPress={handleCreate}
          disabled={!amountInput || creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="qr-code" size={18} color="#fff" />
              <Text style={styles.payBtnText}>QPay QR үүсгэх</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderQrStep = () => (
    <ScrollView contentContainerStyle={styles.body}>
      {/* Amount badge + spinner */}
      <View style={styles.qrTopRow}>
        <View style={styles.amountBadge}>
          <Text style={styles.amountBadgeText}>₮{paidAmount.toLocaleString()}</Text>
        </View>
        <View style={styles.pulseRow}>
          <ActivityIndicator size="small" color={theme.brand600} />
          <Text style={styles.pulseText}>Төлбөр хүлээж байна...</Text>
        </View>
      </View>

      {/* QR image */}
      {qrImage ? (
        <View style={styles.qrBox}>
          <Image
            source={{ uri: `data:image/png;base64,${qrImage}` }}
            style={styles.qrImage}
            resizeMode="contain"
          />
        </View>
      ) : null}

      <Text style={styles.qrHint}>
        QR кодыг уншуулах эсвэл доорх банкны аппаа нээнэ үү
      </Text>

      {/* Bank app buttons */}
      {bankUrls.length > 0 && (
        <>
          <Text style={styles.bankSectionLabel}>Банкны апп-аар нээх</Text>
          <View style={styles.bankGrid}>
            {bankUrls.map((u, i) => (
              <TouchableOpacity
                key={i}
                style={styles.bankBtn}
                onPress={() => handleOpenBank(u.link)}
              >
                {u.logo ? (
                  <Image source={{ uri: u.logo }} style={styles.bankLogo} />
                ) : (
                  <View style={styles.bankLogoFallback}>
                    <Ionicons name="card-outline" size={22} color={theme.brand600} />
                  </View>
                )}
                <Text style={styles.bankName} numberOfLines={2}>{u.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => { stopPolling(); setStep("amount"); }}>
        <Text style={styles.backBtnText}>← Буцах</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSuccess = () => (
    <View style={styles.successBody}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={72} color={theme.success500} />
      </View>
      <Text style={styles.successTitle}>Амжилттай!</Text>
      <Text style={styles.successDesc}>
        ₮{paidAmount.toLocaleString()} таны дансанд нэмэгдлээ
      </Text>
      <TouchableOpacity style={styles.payBtn} onPress={handleSuccessDone}>
        <Text style={styles.payBtnText}>Дууссан</Text>
      </TouchableOpacity>
    </View>
  );

  const stepTitle = step === "amount" ? "QPay цэнэглэлт" : step === "qr" ? "QR код" : "Амжилттай";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{stepTitle}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={22} color={theme.gray600} />
            </TouchableOpacity>
          </View>

          {step === "amount" && renderAmountStep()}
          {step === "qr" && renderQrStep()}
          {step === "success" && renderSuccess()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingBottom: 24,
  },
  sheetHeader: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray100,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.gray300,
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: theme.gray900 },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 20,
    padding: 4,
  },

  body: { padding: 20, gap: 14 },

  labelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.brand50,
    padding: 12,
    borderRadius: 10,
  },
  labelText: { flex: 1, fontSize: 13, color: theme.gray700, fontWeight: "500" },

  fieldLabel: { fontSize: 13, fontWeight: "600", color: theme.gray700 },
  input: {
    borderWidth: 1.5,
    borderColor: theme.gray200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 20,
    fontWeight: "700",
    color: theme.gray900,
    backgroundColor: theme.gray50,
  },
  hint: { fontSize: 12, color: theme.gray400, marginTop: -6 },

  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: theme.gray100,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  quickBtnActive: { backgroundColor: theme.brand50, borderColor: theme.brand600 },
  quickBtnText: { fontSize: 14, fontWeight: "700", color: theme.gray700 },
  quickBtnTextActive: { color: theme.brand600 },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.gray50,
    padding: 14,
    borderRadius: 10,
  },
  totalLabel: { fontSize: 14, fontWeight: "600", color: theme.gray600 },
  totalAmount: { fontSize: 24, fontWeight: "800", color: theme.brand600 },

  actionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: theme.gray100,
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: theme.gray700 },
  payBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.brand600,
  },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // QR step
  qrTopRow: { alignItems: "center", gap: 10 },
  amountBadge: {
    backgroundColor: theme.brand600,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  amountBadgeText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  pulseRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pulseText: { fontSize: 13, color: theme.gray500 },
  qrBox: {
    alignSelf: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.gray200,
    borderRadius: 14,
    padding: 16,
  },
  qrImage: { width: 210, height: 210 },
  qrHint: { fontSize: 13, color: theme.gray500, textAlign: "center", lineHeight: 18 },

  bankSectionLabel: { fontSize: 13, fontWeight: "600", color: theme.gray700 },
  bankGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  bankBtn: { alignItems: "center", gap: 6, width: "28%", minWidth: 76 },
  bankLogo: { width: 48, height: 48, borderRadius: 12 },
  bankLogoFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  bankName: { fontSize: 11, color: theme.gray700, textAlign: "center", fontWeight: "600" },
  backBtn: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.gray200,
    marginTop: 4,
  },
  backBtnText: { fontSize: 14, fontWeight: "600", color: theme.gray600 },

  // Success step
  successBody: { padding: 32, alignItems: "center", gap: 16 },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.success50,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: { fontSize: 24, fontWeight: "800", color: theme.gray900 },
  successDesc: { fontSize: 15, color: theme.gray500, textAlign: "center" },
});
