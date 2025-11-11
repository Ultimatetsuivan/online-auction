import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import theme from "../theme";

type Product = {
  id: string;
  title: string;
  price: number | string;
  image?: string;      // remote URL
  localImage?: any;    // require(...)
  timeLeft?: string;   // e.g. "02:15:22"
  bids?: number;       // optional: number of bids
};

export default function ProductCard({
  product,
  onPress,
}: {
  product: Product;
  onPress?: () => void;
}) {
  const src = product.localImage
    ? product.localImage
    : { uri: product.image };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image source={src} style={styles.image} />
      <Text numberOfLines={2} style={styles.title}>
        {product.title}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.price}>${product.price}</Text>
        {product.timeLeft && (
          <Text style={styles.timer}>⏱ {product.timeLeft}</Text>
        )}
      </View>

      {product.bids !== undefined && (
        <Text style={styles.bids}>{product.bids} bids</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: theme.white,
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F2F2F2",
  },
  image: {
    width: "100%",
    height: 130,
    borderRadius: 10,
    resizeMode: "cover",
  },
  title: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: theme.gray900,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    color: theme.brand600,
    fontWeight: "700",
    fontSize: 14,
  },
  timer: {
    fontSize: 12,
    color: theme.gray500,
  },
  bids: {
    marginTop: 4,
    fontSize: 12,
    color: theme.gray700,
    fontWeight: "500",
  },
});
