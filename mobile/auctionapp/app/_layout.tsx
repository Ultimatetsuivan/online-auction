import "react-native-gesture-handler";
import "react-native-reanimated";
import { Stack } from "expo-router";
import { AuthProvider } from "../src/contexts/AuthContext";
import { ThemeProvider, useTheme } from "../src/contexts/ThemeContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import theme from "./theme";
import React from "react";

function AppContent() {
  const { isDarkMode, themeColors, isLoading: themeLoading } = useTheme();

  if (themeLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.gray50 }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={theme.brand600} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        {/* (tabs) group becomes the main screen */}
        <Stack.Screen name="(tabs)" />
        {/* detail pages push above tabs */}
        <Stack.Screen name="product/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="category/[id]" options={{ presentation: "card" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
