import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import theme from "../theme";
import { useTheme } from "../../src/contexts/ThemeContext";

export default function TabsLayout() {
  const { isDarkMode, themeColors } = useTheme();

  // Ensure themeColors is defined with fallback
  const safeThemeColors = themeColors || {
    textSecondary: theme.gray600,
    surface: theme.white,
    border: theme.gray200,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.brand600,
        tabBarInactiveTintColor: safeThemeColors.textSecondary,
        tabBarStyle: {
          backgroundColor: safeThemeColors.surface,
          borderTopColor: safeThemeColors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontWeight: "600",
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Нүүр",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Ангилал",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null, // Hide from tab bar
        }}
      />
       <Tabs.Screen
        name="notifications"
        options={{
          title: "Миний жагсаалт",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="selling"
        options={{
          title: "Миний зар",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "cube" : "cube-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профайл",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
