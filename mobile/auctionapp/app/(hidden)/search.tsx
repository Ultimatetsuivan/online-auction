import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import theme from "../theme";
import { api } from "../../src/api";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/category/");
      const categoriesData = response.data?.data || response.data || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const parentCategories = categories.filter(c => !c.parent);
  const getSubcategories = (parentId: string) => {
    return categories.filter(c => {
      const parent = c.parent?._id || c.parent;
      return parent === parentId;
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.white }}>
      {/* Header with back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.gray900} />
        </TouchableOpacity>
        <Text style={styles.title}>Хайлт</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search input */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={theme.gray500} />
        <TextInput
          placeholder="Та юу хайж байна вэ?"
          placeholderTextColor={theme.gray500}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
      </View>

      {/* Categories with Subcategories */}
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Бүх ангилал</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.brand600} />
          </View>
        ) : (
          <View style={styles.categoriesContainer}>
            {parentCategories.map((parent) => {
              const subcategories = getSubcategories(parent._id);
              const isExpanded = expandedParent === parent._id;

              return (
                <View key={parent._id} style={styles.categoryGroup}>
                  {/* Parent Category */}
                  <TouchableOpacity
                    style={styles.parentCategory}
                    onPress={() => setExpandedParent(isExpanded ? null : parent._id)}
                  >
                    <View style={styles.parentCategoryLeft}>
                      {parent.icon && <Text style={styles.parentIcon}>{parent.icon}</Text>}
                      <Text style={styles.parentName}>{parent.titleMn || parent.title}</Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={theme.gray600}
                    />
                  </TouchableOpacity>

                  {/* Subcategories */}
                  {isExpanded && subcategories.length > 0 && (
                    <View style={styles.subcategoriesContainer}>
                      {subcategories.map((sub) => (
                        <TouchableOpacity
                          key={sub._id}
                          style={styles.subcategory}
                          onPress={() => {
                            // Navigate to search results with this subcategory
                            router.push(`/category/${sub._id}`);
                          }}
                        >
                          <Text style={styles.subcategoryName}>
                            {sub.titleMn || sub.title}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color={theme.gray400} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
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
  title: {
    color: theme.gray900,
    fontWeight: "800",
    fontSize: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.gray100,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  input: {
    flex: 1,
    color: theme.gray900,
    fontSize: 16,
  },
  content: {
    flex: 1,
    backgroundColor: theme.white,
  },
  sectionTitle: {
    color: theme.gray900,
    fontWeight: "700",
    fontSize: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  categoryGroup: {
    marginBottom: 8,
    backgroundColor: theme.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.gray200,
    overflow: "hidden",
  },
  parentCategory: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.white,
  },
  parentCategoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  parentIcon: {
    fontSize: 24,
  },
  parentName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.gray900,
  },
  subcategoriesContainer: {
    backgroundColor: theme.gray50,
    borderTopWidth: 1,
    borderTopColor: theme.gray200,
  },
  subcategory: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingLeft: 52,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray200,
  },
  subcategoryName: {
    fontSize: 15,
    color: theme.gray700,
  },
});
