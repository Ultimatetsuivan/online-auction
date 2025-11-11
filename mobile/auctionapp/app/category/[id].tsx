import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import theme from "../theme";
import ProductCard from "../components/ProductCard";

export default function CategoryPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const products = [
    { id: "1", title: "One Piece Dress A", price: 52000, localImage: require("../../assets/images/jamika.png") },
    { id: "2", title: "One Piece Dress B", price: 60000, localImage: require("../../assets/images/jamika.png") },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.gray900 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Category ${id}`,
          headerTintColor: "#fff",
          headerStyle: { backgroundColor: theme.gray900 },
        }}
      />
      <ScrollView contentContainerStyle={styles.grid}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});
