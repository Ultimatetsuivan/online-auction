// app/components/CategoriesMenu.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { Category } from "../../lib/categories";
import theme from "../theme";
import { useTheme } from "../../src/contexts/ThemeContext";

type Props = {
  data: Category[];
  onSelectCategory?: (cat: Category) => void; // optional callback
};

export default function CategoriesMenu({ data, onSelectCategory }: Props) {
  const router = useRouter();
  const { isDarkMode, themeColors } = useTheme();
  const [open, setOpen] = useState<Category | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const keyExtractor = useCallback((c: Category) => c.id, []);
  const columnStyle = useMemo(
    () => ({ justifyContent: "space-between" as const }),
    []
  );

  const onSelect = useCallback(
    (cat: Category) => {
      setSelectedId(cat.id);
      onSelectCategory?.(cat);
      if (cat.children?.length) {
        setOpen(cat); // open subcats sheet
      } else {
        router.push(`/category/${cat.id}`);
      }
    },
    [onSelectCategory, router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Category }) => {
      const active = item.id === selectedId;
      return (
        <TouchableOpacity
          style={[styles.cell]}
          onPress={() => onSelect(item)}
          accessibilityRole="button"
          accessibilityLabel={item.name}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: active ? theme.brand100 : (isDarkMode ? themeColors.surface : "#F2F4F7") },
              active && { borderColor: theme.brand600, borderWidth: 1 },
            ]}
          >
            {item.icon && item.icon.length <= 2 ? (
              <Text style={{ fontSize: 26 }}>{item.icon}</Text>
            ) : (
              <Ionicons
                name={(item.icon || "grid") as any}
                size={26}
                color={active ? theme.brand600 : themeColors.textSecondary}
              />
            )}
          </View>
          <Text style={[styles.name, { color: themeColors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    },
    [onSelect, selectedId]
  );

  return (
    <>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        numColumns={3}
        columnWrapperStyle={columnStyle}
        contentContainerStyle={{ paddingBottom: 8 }}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({
          length: 96,
          offset: 96 * index,
          index,
        })}
      />

      {/* Subcategory sheet */}
      <Modal
        visible={!!open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(null)} />
        <View style={[styles.sheet, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={[styles.sheetHeader, { borderColor: themeColors.border }]}>
            <Text style={[styles.sheetTitle, { color: themeColors.text }]}>{open?.name}</Text>
            <TouchableOpacity onPress={() => setOpen(null)}>
              <Ionicons name="close" size={22} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {open?.children?.map((sc) => (
            <Pressable
              key={sc.id}
              android_ripple={{ color: theme.brand100 }}
              style={[styles.row, { borderBottomColor: themeColors.border }]}
              onPress={() => {
                setOpen(null);
                setSelectedId(sc.id);
                router.push(`/category/${sc.id}`);
              }}
            >
              <Text style={[styles.rowText, { color: themeColors.text }]}>{sc.name}</Text>
              <Ionicons name="chevron-forward" size={18} color={themeColors.textSecondary} />
            </Pressable>
          ))}

          {!open?.children?.length && (
            <View style={{ padding: 16 }}>
              <Text style={{ color: themeColors.textSecondary }}>No subcategories</Text>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cell: { width: "30%", alignItems: "center", marginBottom: 18 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  name: { fontSize: 12, textAlign: "center", fontWeight: "600" },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 16, fontWeight: "800" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "android" ? 10 : 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { fontSize: 15 },
});
