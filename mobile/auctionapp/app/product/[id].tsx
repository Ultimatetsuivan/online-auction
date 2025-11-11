import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import CountdownTimer from "../components/CountdownTimer";
import theme from "../theme";
import { api } from "../../src/api";

const { width } = Dimensions.get("window");

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);

  const fetchProductDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/product/${id}`);
      const productData = response.data?.data || response.data;
      setProduct(productData);

      // Set initial bid amount to minimum next bid
      const minBid = (productData.currentBid || productData.price || 0) + 1000;
      setBidAmount(minBid.toString());

      // Fetch similar products
      if (productData.category) {
        const similarRes = await api.get(`/api/product/products`);
        const allProducts = similarRes.data?.data || similarRes.data || [];
        const similar = allProducts
          .filter((p: any) => p._id !== id && p.category === productData.category)
          .slice(0, 3);
        setSimilarProducts(similar);
      }
    } catch (err: any) {
      console.error("Error fetching product:", err);
      Alert.alert("Error", "Failed to load product details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  const handlePlaceBid = async () => {
    if (!bidAmount || isNaN(Number(bidAmount))) {
      Alert.alert("Invalid Amount", "Please enter a valid bid amount");
      return;
    }

    const bid = Number(bidAmount);
    const currentBid = product.currentBid || product.price || 0;

    if (bid <= currentBid) {
      Alert.alert(
        "Bid Too Low",
        `Your bid must be higher than ₮${currentBid.toLocaleString()}`
      );
      return;
    }

    Alert.alert(
      "Confirm Bid",
      `Place a bid of ₮${bid.toLocaleString()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setSubmitting(true);
              await api.post(`/api/product/${id}/bid`, { bidAmount: bid });

              // Haptic feedback
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              Alert.alert("Success", "Your bid has been placed!");
              fetchProductDetail(); // Refresh product data
            } catch (err: any) {
              console.error("Error placing bid:", err);
              const errorMsg = err.response?.data?.message || "Failed to place bid";
              Alert.alert("Error", errorMsg);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProductDetail();
  }, [fetchProductDetail]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.brand600} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.gray400} />
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = product.images || [];
  const currentImage = images[selectedImageIndex]?.url || null;
  const imageSource = currentImage
    ? { uri: currentImage }
    : require("../../assets/images/default.png");

  const formatPrice = (price: number) => {
    return price ? `₮${price.toLocaleString()}` : "₮0";
  };

  const isAuctionEnded = product.bidDeadline && new Date(product.bidDeadline) < new Date();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert("Share", "Share functionality coming soon!");
            }}
          >
            <Ionicons name="share-outline" size={24} color={theme.gray900} />
          </TouchableOpacity>
        </View>

        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          <Image source={imageSource} style={styles.mainImage} resizeMode="cover" />

          {/* Image Counter */}
          {images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {selectedImageIndex + 1} / {images.length}
              </Text>
            </View>
          )}

          {/* Auction Status Badge */}
          {isAuctionEnded ? (
            <View style={[styles.statusBadge, styles.endedBadge]}>
              <Ionicons name="close-circle" size={16} color="#fff" />
              <Text style={styles.statusBadgeText}>Auction Ended</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.activeBadge]}>
              <Ionicons name="time" size={16} color="#fff" />
              <Text style={styles.statusBadgeText}>Live Auction</Text>
            </View>
          )}
        </View>

        {/* Image Thumbnails */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailContainer}
          >
            {images.map((img: any, index: number) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedImageIndex(index);
                }}
                style={[
                  styles.thumbnail,
                  selectedImageIndex === index && styles.thumbnailSelected,
                ]}
              >
                <Image
                  source={{ uri: img.url }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.productTitle}>{product.title}</Text>

          {/* Countdown Timer */}
          {product.bidDeadline && !isAuctionEnded && (
            <View style={styles.timerSection}>
              <Ionicons name="time-outline" size={20} color={theme.brand600} />
              <Text style={styles.timerLabel}>Time Remaining:</Text>
              <CountdownTimer
                deadline={product.bidDeadline}
                onEnd={() => fetchProductDetail()}
              />
            </View>
          )}

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View>
              <Text style={styles.priceLabel}>Current Bid</Text>
              <Text style={styles.priceAmount}>
                {formatPrice(product.currentBid || product.price)}
              </Text>
            </View>
            <View style={styles.bidsInfo}>
              <Ionicons name="people" size={20} color={theme.gray500} />
              <Text style={styles.bidsCount}>{product.bids?.length || 0} bids</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {product.description || "No description available"}
            </Text>
          </View>

          {/* Product Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{product.category || "N/A"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Brand</Text>
              <Text style={styles.detailValue}>{product.brand || "N/A"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Condition</Text>
              <Text style={styles.detailValue}>{product.condition || "N/A"}</Text>
            </View>
          </View>

          {/* Bid History */}
          {product.bids && product.bids.length > 0 && (
            <View style={styles.bidHistorySection}>
              <Text style={styles.sectionTitle}>Bid History</Text>
              {product.bids.slice(0, 5).map((bid: any, index: number) => (
                <View key={index} style={styles.bidHistoryItem}>
                  <View style={styles.bidHistoryLeft}>
                    <Ionicons name="person-circle-outline" size={24} color={theme.gray500} />
                    <Text style={styles.bidHistoryUser}>
                      {bid.user?.name || "Anonymous"}
                    </Text>
                  </View>
                  <Text style={styles.bidHistoryAmount}>
                    {formatPrice(bid.bidAmount)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.sectionTitle}>Similar Products</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {similarProducts.map((item: any) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.similarCard}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/product/${item._id}`);
                    }}
                  >
                    <Image
                      source={
                        item.images?.[0]?.url
                          ? { uri: item.images[0].url }
                          : require("../../assets/images/default.png")
                      }
                      style={styles.similarImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.similarTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.similarPrice}>
                      {formatPrice(item.currentBid || item.price)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bid Action Bar */}
      {!isAuctionEnded && (
        <View style={styles.actionBar}>
          <View style={styles.bidInputContainer}>
            <Text style={styles.bidInputLabel}>Your Bid (₮)</Text>
            <TextInput
              style={styles.bidInput}
              value={bidAmount}
              onChangeText={setBidAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={theme.gray400}
            />
          </View>
          <TouchableOpacity
            style={[styles.bidButton, submitting && styles.bidButtonDisabled]}
            onPress={handlePlaceBid}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="hammer" size={20} color="#fff" />
                <Text style={styles.bidButtonText}>Place Bid</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.gray50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.gray600,
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    color: theme.gray600,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.brand600,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: theme.gray200,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.gray900,
  },
  imageGallery: {
    width: width,
    height: 300,
    backgroundColor: theme.gray100,
    position: "relative",
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  imageCounter: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  activeBadge: {
    backgroundColor: theme.brand600,
  },
  endedBadge: {
    backgroundColor: theme.gray500,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  thumbnail: {
    width: 70,
    height: 70,
    marginRight: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  thumbnailSelected: {
    borderColor: theme.brand600,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  infoSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 8,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.gray900,
    marginBottom: 16,
  },
  timerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.brand50,
    borderRadius: 12,
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.gray700,
  },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.gray200,
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 12,
    color: theme.gray500,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.brand600,
  },
  bidsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bidsCount: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.gray600,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.gray900,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: theme.gray600,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray200,
  },
  detailLabel: {
    fontSize: 15,
    color: theme.gray600,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.gray900,
  },
  bidHistorySection: {
    marginBottom: 24,
  },
  bidHistoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.gray200,
  },
  bidHistoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bidHistoryUser: {
    fontSize: 15,
    color: theme.gray700,
    fontWeight: "500",
  },
  bidHistoryAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.brand600,
  },
  similarSection: {
    marginBottom: 24,
  },
  similarCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: theme.gray50,
    borderRadius: 12,
    overflow: "hidden",
  },
  similarImage: {
    width: "100%",
    height: 120,
  },
  similarTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.gray900,
    padding: 8,
    paddingBottom: 4,
  },
  similarPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.brand600,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: theme.gray200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bidInputContainer: {
    flex: 1,
  },
  bidInputLabel: {
    fontSize: 11,
    color: theme.gray500,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  bidInput: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.gray300,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "600",
    color: theme.gray900,
  },
  bidButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: theme.brand600,
    borderRadius: 12,
    minWidth: 120,
  },
  bidButtonDisabled: {
    opacity: 0.6,
  },
  bidButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
