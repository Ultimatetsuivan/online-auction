import React, { useMemo } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CountdownTimer from "./CountdownTimer";
import LikeButton from "./LikeButton";
import theme from "../../app/theme";
import { useTheme } from "../../src/contexts/ThemeContext";

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
    sellType?: string;
    isOwner?: boolean;
  };
  onPress?: () => void;
};

const AuctionCard = React.memo<AuctionCardProps>(({ product, onPress }) => {
  const { isDarkMode, themeColors } = useTheme();
  const styles = useMemo(() => getStyles(themeColors, isDarkMode), [themeColors, isDarkMode]);

  const imageSource = product.localImage
    ? product.localImage
    : product.image
    ? { uri: product.image }
    : require("../../assets/images/default.png");

  const price = product.currentBid || product.price || 0;
  const formattedPrice = typeof price === 'number' ? price.toLocaleString() : price;
  const isSold = product.sold === true;
  const isFixedPrice = product.sellType === 'fixed' || product.sellType === 'buy_now';
  const isOwner = product.isOwner === true;

  const isEndingSoon = () => {
    if (!product.timeLeft) return false;
    const { minutes,hours,days } = product.timeLeft;
    return minutes < 5 && minutes >= 0 && hours === 0 && days === 0;
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

        {/* Time Left Badge — hidden for fixed price */}
        {product.bidDeadline && !isSold && !isFixedPrice && (
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
            <Text style={styles.priceLabel}>{isFixedPrice ? 'Үнэ' : 'Одоогийн үнэ'}</Text>
            <Text style={styles.price}>₮{formattedPrice}</Text>
          </View>
          {!isFixedPrice && product.bids !== undefined && (
            <View style={styles.bidsContainer}>
              <Ionicons name="people-outline" size={16} color={themeColors.textSecondary} />
              <Text style={styles.bidsText}>{product.bids} санал байна</Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        {!isSold && (
          <TouchableOpacity
            style={[styles.bidButton, isOwner && styles.ownerButton]}
            onPress={onPress}
          >
            <Text style={styles.bidButtonText}>
              {isOwner ? 'Миний бараа' : isFixedPrice ? 'Худалдаж авах' : 'Үнийн санал өгөх'}
            </Text>
            {!isOwner && <Ionicons name="arrow-forward" size={16} color="#fff" />}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

AuctionCard.displayName = 'AuctionCard';

export default AuctionCard;

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      marginBottom: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.2 : 0.12,
      shadowRadius: 12,
      elevation: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    imageContainer: {
      width: "100%",
      height: 220,
      position: "relative",
      backgroundColor: colors.sectionBg,
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
      backgroundColor: "rgba(248, 248, 248, 0.7)",
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
      backgroundColor: colors.card,
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
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
      color: colors.textSecondary,
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
      color: colors.textSecondary,
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
    ownerButton: {
      backgroundColor: "#94a3b8",
      shadowColor: "#94a3b8",
    },
    bidButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
  });
