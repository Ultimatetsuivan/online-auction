import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import theme from "../theme";

export default function SearchScreen() {
  const [mode, setMode] = useState<"none" | "category" | "brand">("none");
  const [query, setQuery] = useState("");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.gray900 }}>
      {/* Header with back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Search</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Search input */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={theme.gray500} />
        <TextInput
          placeholder="なにをお探しですか？"
          placeholderTextColor={theme.gray500}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
        />
        <Ionicons name="camera-outline" size={22} color={theme.gray500} />
      </View>

      {/* Tabs below search */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, mode === "category" && styles.tabActive]}
          onPress={() => setMode("category")}
        >
          <Ionicons name="grid-outline" size={16} color="#fff" />
          <Text style={styles.tabText}>カテゴリー</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, mode === "brand" && styles.tabActive]}
          onPress={() => setMode("brand")}
        >
          <Ionicons name="pricetag-outline" size={16} color="#fff" />
          <Text style={styles.tabText}>ブランド</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic content */}
      {mode === "none" && (
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>検索履歴</Text>
          <Text style={styles.emptyText}>検索履歴はありません</Text>
          <TouchableOpacity style={styles.helpRow}>
            <Text style={styles.helpText}>検索のヘルプ</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.brand600} />
          </TouchableOpacity>
        </View>
      )}

      {mode === "category" && <CategoryTree />}
      {mode === "brand" && <BrandStub />}
    </SafeAreaView>
  );
}

/* ---------- Category tree ---------- */
function CategoryTree() {
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  const categories = [
    {
      id: "clothes",
      name: "Clothes",
      children: [
        {
          id: "women",
          name: "Women",
          children: [
            { id: "dress", name: "Dress", children: [{ id: "all", name: "All" }, { id: "onepiece", name: "One Piece" }] },
            { id: "tops", name: "Tops", children: [{ id: "all", name: "All" }, { id: "tshirt", name: "T-Shirts" }] },
          ],
        },
      ],
    },
  ];

  const parents = categories;
  const subs = selectedParent
    ? parents.find((c) => c.id === selectedParent)?.children || []
    : [];
  const subs2 = selectedSub
    ? subs.find((s) => s.id === selectedSub)?.children || []
    : [];

  return (
    <ScrollView contentContainerStyle={styles.catContainer}>
      {!selectedParent && (
        <>
          <Text style={styles.sectionTitle}>カテゴリー一覧</Text>
          {parents.map((c) => (
            <TouchableOpacity key={c.id} style={styles.row} onPress={() => setSelectedParent(c.id)}>
              <Text style={styles.rowText}>{c.name}</Text>
              <Ionicons name="chevron-forward" size={16} color="#aaa" />
            </TouchableOpacity>
          ))}
        </>
      )}

      {selectedParent && !selectedSub && (
        <>
          <TouchableOpacity onPress={() => setSelectedParent(null)} style={styles.backRow}>
            <Ionicons name="chevron-back" size={18} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          {subs.map((s) => (
            <TouchableOpacity key={s.id} style={styles.row} onPress={() => setSelectedSub(s.id)}>
              <Text style={styles.rowText}>{s.name}</Text>
              <Ionicons name="chevron-forward" size={16} color="#aaa" />
            </TouchableOpacity>
          ))}
        </>
      )}

      {selectedSub && (
        <>
          <TouchableOpacity onPress={() => setSelectedSub(null)} style={styles.backRow}>
            <Ionicons name="chevron-back" size={18} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          {subs2.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              style={styles.row}
              onPress={() =>
                router.push({
                  pathname: "/category/221",
                  params: { name: sub.name },
                })
              }
            >
              <Text style={styles.rowText}>{sub.name}</Text>
              <Ionicons name="chevron-forward" size={16} color="#aaa" />
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}

/* ---------- Brand tab stub ---------- */
function BrandStub() {
  return (
    <View style={{ padding: 16 }}>
      <Text style={styles.sectionTitle}>ブランド</Text>
      <Text style={styles.emptyText}>ブランド検索はまだありません</Text>
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 50,
  },
  title: { color: "#fff", fontWeight: "800", fontSize: 18 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    marginHorizontal: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  input: { flex: 1, color: "#fff", fontSize: 15 },
  tabRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2A2A2D",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
  },
  tabActive: { backgroundColor: theme.brand600 },
  tabText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  historyContainer: { padding: 16 },
  sectionTitle: { color: "#fff", fontWeight: "800", fontSize: 16, marginBottom: 12 },
  emptyText: { color: "#aaa", fontSize: 14 },
  helpRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  helpText: { color: theme.brand600, fontWeight: "600", marginRight: 4 },
  catContainer: { padding: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    padding: 14,
    borderRadius: 8,
    marginBottom: 6,
  },
  rowText: { color: "#fff", fontWeight: "600" },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
});
