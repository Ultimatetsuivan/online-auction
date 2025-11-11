import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api";
import theme from "../../app/theme";

type PaymentModalProps = {
  visible: boolean;
  onClose: () => void;
  amount: number;
  productId?: string;
  onSuccess?: () => void;
};

export default function PaymentModal({
  visible,
  onClose,
  amount,
  productId,
  onSuccess,
}: PaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState(amount.toString());
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"qpay" | "bank" | null>(null);

  const handlePayment = async () => {
    const numAmount = parseFloat(paymentAmount);
    if (isNaN(numAmount) || numAmount < 5000) {
      Alert.alert("Error", "Minimum payment amount is ₮5,000");
      return;
    }

    if (!selectedMethod) {
      Alert.alert("Error", "Please select a payment method");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/request", {
        amount: numAmount,
      });

      if (response.data.payment) {
        Alert.alert(
          "Payment Created",
          `Invoice ID: ${response.data.payment.invoice_id}`,
          [
            {
              text: "View QR Code",
              onPress: () => {
                // Navigate to QR code screen
                onSuccess?.();
              },
            },
            { text: "OK", onPress: onClose },
          ]
        );
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      Alert.alert(
        "Payment Failed",
        error.response?.data?.message || "Failed to create payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Funds</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.gray900} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Amount Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Amount (₮)</Text>
              <TextInput
                style={styles.input}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={theme.gray400}
              />
              <Text style={styles.hint}>Minimum: ₮5,000</Text>
            </View>

            {/* Payment Methods */}
            <View style={styles.section}>
              <Text style={styles.label}>Payment Method</Text>

              <TouchableOpacity
                style={[
                  styles.methodCard,
                  selectedMethod === "qpay" && styles.methodCardSelected,
                ]}
                onPress={() => setSelectedMethod("qpay")}
              >
                <View style={styles.methodIcon}>
                  <Ionicons name="qr-code" size={24} color={theme.brand600} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>QPay</Text>
                  <Text style={styles.methodDesc}>
                    Scan QR code to pay via mobile banking
                  </Text>
                </View>
                {selectedMethod === "qpay" && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.brand600} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodCard,
                  selectedMethod === "bank" && styles.methodCardSelected,
                ]}
                onPress={() => setSelectedMethod("bank")}
              >
                <View style={styles.methodIcon}>
                  <Ionicons name="card" size={24} color={theme.brand600} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>Bank Transfer</Text>
                  <Text style={styles.methodDesc}>
                    Direct bank transfer (manual verification)
                  </Text>
                </View>
                {selectedMethod === "bank" && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.brand600} />
                )}
              </TouchableOpacity>
            </View>

            {/* Total */}
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>₮{parseFloat(paymentAmount || "0").toLocaleString()}</Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.payButton, loading && styles.buttonDisabled]}
              onPress={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.payButtonText}>Proceed to Pay</Text>
              )}
            </TouchableOpacity>
          </View>
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
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray200,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.gray900,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.gray700,
    marginBottom: 12,
  },
  input: {
    backgroundColor: theme.gray100,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: "600",
    color: theme.gray900,
    borderWidth: 2,
    borderColor: "transparent",
  },
  hint: {
    fontSize: 12,
    color: theme.gray500,
    marginTop: 6,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.gray200,
    marginBottom: 12,
    backgroundColor: theme.gray50,
  },
  methodCardSelected: {
    borderColor: theme.brand600,
    backgroundColor: `${theme.brand600}10`,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${theme.brand600}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.gray900,
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 12,
    color: theme.gray500,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.gray100,
    borderRadius: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.gray700,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.brand600,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: theme.gray200,
  },
  cancelButtonText: {
    color: theme.gray700,
    fontSize: 16,
    fontWeight: "600",
  },
  payButton: {
    backgroundColor: theme.brand600,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
