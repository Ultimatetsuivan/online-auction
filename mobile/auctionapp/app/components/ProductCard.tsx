import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import LikeButton from "./LikeButton";
import theme from "../theme";

type Product = {
  id: string;
  title: string;
  price: number | string;
  image?: string;      // remote URL
  localImage?: any;    // require(...)
  timeLeft?: string;   // e.g. "02:15:22"
  bids?: number;       // optional: number of bids
  sold?: boolean;
  available?: boolean;
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

  const isSold = product.sold || !product.available;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        <Image source={src} style={styles.image} />

        {/* SOLD Badge */}
        {isSold && (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldText}>ЗАРАГДСАН</Text>
          </View>
        )}

        {/* Like Button */}
        <View style={styles.likeButtonContainer}>
          <LikeButton productId={product.id} size="sm" />
        </View>
      </View>

      <Text numberOfLines={2} style={styles.title}>
        {product.title}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.price}>₮{typeof product.price === 'number' ? product.price.toLocaleString() : product.price}</Text>
        {product.timeLeft && (
          <Text style={styles.timer}>⏱ {product.timeLeft}</Text>
        )}
      </View>

      {product.bids !== undefined && (
        <Text style={styles.bids}>{product.bids} үнийн санал</Text>
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
  imageContainer: {
    width: "100%",
    height: 130,
    borderRadius: 10,
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  soldOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  soldText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  likeButtonContainer: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 10,
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
