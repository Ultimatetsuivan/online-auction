import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import theme from "../theme"; // <-- import theme

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.brand600,
        tabBarInactiveTintColor: theme.gray500,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: theme.gray200,
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Зар нэмэх",
          tabBarIcon: ({ color, size}) => (
            <Ionicons name="add-circle" color={color} size={size} />
          ),
        }}
      />
       <Tabs.Screen
        name="notifications"
        options={{
          title: "Хадгалсан",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="selling"
        options={{
          title: "Миний зар",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профайл",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
