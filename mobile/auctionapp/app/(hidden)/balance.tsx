import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "../theme";
import { api } from "../../src/api";

type Tab = "topup" | "history" | "transactions";
type TopUpStep = "amount" | "qr";

interface PaymentRequest {
  _id: string;
  amount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface BankUrl {
  name: string;
  description: string;
  logo: string;
  link: string;
}

interface ActiveInvoice {
  requestId: string;
  qrImage: string;
  qrText: string;
  urls: BankUrl[];
  amount: number;
}

const QUICK_AMOUNTS = [10000, 50000, 100000, 500000];
const POLL_INTERVAL_MS = 3000;

export default function BalanceScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("topup");

  // Top-up state
  const [topUpStep, setTopUpStep] = useState<TopUpStep>("amount");
  const [amountInput, setAmountInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [invoice, setInvoice] = useState<ActiveInvoice | null>(null);

  // History state
  const [history, setHistory] = useState<PaymentRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Transactions state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  // Polling ref
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    loadInitial();
    return () => stopPolling();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem("user").then(u => {
        if (!u) router.replace("/(hidden)/login");
      }).catch(() => {});
    }, [])
  );

  const loadInitial = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));
      await fetchBalance();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await api.get("/api/users/userbalance");
      const balance = res.data?.balance ?? res.data?.data?.balance ?? 0;
      setUser((prev: any) => ({ ...prev, balance }));
      const raw = await AsyncStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.balance = balance;
        await AsyncStorage.setItem("user", JSON.stringify(parsed));
      }
    } catch (e) {
      console.error("fetchBalance:", e);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get("/api/request/my");
      const data = Array.isArray(res.data) ? res.data : [];
      setHistory(data);
    } catch (e) {
      console.error("fetchHistory:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setTxLoading(true);
    try {
      const res = await api.get("/api/transaction/my");
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("fetchTransactions:", e);
    } finally {
      setTxLoading(false);
    }
  };

  const handleTabChange = (t: Tab) => {
    setTab(t);
    if (t === "history") fetchHistory();
    if (t === "transactions") fetchTransactions();
  };

  // ── Create QPay invoice ──────────────────────────────────────────────────────
  const handleCreateInvoice = async () => {
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

      setInvoice({
        requestId: _id,
        qrImage: payment.qrImage,
        qrText: payment.qrText,
        urls: payment.urls || [],
        amount,
      });
      setTopUpStep("qr");
      startPolling(_id, amount);
    } catch (e: any) {
      console.error("createInvoice:", e);
      Alert.alert(
        "QPay алдаа",
        e.response?.data?.message || "Нэхэмжлэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу."
      );
    } finally {
      setCreating(false);
    }
  };

  // ── Poll payment status every 3 seconds ─────────────────────────────────────
  const startPolling = (requestId: string, amount: number) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/request/${requestId}`);
        const { status, paymentStatus } = res.data;
        if (status === "completed" || paymentStatus === "paid") {
          stopPolling();
          handlePaymentSuccess(amount);
        } else if (paymentStatus === "expired" || paymentStatus === "failed") {
          stopPolling();
          handlePaymentFailed(paymentStatus);
        }
      } catch (e) {
        console.error("poll error:", e);
      }
    }, POLL_INTERVAL_MS);
  };

  const handlePaymentSuccess = async (amount: number) => {
    await fetchBalance();
    fetchHistory();
    setTopUpStep("amount");
    setAmountInput("");
    setInvoice(null);
    Alert.alert(
      "✓ Амжилттай",
      `₮${amount.toLocaleString()} дансанд нэмэгдлээ`,
      [{ text: "OK" }]
    );
  };

  const handlePaymentFailed = (reason: string) => {
    setTopUpStep("amount");
    setAmountInput("");
    setInvoice(null);
    const msg =
      reason === "expired"
        ? "Төлбөрийн хугацаа дууссан. Дахин оролдоно уу."
        : "Төлбөр амжилтгүй болсон. Дахин оролдоно уу.";
    Alert.alert("Төлбөр амжилтгүй", msg);
  };

  const handleCancelQr = () => {
    stopPolling();
    setTopUpStep("amount");
    setAmountInput("");
    setInvoice(null);
  };

  const handleOpenBankApp = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Банкны аппликейшн олдсонгүй", "QPay QR код уншуулна уу.");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInitial();
    if (tab === "history") fetchHistory();
    if (tab === "transactions") fetchTransactions();
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderAmountStep = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>QPay-аар цэнэглэх</Text>

      <Text style={styles.label}>Дүн (₮)</Text>
      <TextInput
        style={styles.input}
        placeholder="Дүн оруулна уу"
        placeholderTextColor={theme.gray400}
        keyboardType="numeric"
        value={amountInput}
        onChangeText={setAmountInput}
      />
      <Text style={styles.hint}>Доод дүн: ₮1,000</Text>

      <View style={styles.quickGrid}>
        {QUICK_AMOUNTS.map((a) => (
          <TouchableOpacity
            key={a}
            style={[
              styles.quickBtn,
              amountInput === a.toString() && styles.quickBtnActive,
            ]}
            onPress={() => setAmountInput(a.toString())}
          >
            <Text
              style={[
                styles.quickBtnText,
                amountInput === a.toString() && styles.quickBtnTextActive,
              ]}
            >
              ₮{(a / 1000).toFixed(0)}k
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {amountInput ? (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Нийт дүн</Text>
          <Text style={styles.summaryAmount}>
            ₮{(parseInt(amountInput, 10) || 0).toLocaleString()}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.primaryBtn, (!amountInput || creating) && styles.primaryBtnDisabled]}
        onPress={handleCreateInvoice}
        disabled={!amountInput || creating}
      >
        {creating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="qr-code" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>QPay QR үүсгэх</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color={theme.brand600} />
        <Text style={styles.infoText}>
          QPay дээр QR код үүсгэгдэнэ. Банкны апп эсвэл QR уншуулж төлнө үү.
        </Text>
      </View>
    </View>
  );

  const renderQrStep = () => {
    if (!invoice) return null;
    return (
      <View style={styles.card}>
        <View style={styles.qrHeader}>
          <View style={styles.qrAmountBadge}>
            <Text style={styles.qrAmountText}>₮{invoice.amount.toLocaleString()}</Text>
          </View>
          <View style={styles.waitingRow}>
            <ActivityIndicator size="small" color={theme.brand600} />
            <Text style={styles.waitingText}>Төлбөр хүлээж байна...</Text>
          </View>
        </View>

        {/* QR code image from QPay (base64 PNG) */}
        {invoice.qrImage ? (
          <View style={styles.qrImageWrap}>
            <Image
              source={{ uri: `data:image/png;base64,${invoice.qrImage}` }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>
        ) : null}

        <Text style={styles.qrInstruction}>
          QR кодыг уншуулах эсвэл доорх банкны аппаа нээнэ үү
        </Text>

        {/* Bank app deep links */}
        {invoice.urls.length > 0 && (
          <View style={styles.bankGrid}>
            {invoice.urls.map((u, i) => (
              <TouchableOpacity
                key={i}
                style={styles.bankBtn}
                onPress={() => handleOpenBankApp(u.link)}
              >
                {u.logo ? (
                  <Image source={{ uri: u.logo }} style={styles.bankLogo} />
                ) : (
                  <View style={styles.bankLogoPlaceholder}>
                    <Ionicons name="card" size={20} color={theme.brand600} />
                  </View>
                )}
                <Text style={styles.bankName} numberOfLines={2}>
                  {u.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelQr}>
          <Text style={styles.cancelBtnText}>Буцах</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHistory = () => {
    if (historyLoading) {
      return (
        <View style={styles.centerPad}>
          <ActivityIndicator color={theme.brand600} />
        </View>
      );
    }
    if (history.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={56} color={theme.gray300} />
          <Text style={styles.emptyTitle}>Түүх хоосон байна</Text>
          <Text style={styles.emptySubtitle}>Цэнэглэлтийн түүх энд харагдана</Text>
        </View>
      );
    }
    return (
      <View style={styles.card}>
        {history.map((item, i) => {
          const paid = item.status === "completed" || item.paymentStatus === "paid";
          const expired = item.paymentStatus === "expired";
          const failed = item.paymentStatus === "failed";
          const iconName = paid ? "checkmark-circle" : expired ? "time" : failed ? "close-circle" : "hourglass";
          const iconColor = paid ? theme.success500 : expired ? theme.gray400 : failed ? theme.danger600 : theme.warning600;
          const statusLabel = paid ? "Амжилттай" : expired ? "Хугацаа дууссан" : failed ? "Амжилтгүй" : "Хүлээгдэж буй";

          return (
            <View key={item._id} style={[styles.historyItem, i < history.length - 1 && styles.historyItemBorder]}>
              <View style={[styles.historyIcon, { backgroundColor: `${iconColor}18` }]}>
                <Ionicons name={iconName as any} size={22} color={iconColor} />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle}>QPay цэнэглэлт</Text>
                <Text style={styles.historyMeta}>
                  {new Date(item.createdAt).toLocaleDateString("mn-MN", {
                    year: "numeric", month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </Text>
                <Text style={[styles.historyStatus, { color: iconColor }]}>{statusLabel}</Text>
              </View>
              <Text style={[styles.historyAmount, paid && styles.historyAmountPaid]}>
                {paid ? "+" : ""}₮{item.amount.toLocaleString()}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderTransactions = () => {
    if (txLoading) {
      return (
        <View style={styles.centerPad}>
          <ActivityIndicator size="large" color={theme.brand600} />
        </View>
      );
    }
    if (transactions.length === 0) {
      return (
        <View style={styles.emptyBox}>
          <Ionicons name="swap-horizontal-outline" size={48} color={theme.gray300} />
          <Text style={styles.emptyTitle}>Гүйлгээ байхгүй</Text>
          <Text style={styles.emptyHint}>Худалдах эсвэл худалдан авах үед энд харагдана</Text>
        </View>
      );
    }
    const userId = user?._id?.toString() || user?.id?.toString();
    return (
      <View style={styles.card}>
        {transactions.map((tx: any, i: number) => {
          const isBuyer = (tx.buyer?._id?.toString() || tx.buyer?.toString()) === userId;
          const counterparty = isBuyer
            ? (tx.seller?.name || tx.seller?.email || "Борлуулагч")
            : (tx.buyer?.name || tx.buyer?.email || "Худалдан авагч");
          const productTitle = tx.product?.title || "Бараа";
          const sign = isBuyer ? "-" : "+";
          const color = isBuyer ? theme.danger600 : theme.success500;
          const icon = isBuyer ? "cart-outline" : "cash-outline";
          const label = isBuyer ? "Худалдан авсан" : "Борлуулсан";
          return (
            <View key={tx._id} style={[styles.historyItem, i < transactions.length - 1 && styles.historyItemBorder]}>
              <View style={[styles.historyIcon, { backgroundColor: `${color}18` }]}>
                <Ionicons name={icon as any} size={22} color={color} />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle} numberOfLines={1}>{productTitle}</Text>
                <Text style={styles.historyMeta}>{label} · {counterparty}</Text>
                <Text style={styles.historyMeta}>
                  {new Date(tx.createdAt).toLocaleDateString("mn-MN", {
                    year: "numeric", month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </Text>
              </View>
              <Text style={[styles.historyAmount, { color }]}>
                {sign}₮{tx.amount.toLocaleString()}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  // ── Loading / Guest ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.centerPad}>
          <ActivityIndicator size="large" color={theme.brand600} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Данс</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerPad}>
          <Ionicons name="wallet-outline" size={64} color={theme.brand600} />
          <Text style={styles.emptyTitle}>Нэвтэрч орно уу</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(hidden)/login")}>
            <Text style={styles.primaryBtnText}>Нэвтрэх</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Данс</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Balance card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <Ionicons name="wallet" size={22} color="#fff" />
          <Text style={styles.balanceLabel}>Боломжтой үлдэгдэл</Text>
        </View>
        <Text style={styles.balanceAmount}>₮{(user.balance || 0).toLocaleString()}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, tab === "topup" && styles.tabItemActive]}
          onPress={() => handleTabChange("topup")}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={tab === "topup" ? theme.brand600 : theme.gray500}
          />
          <Text style={[styles.tabText, tab === "topup" && styles.tabTextActive]}>
            Мөнгө нэмэх
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, tab === "history" && styles.tabItemActive]}
          onPress={() => handleTabChange("history")}
        >
          <Ionicons
            name="time-outline"
            size={18}
            color={tab === "history" ? theme.brand600 : theme.gray500}
          />
          <Text style={[styles.tabText, tab === "history" && styles.tabTextActive]}>
            Цэнэглэлт
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, tab === "transactions" && styles.tabItemActive]}
          onPress={() => handleTabChange("transactions")}
        >
          <Ionicons
            name="swap-horizontal-outline"
            size={18}
            color={tab === "transactions" ? theme.brand600 : theme.gray500}
          />
          <Text style={[styles.tabText, tab === "transactions" && styles.tabTextActive]}>
            Гүйлгээ
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {tab === "topup"
          ? topUpStep === "amount"
            ? renderAmountStep()
            : renderQrStep()
          : tab === "history"
            ? renderHistory()
            : renderTransactions()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.gray50 },

  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray200,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: theme.gray900 },

  balanceCard: {
    backgroundColor: theme.brand600,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  balanceLabel: { fontSize: 13, color: "#fff", opacity: 0.85 },
  balanceAmount: { fontSize: 34, fontWeight: "800", color: "#fff" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: theme.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray100,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.gray100,
    gap: 6,
  },
  tabItemActive: { backgroundColor: theme.brand50 },
  tabText: { fontSize: 14, fontWeight: "600", color: theme.gray500 },
  tabTextActive: { color: theme.brand600 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  card: {
    backgroundColor: theme.white,
    borderRadius: 14,
    padding: 20,
    gap: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: theme.gray900 },

  label: { fontSize: 13, fontWeight: "600", color: theme.gray700 },
  input: {
    borderWidth: 1.5,
    borderColor: theme.gray200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 18,
    fontWeight: "600",
    color: theme.gray900,
    backgroundColor: theme.gray50,
  },
  hint: { fontSize: 12, color: theme.gray400, marginTop: -6 },

  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.gray100,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  quickBtnActive: { backgroundColor: theme.brand50, borderColor: theme.brand600 },
  quickBtnText: { fontSize: 14, fontWeight: "700", color: theme.gray700 },
  quickBtnTextActive: { color: theme.brand600 },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.gray50,
    padding: 14,
    borderRadius: 10,
  },
  summaryLabel: { fontSize: 14, fontWeight: "600", color: theme.gray600 },
  summaryAmount: { fontSize: 22, fontWeight: "800", color: theme.brand600 },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.brand600,
    paddingVertical: 15,
    borderRadius: 12,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: theme.brand50,
    padding: 12,
    borderRadius: 10,
  },
  infoText: { flex: 1, fontSize: 12, color: theme.gray600, lineHeight: 18 },

  // QR step
  qrHeader: { alignItems: "center", gap: 10 },
  qrAmountBadge: {
    backgroundColor: theme.brand600,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  qrAmountText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  waitingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  waitingText: { fontSize: 14, color: theme.gray500 },
  qrImageWrap: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.gray200,
    borderRadius: 12,
    padding: 16,
  },
  qrImage: { width: 220, height: 220 },
  qrInstruction: {
    fontSize: 13,
    color: theme.gray500,
    textAlign: "center",
    lineHeight: 18,
  },
  bankGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  bankBtn: {
    alignItems: "center",
    gap: 6,
    width: "30%",
    minWidth: 80,
  },
  bankLogo: { width: 48, height: 48, borderRadius: 12 },
  bankLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  bankName: { fontSize: 11, color: theme.gray700, textAlign: "center", fontWeight: "600" },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.gray200,
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: theme.gray600 },

  // History
  historyItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  historyItemBorder: { borderBottomWidth: 1, borderBottomColor: theme.gray100 },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  historyInfo: { flex: 1 },
  historyTitle: { fontSize: 14, fontWeight: "700", color: theme.gray900 },
  historyMeta: { fontSize: 11, color: theme.gray400, marginTop: 2 },
  historyStatus: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  historyAmount: { fontSize: 15, fontWeight: "700", color: theme.gray700 },
  historyAmountPaid: { color: theme.success600 },

  centerPad: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyBox: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: theme.gray800 },
  emptyHint: { fontSize: 13, color: theme.gray500, textAlign: "center", paddingHorizontal: 24 },
  emptySubtitle: { fontSize: 13, color: theme.gray500, textAlign: "center" },
});
