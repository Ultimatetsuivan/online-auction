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
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Зар нэмэх",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "add-circle" : "add-circle-outline"} color={color} size={size} />
          ),
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
