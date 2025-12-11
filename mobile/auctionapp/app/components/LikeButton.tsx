import React, { useState, useEffect } from "react";
import { TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "../theme";

type LikeButtonProps = {
  productId: string;
  size?: "sm" | "md" | "lg";
  onLikeChange?: (isLiked: boolean) => void;
};

export default function LikeButton({ productId, size = "md", onLikeChange }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkIfLiked();
  }, [productId]);

  const checkIfLiked = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) return;

      const user = JSON.parse(userData);
      const userId = user._id || user.id;
      const likedProductsKey = `likedProducts_${userId}`;
      const likedProducts = await AsyncStorage.getItem(likedProductsKey);

      if (likedProducts) {
        const liked = JSON.parse(likedProducts);
        setIsLiked(liked.includes(productId));
      }
    } catch (error) {
      console.error("Error checking liked status:", error);
    }
  };

  const toggleLike = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) {
        Alert.alert("Нэвтрэх шаардлагатай", "Таалагдсан зарууд хадгалахын тулд нэвтэрнэ үү");
        return;
      }

      setLoading(true);
      const user = JSON.parse(userData);
      const userId = user._id || user.id;
      const likedProductsKey = `likedProducts_${userId}`;

      let likedProducts: string[] = [];
      const existingLikes = await AsyncStorage.getItem(likedProductsKey);

      if (existingLikes) {
        likedProducts = JSON.parse(existingLikes);
      }

      let newIsLiked: boolean;
      if (likedProducts.includes(productId)) {
        // Remove from liked
        likedProducts = likedProducts.filter(id => id !== productId);
        newIsLiked = false;
      } else {
        // Add to liked
        likedProducts.push(productId);
        newIsLiked = true;
      }

      await AsyncStorage.setItem(likedProductsKey, JSON.stringify(likedProducts));
      setIsLiked(newIsLiked);

      if (onLikeChange) {
        onLikeChange(newIsLiked);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      Alert.alert("Алдаа", "Таалагдсан зарууд хадгалахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const iconSize = size === "sm" ? 20 : size === "lg" ? 32 : 24;
  const containerSize = size === "sm" ? 32 : size === "lg" ? 48 : 40;

  return (
    <TouchableOpacity
      style={[
        styles.likeButton,
        { width: containerSize, height: containerSize },
        isLiked && styles.likeButtonActive,
      ]}
      onPress={toggleLike}
      disabled={loading}
      activeOpacity={0.7}
    >
      <Ionicons
        name={isLiked ? "heart" : "heart-outline"}
        size={iconSize}
        color={isLiked ? "#FF6A00" : theme.gray700}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  likeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  likeButtonActive: {
    backgroundColor: "#FFF5F0",
  },
});
