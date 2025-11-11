// app/components/CategoryChip.tsx
import { TouchableOpacity, Text, StyleSheet, Image, ViewStyle, View } from "react-native";
import React from "react";
import theme from "../theme";

type Props = {
  label: string;
  image?: any; // require(...) or { uri: string }
  onPress?: () => void;
  style?: ViewStyle;
  active?: boolean;
};

export default function CategoryChip({ label, image, onPress, style, active }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: active ? theme.brand100 : "#F2F4F7" },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {image ? (
        <View style={[styles.iconWrap, active && { borderColor: theme.brand600 }]}>
          <Image source={image} style={styles.icon} />
        </View>
      ) : null}
      <Text
        style={[
          styles.label,
          { color: active ? theme.brand600 : "#111" },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: "hidden",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  icon: { width: "100%", height: "100%", resizeMode: "cover" },
  label: { fontSize: 14, fontWeight: "600" },
});
