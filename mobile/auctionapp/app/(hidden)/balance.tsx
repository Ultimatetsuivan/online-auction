import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "../theme";
import { api } from "../../src/api";

export default function BalanceScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<"deposit" | "history">("deposit");

  useEffect(() => {
    loadUserAndData();
  }, []);

  const loadUserAndData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
        await fetchTransactions();
        await fetchUserBalance();
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await api.get("/api/users/userbalance");
      const balance = response.data?.balance || response.data?.data?.balance || 0;
      setUser((prev: any) => ({ ...prev, balance }));

      // Update AsyncStorage
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        parsedUser.balance = balance;
        await AsyncStorage.setItem("user", JSON.stringify(parsedUser));
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get("/api/deposits");
      const txData = response.data?.data || response.data || [];
      setTransactions(txData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    }
  };

  const handleDeposit = async () => {
    const amount = parseInt(depositAmount);

    if (!depositAmount || isNaN(amount) || amount <= 0) {
      Alert.alert("Алдаа", "Зөв дүн оруулна уу");
      return;
    }

    if (amount < 1000) {
      Alert.alert("Алдаа", "Хамгийн бага 1,000₮ цэнэглэх боломжтой");
      return;
    }

    Alert.alert(
      "Цэнэглэх",
      `₮${amount.toLocaleString()} цэнэглэхдээ итгэлтэй байна уу?`,
      [
        { text: "Болих", style: "cancel" },
        {
          text: "Цэнэглэх",
          onPress: async () => {
            try {
              setDepositing(true);
              await api.post("/api/deposits", { amount });

              Alert.alert("Амжилттай", "Данс амжилттай цэнэглэгдлээ", [
                {
                  text: "OK",
                  onPress: () => {
                    setDepositAmount("");
                    fetchUserBalance();
                    fetchTransactions();
                  },
                },
              ]);
            } catch (error: any) {
              console.error("Error depositing:", error);
              Alert.alert("Алдаа", error.response?.data?.error || "Цэнэглэхэд алдаа гарлаа");
            } finally {
              setDepositing(false);
            }
          },
        },
      ]
    );
  };

  const quickAmounts = [10000, 50000, 100000, 500000];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.brand600} />
          <Text style={styles.loadingText}>Ачаалж байна...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Данс</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.guestContainer}>
          <View style={styles.guestContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="wallet-outline" size={64} color={theme.brand600} />
            </View>
            <Text style={styles.guestTitle}>Нэвтрэх шаардлагатай</Text>
            <Text style={styles.guestSubtitle}>
              Дансаа харахын тулд нэвтэрнэ үү
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push("/(hidden)/login")}
            >
              <Text style={styles.loginButtonText}>Нэвтрэх</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Данс</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Ionicons name="wallet" size={24} color={theme.brand600} />
          <Text style={styles.balanceLabel}>Боломжтой үлдэгдэл</Text>
        </View>
        <Text style={styles.balanceAmount}>₮{(user.balance || 0).toLocaleString()}</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "deposit" && styles.tabActive]}
          onPress={() => setSelectedTab("deposit")}
        >
          <Ionicons
            name="add-circle"
            size={18}
            color={selectedTab === "deposit" ? theme.brand600 : theme.gray500}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === "deposit" && styles.tabTextActive,
            ]}
          >
            Цэнэглэх
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === "history" && styles.tabActive]}
          onPress={() => setSelectedTab("history")}
        >
          <Ionicons
            name="list"
            size={18}
            color={selectedTab === "history" ? theme.brand600 : theme.gray500}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === "history" && styles.tabTextActive,
            ]}
          >
            Түүх
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {selectedTab === "deposit" ? (
          <View style={styles.depositSection}>
            <Text style={styles.sectionTitle}>Цэнэглэх дүн</Text>

            <TextInput
              style={styles.input}
              placeholder="Дүн оруулна уу"
              keyboardType="numeric"
              value={depositAmount}
              onChangeText={setDepositAmount}
            />

            <View style={styles.quickAmountsContainer}>
              <Text style={styles.quickAmountsLabel}>Түргэн сонголт:</Text>
              <View style={styles.quickAmountsGrid}>
                {quickAmounts.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickAmountButton}
                    onPress={() => setDepositAmount(amount.toString())}
                  >
                    <Text style={styles.quickAmountText}>
                      ₮{(amount / 1000).toLocaleString()}k
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.depositButton,
                (!depositAmount || depositing) && styles.depositButtonDisabled,
              ]}
              onPress={handleDeposit}
              disabled={!depositAmount || depositing}
            >
              {depositing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.depositButtonText}>Цэнэглэх</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={theme.brand600} />
              <Text style={styles.infoText}>
                Дансны үлдэгдлээ дуудлага худалдаанд оролцох, барааг шууд худалдаж авахад
                ашиглана.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.historySection}>
            {transactions.length > 0 ? (
              <View style={styles.transactionsList}>
                {transactions.map((tx) => (
                  <View key={tx._id} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.transactionIcon,
                          tx.type === "deposit"
                            ? styles.transactionIconDeposit
                            : styles.transactionIconWithdraw,
                        ]}
                      >
                        <Ionicons
                          name={
                            tx.type === "deposit" ? "arrow-down" : "arrow-up"
                          }
                          size={20}
                          color={tx.type === "deposit" ? "#10B981" : "#EF4444"}
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionTitle}>
                          {tx.type === "deposit" ? "Цэнэглэлт" : "Зарлага"}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {new Date(tx.createdAt).toLocaleDateString("mn-MN")}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        tx.type === "deposit"
                          ? styles.transactionAmountPositive
                          : styles.transactionAmountNegative,
                      ]}
                    >
                      {tx.type === "deposit" ? "+" : "-"}₮
                      {tx.amount.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color={theme.gray300} />
                <Text style={styles.emptyStateTitle}>Түүх хоосон</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Гүйлгээний түүх энд харагдана
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.gray50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray200,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.gray900,
  },
  balanceCard: {
    backgroundColor: theme.brand600,
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.white,
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: theme.white,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: theme.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.gray100,
    gap: 6,
  },
  tabActive: {
    backgroundColor: theme.brand50,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.gray500,
  },
  tabTextActive: {
    color: theme.brand600,
  },
  content: {
    flex: 1,
  },
  depositSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.gray900,
    marginBottom: 12,
  },
  input: {
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.gray300,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.gray900,
    marginBottom: 16,
  },
  quickAmountsContainer: {
    marginBottom: 24,
  },
  quickAmountsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.gray700,
    marginBottom: 12,
  },
  quickAmountsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: theme.brand50,
    borderWidth: 1,
    borderColor: theme.brand200,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  quickAmountText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.brand600,
  },
  depositButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.brand600,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 16,
  },
  depositButtonDisabled: {
    backgroundColor: theme.gray300,
    opacity: 0.6,
  },
  depositButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.white,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: theme.brand50,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.gray700,
    lineHeight: 20,
  },
  historySection: {
    padding: 16,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.white,
    padding: 16,
    borderRadius: 12,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  transactionIconDeposit: {
    backgroundColor: "#D1FAE5",
  },
  transactionIconWithdraw: {
    backgroundColor: "#FEE2E2",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.gray900,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 13,
    color: theme.gray500,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  transactionAmountPositive: {
    color: "#10B981",
  },
  transactionAmountNegative: {
    color: "#EF4444",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.gray700,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.gray500,
    textAlign: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: theme.gray700,
    marginTop: 16,
    fontSize: 16,
  },
  guestContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  guestContent: {
    alignItems: "center",
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.brand100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.gray900,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: theme.gray500,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  loginButton: {
    width: "100%",
    backgroundColor: theme.brand600,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.white,
  },
});
