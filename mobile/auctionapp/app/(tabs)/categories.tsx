import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import theme from '../theme';
import { api } from '../../src/api';
import { useTheme } from '../../src/contexts/ThemeContext';

interface Category {
  _id: string;
  title: string;
  titleMn?: string;
  icon?: string;
  parent?: any;
}

export default function CategoriesScreen() {
  const { isDarkMode, themeColors } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/category/');
      const categoriesData = response.data?.data || response.data || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    router.push(`/category/${categoryId}?name=${encodeURIComponent(categoryName)}`);
  };

  // Filter parent categories (those without parent)
  const parentCategories = categories.filter(
    (c) => !c.parent || (typeof c.parent === 'object' && c.parent === null)
  );

  // Get subcategories for a parent
  const getSubcategories = (parentId: string) => {
    return categories.filter(
      (c) =>
        c.parent &&
        ((typeof c.parent === 'string' && c.parent === parentId) ||
          (typeof c.parent === 'object' && c.parent?._id === parentId))
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.brand600} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            Ангиллуудыг ачаалж байна...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: themeColors.surface,
        borderBottomColor: themeColors.border 
      }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Ангилал</Text>
        <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
          {parentCategories.length} үндсэн ангилал
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {parentCategories.map((parentCat) => {
          const subs = getSubcategories(parentCat._id);
          const categoryName = parentCat.titleMn || parentCat.title;

          return (
            <View key={parentCat._id} style={[styles.categoryGroup, { backgroundColor: themeColors.surface }]}>
              {/* Parent Category Header */}
              <TouchableOpacity
                style={[styles.parentCategory, { 
                  backgroundColor: themeColors.surface,
                  borderBottomColor: themeColors.border 
                }]}
                onPress={() => handleCategoryPress(parentCat._id, categoryName)}
              >
                <View style={styles.parentCategoryLeft}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.categoryIcon}>{parentCat.icon || '📦'}</Text>
                  </View>
                  <View style={styles.categoryTextContainer}>
                    <Text style={[styles.parentCategoryName, { color: themeColors.text }]}>
                      {categoryName}
                    </Text>
                    <Text style={[styles.subcategoryCount, { color: themeColors.textSecondary }]}>
                      {subs.length} дэд ангилал
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={themeColors.textSecondary}
                />
              </TouchableOpacity>

              {/* Subcategories */}
              {subs.length > 0 && (
                <View style={[styles.subcategoriesContainer, { backgroundColor: themeColors.background }]}>
                  {subs.map((subCat) => {
                    const subCategoryName = subCat.titleMn || subCat.title;
                    return (
                      <TouchableOpacity
                        key={subCat._id}
                        style={styles.subcategoryItem}
                        onPress={() =>
                          handleCategoryPress(subCat._id, subCategoryName)
                        }
                      >
                        <View style={styles.subcategoryDot} />
                        <Text style={[styles.subcategoryName, { color: themeColors.text }]}>
                          {subCategoryName}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={themeColors.textSecondary}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  categoryGroup: {
    marginBottom: 16,
  },
  parentCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  parentCategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.brand50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryTextContainer: {
    flex: 1,
  },
  parentCategoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subcategoryCount: {
    fontSize: 13,
  },
  subcategoriesContainer: {
    paddingVertical: 8,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingLeft: 76,
  },
  subcategoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.brand600,
    marginRight: 12,
  },
  subcategoryName: {
    flex: 1,
    fontSize: 15,
  },
});
