import "react-native-gesture-handler";
import "react-native-reanimated";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* (tabs) group becomes the main screen */}
      <Stack.Screen name="(tabs)" />
      {/* detail pages push above tabs */}
      <Stack.Screen name="product/[id]" options={{ presentation: "card" }} />
      <Stack.Screen name="category/[id]" options={{ presentation: "card" }} />
    </Stack>
  );
}
