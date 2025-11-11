import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import theme from "../theme";

type Option = { label: string; value: string | number };
type Props = {
  open: boolean;
  title: string;
  options: Option[];
  value?: string | number | null;
  onClose: () => void;
  onSelect: (v: Option) => void;
  showClear?: boolean;
};

export default function OptionSheet({
  open,
  title,
  options,
  value,
  onClose,
  onSelect,
  showClear,
}: Props) {
  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {showClear && (
            <TouchableOpacity
              onPress={() => onSelect({ label: "Any", value: "any" })}
            >
              <Text style={styles.clear}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Options */}
        <FlatList
          data={options}
          keyExtractor={(o) => String(o.value)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const selected = value === item.value;
            return (
              <TouchableOpacity
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.rowText,
                    selected && styles.rowTextSel,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  title: { fontSize: 16, fontWeight: "700", color: theme.gray900 },
  clear: { color: theme.brand600, fontWeight: "700" },
  row: {
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "android" ? 12 : 14,
  },
  rowSelected: {
    backgroundColor: theme.brand100,
  },
  rowText: {
    fontSize: 15,
    color: theme.gray900,
  },
  rowTextSel: {
    color: theme.brand600,
    fontWeight: "700",
  },
});
