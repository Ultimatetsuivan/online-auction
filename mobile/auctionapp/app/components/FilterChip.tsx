import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import theme from "../theme";

type Props = {
  label: string;
  value?: string | number | null;
  onPress?: () => void;
  style?: ViewStyle;
  danger?: boolean; // for the red "Search" or "Clear Filters" button
};

export default function FilterChip({ label, value, onPress, style, danger }: Props) {
  const hasValue =
    value !== undefined && value !== null && value !== "" && value !== "any";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.chip,
        danger
          ? styles.danger
          : hasValue
          ? styles.active
          : styles.inactive,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          danger
            ? styles.dangerText
            : hasValue
            ? styles.activeText
            : styles.inactiveText,
        ]}
      >
        {hasValue ? `${label}: ${value}` : label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  inactive: {
    backgroundColor: "#F2F4F7",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  active: {
    backgroundColor: theme.brand100,
    borderWidth: 1,
    borderColor: theme.brand600,
  },
  danger: {
    backgroundColor: "#DC2626",
    borderWidth: 0,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
  inactiveText: { color: theme.gray900 },
  activeText: { color: theme.brand700 },
  dangerText: { color: "#fff" },
});
