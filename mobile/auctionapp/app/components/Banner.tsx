import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import theme from "../theme";

export default function Banner({ title, subtitle, image, dark }: any) {
  return (
    <View style={[styles.container, dark && { backgroundColor: theme.gray900 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, dark && { color: theme.white }]}>{title}</Text>
        <Text style={[styles.subtitle, dark && { color: "#ccc" }]}>{subtitle}</Text>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: dark ? theme.white : theme.brand600 },
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              { color: dark ? theme.gray900 : theme.white },
            ]}
          >
            Shop now
          </Text>
        </TouchableOpacity>
      </View>
      <Image source={image} style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.brand100,
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14, color: theme.gray700, marginBottom: 8 },
  button: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  buttonText: { fontWeight: "600" },
  image: { width: 100, height: 100, resizeMode: "contain" },
});
