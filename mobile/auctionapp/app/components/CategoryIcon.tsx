import React from "react";
import { TouchableOpacity, Image, Text, StyleSheet, ViewStyle, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../theme";

type Props = {
  title: string;
  image?: any; // require(...) or { uri: string }
  icon?: string; // Ionicons name
  onPress?: () => void;
  active?: boolean;
  style?: ViewStyle;
  dark?: boolean;
};

export default function CategoryIcon({ title, image, icon, onPress, active, style, dark }: Props) {
  const backgroundColor = active
    ? theme.brand100
    : dark
    ? "#1C1C1E"
    : "#F2F4F7";

  const textColor = active
    ? theme.brand600
    : dark
    ? "#fff"
    : theme.gray900;

  const iconColor = active
    ? theme.brand600
    : dark
    ? "#fff"
    : theme.gray700;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor }, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {image ? (
        <Image source={image} style={styles.image} />
      ) : (
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any || "cube-outline"} size={36} color={iconColor} />
        </View>
      )}
      <Text style={[styles.label, { color: textColor }]} numberOfLines={2}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: 90,
    height: 100,
    borderRadius: 20,
    marginHorizontal: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 6,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 14,
  },
});
