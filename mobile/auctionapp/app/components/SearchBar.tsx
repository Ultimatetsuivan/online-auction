import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../theme";

export default function SearchBar({
  placeholder = "Search for anything",
  onChangeText,
  onCameraPress,
  dark,
}: {
  placeholder?: string;
  onChangeText?: (text: string) => void;
  onCameraPress?: () => void;
  dark?: boolean;
}) {
  const bg = dark ? "#1C1C1E" : "#F2F4F7";
  const color = dark ? theme.white : theme.gray900;
  const iconColor = dark ? "#999" : theme.gray500;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Ionicons name="search" size={20} color={iconColor} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={iconColor}
        style={[styles.input, { color }]}
        onChangeText={onChangeText}
      />
      <TouchableOpacity onPress={onCameraPress} activeOpacity={0.7}>
        <Ionicons
          name="camera-outline"
          size={22}
          color={theme.brand600}
          style={styles.cameraIcon}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingLeft: 8,
    fontSize: 15,
  },
  cameraIcon: {
    marginLeft: 6,
  },
});
