import React from "react";
import { View, TouchableOpacity, StyleSheet, Text, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../theme";

export default function BadgeIcon({
  name, count = 0, onPress, style,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  count?: number; onPress?: () => void; style?: ViewStyle;
}) {
  return (
    <TouchableOpacity style={[styles.wrap, style]} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={name} size={22} color="#fff" />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 8 },
  badge: {
    position: "absolute", right: 4, top: 2,
    backgroundColor: theme.brand600, borderRadius: 9,
    minWidth: 18, height: 18, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
