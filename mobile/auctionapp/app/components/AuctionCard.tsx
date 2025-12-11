import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CountdownTimer from "./CountdownTimer";
import LikeButton from "./LikeButton";
import theme from "../../app/theme";

type AuctionCardProps = {
  product: {
    id: string;
    title: string;
    price: number | string;
    currentBid?: number;
    image?: string;
    localImage?: any;
    bidDeadline?: string;
    bids?: number;
    timeLeft?: { days: number; hours: number; minutes: number; seconds: number };
    sold?: boolean;
    available?: boolean;
  };
  onPress?: () => void;
};

const AuctionCard = React.memo<AuctionCardProps>(({ product, onPress }) => {
  const imageSource = product.localImage
    ? product.localImage
    : product.image
    ? { uri: product.image }
    : require("../../assets/images/default.png");

  const price = product.currentBid || product.price || 0;
  const formattedPrice = typeof price === 'number' ? price.toLocaleString() : price;
  // Only show as sold if explicitly sold
  const isSold = product.sold === true;

  const isEndingSoon = () => {
    if (!product.timeLeft) return false;
    const { hours } = product.timeLeft;
    return hours < 24 && hours >= 0;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />

        {/* SOLD Overlay */}
        {isSold && (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldText}>ЗАРАГДСАН</Text>
          </View>
        )}

        {/* Badge Overlay */}
        {!isSold && (
          <View style={styles.gradientOverlay}>
            {isEndingSoon() && (
              <View style={styles.endingBadge}>
                <Ionicons name="time" size={12} color="#fff" />
                <Text style={styles.endingText}>Дуусах гэж байна</Text>
              </View>
            )}
          </View>
        )}

        {/* Time Left Badge */}
        {product.bidDeadline && !isSold && (
          <View style={styles.timeBadge}>
            <CountdownTimer
              deadline={product.bidDeadline}
              onEnd={() => {
                // Handle auction end
              }}
            />
          </View>
        )}

        {/* Like Button */}
        <View style={styles.likeButtonContainer}>
          <LikeButton productId={product.id} size="sm" />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>Current Bid</Text>
            <Text style={styles.price}>₮{formattedPrice}</Text>
          </View>
          {product.bids !== undefined && (
            <View style={styles.bidsContainer}>
              <Ionicons name="people-outline" size={16} color={theme.gray500} />
              <Text style={styles.bidsText}>{product.bids} bids</Text>
            </View>
          )}
        </View>

        {/* Bid Button */}
        {!isSold && (
          <TouchableOpacity style={styles.bidButton} onPress={onPress}>
            <Text style={styles.bidButtonText}>Үнийн санал өгөх</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

AuctionCard.displayName = 'AuctionCard';

export default AuctionCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: theme.gray100,
  },
  imageContainer: {
    width: "100%",
    height: 220,
    position: "relative",
    backgroundColor: theme.gray50,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    padding: 12,
  },
  endingBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  endingText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  timeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  timeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    padding: 18,
    backgroundColor: theme.white,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.gray900,
    marginBottom: 14,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 11,
    color: theme.gray500,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.brand600,
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
    fontSize: 28,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  likeButtonContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 10,
  },
  bidsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bidsText: {
    fontSize: 13,
    color: theme.gray500,
    fontWeight: "500",
  },
  bidButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.brand600,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: theme.brand600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bidButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
