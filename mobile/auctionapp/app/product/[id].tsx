import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Share,
  FlatList,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RenderHtml from "react-native-render-html";
import CountdownTimer from "../components/CountdownTimer";
import { ProductDetailSkeleton } from "../../src/components/SkeletonLoader";
import {useTheme } from "../../src/contexts/ThemeContext";
import { SuccessConfetti } from "../components/SuccessConfetti";
import theme from "../theme";
import { api } from "../../src/api";

const { width } = Dimensions.get("window");


export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDarkMode: isDark, themeColors } = useTheme();
  const palette = { ...theme, ...themeColors };
  const styles = getStyles(palette, isDark);

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [bidHistory, setBidHistory] = useState<any[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [depositInfo, setDepositInfo] = useState<{
    depositRequired: boolean;
    hasDeposit: boolean;
    depositAmount: number;
  } | null>(null);
  const [placingDeposit, setPlacingDeposit] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchBidHistory = useCallback(async () => {
    try {
      const response = await api.get(`/api/bidding/${id}`);
      const history = response.data?.history || response.data?.data || response.data || [];
      const list = Array.isArray(history) ? history : [];
      const sorted = list.sort(
        (a: any, b: any) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setBidHistory(sorted);
    } catch (err) {
      setBidHistory([]);
    }
  }, [id]);

  const fetchProductDetail = useCallback(async () => {
    try {
      setLoading(true);

      // Get current user ID
      const userData = await AsyncStorage.getItem("user");
      let userId: string | null = null;
      if (userData) {
        const user = JSON.parse(userData);
        userId = user._id;
        setCurrentUserId(user._id);
      }

      const response = await api.get(`/api/product/${id}`);
      const productData = response.data?.data || response.data;
      setProduct(productData);

      // Set initial bid amount to minimum next bid
      const minBid = (productData.currentBid || productData.price || 0) + Math.max(productData.minIncrement || 5000, 5000);
      setBidAmount(minBid.toString());

      // Check deposit requirement for high-value products
      if (userId) {
        const productOwner = productData.user?._id || productData.user;
        const isProductOwner = productOwner && userId.toString() === productOwner.toString();
        if (!isProductOwner) {
          try {
            const depositRes = await api.get(`/api/deposits/check/${id}`);
            setDepositInfo(depositRes.data);
          } catch (_) {}
        }
      }

      // Fetch similar products
      if (productData.category) {
        const similarRes = await api.get(`/api/product/products`);
        const allProducts = similarRes.data?.data || similarRes.data || [];
        const similar = allProducts
          .filter((p: any) => p._id !== id && p.category === productData.category)
          .slice(0, 3);
        setSimilarProducts(similar);
      }

      await fetchBidHistory();
    } catch (err: any) {
      console.error("Error fetching product:", err);
      Alert.alert("Алдаа", "Барааны мэдээлэл татахад алдаа гарлаа");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchBidHistory, id]);

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  // Poll for live bid updates every 15 seconds for active auctions
  useEffect(() => {
    if (!product || product.sold || !id) return;
    const isAuctionActive = product.bidDeadline && new Date(product.bidDeadline) > new Date();
    if (!isAuctionActive) return;

    const interval = setInterval(async () => {
      try {
        const [productRes, bidsRes] = await Promise.all([
          api.get(`/api/product/${id}`),
          api.get(`/api/bidding/${id}`),
        ]);
        const updated = productRes.data?.data || productRes.data;
        if (updated?.currentBid !== product?.currentBid) {
          setProduct(updated);
          const minBid = (updated.currentBid || updated.price || 0) + Math.max(updated.minIncrement || 5000, 5000);
          setBidAmount(minBid.toString());
        }
        const history = bidsRes.data?.history || bidsRes.data?.data || bidsRes.data || [];
        const list = Array.isArray(history) ? history : [];
        setBidHistory(list.sort((a: any, b: any) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        ));
      } catch (_) {}
    }, 15000);

    return () => clearInterval(interval);
  }, [product?.sold, product?.bidDeadline, product?.currentBid, id]);

  const handlePlaceBid = async () => {
    // Check if user is logged in
    const userData = await AsyncStorage.getItem("user");
    if (!userData) {
      Alert.alert(
        "Нэвтрэх шаардлагатай",
        "Санал өгөхийн тулд эхлээд нэвтэрнэ үү",
        [
          { text: "Цуцлах", style: "cancel" },
          {
            text: "Нэвтрэх",
            onPress: () => router.push("/(hidden)/login"),
          },
        ]
      );
      return;
    }

    if (!bidAmount || isNaN(Number(bidAmount))) {
      Alert.alert("Алдаа", "Үнийн дүн зөв оруулна уу");
      return;
    }

    const bid = Number(bidAmount);
    const currentBid = product.currentBid || product.price || 0;

    if (bid <= currentBid) {
      Alert.alert(
        "Үнэ бага байна",
        `Таны санал ₮${currentBid.toLocaleString()}-аас их байх ёстой`
      );
      return;
    }

    if (depositInfo?.depositRequired && !depositInfo?.hasDeposit) {
      Alert.alert(
        "Дэнчин шаардлагатай",
        `Санал өгөхийн тулд ₮${depositInfo.depositAmount.toLocaleString()} дэнчин байршуулна уу.`,
        [
          { text: "Цуцлах", style: "cancel" },
          { text: "Дэнчин байршуулах", onPress: handlePlaceDeposit },
        ]
      );
      return;
    }

    Alert.alert(
      "Санал баталгаажуулах",
      `₮${bid.toLocaleString()} үнэ санал өгөх үү?`,
      [
        { text: "Цуцлах", style: "cancel" },
        {
          text: "Батлах",
          onPress: async () => {
            try {
              setSubmitting(true);

              // Backend expects /api/bidding/ with productId and price
              await api.post('/api/bidding/', {
                productId: id,
                price: bid
              });

              // Haptic feedback
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              // Show celebration confetti
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 4000);

              Alert.alert("🎊 Амжилттай!", "Таны санал амжилттай бүртгэгдлээ!");
              fetchProductDetail(); // Refresh product data
            } catch (err: any) {
              console.error("Error placing bid:", err);
              const errorMsg = err.response?.data?.message || "Санал өгөхөд алдаа гарлаа";
              Alert.alert("Алдаа", errorMsg);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleBuyNow = async () => {
    // Check if user is logged in
    const userData = await AsyncStorage.getItem("user");
    if (!userData) {
      Alert.alert(
        "Нэвтрэх шаардлагатай",
        "Худалдаж авахын тулд эхлээд нэвтэрнэ үү",
        [
          { text: "Цуцлах", style: "cancel" },
          {
            text: "Нэвтрэх",
            onPress: () => router.push("/(hidden)/login"),
          },
        ]
      );
      return;
    }

    const buyPrice = product.price || 0;

    Alert.alert(
      "Худалдан авалт баталгаажуулах",
      `₮${buyPrice.toLocaleString()} үнээр худалдаж авах уу?`,
      [
        { text: "Цуцлах", style: "cancel" },
        {
          text: "Батлах",
          onPress: async () => {
            try {
              setSubmitting(true);

              // Call buy now endpoint
              await api.post(`/api/product/${id}/buy-now`);

              // Haptic feedback
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              // Show celebration confetti
              setShowConfetti(true);

              Alert.alert(
                "🎉 Баяр хүргэе!",
                "Та амжилттай худалдаж авлаа!",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      setShowConfetti(false);
                      fetchProductDetail(); // Refresh product data
                      router.back(); // Go back to previous screen
                    }
                  }
                ]
              );
            } catch (err: any) {
              const errorMsg = err.response?.data?.message || "Худалдан авахад алдаа гарлаа";
              Alert.alert("Алдаа", errorMsg);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handlePlaceDeposit = async () => {
    const userData = await AsyncStorage.getItem("user");
    if (!userData) {
      Alert.alert(
        "Нэвтрэх шаардлагатай",
        "Дэнчин байршуулахын тулд нэвтэрнэ үү",
        [
          { text: "Цуцлах", style: "cancel" },
          { text: "Нэвтрэх", onPress: () => router.push("/(hidden)/login") },
        ]
      );
      return;
    }
    if (!depositInfo) return;

    Alert.alert(
      "Дэнчин байршуулах",
      `₮${depositInfo.depositAmount.toLocaleString()} дэнчин байршуулах уу?\n\nДуудлага худалдаа дуусахад буцаагдана.`,
      [
        { text: "Цуцлах", style: "cancel" },
        {
          text: "Батлах",
          onPress: async () => {
            try {
              setPlacingDeposit(true);
              await api.post("/api/deposits", { productId: id });
              const depositRes = await api.get(`/api/deposits/check/${id}`);
              setDepositInfo(depositRes.data);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Амжилттай!", "Дэнчин байршуулагдлаа. Та одоо санал өгч болно.");
            } catch (err: any) {
              const errorMsg = err.response?.data?.error || "Дэнчин байршуулахад алдаа гарлаа";
              if (err.response?.data?.current !== undefined) {
                Alert.alert(
                  "Дансны үлдэгдэл хүрэлцэхгүй",
                  `Шаардлагатай: ₮${depositInfo.depositAmount.toLocaleString()}\n\nДансаа цэнэглэх үү?`,
                  [
                    { text: "Цуцлах", style: "cancel" },
                    { text: "Цэнэглэх", onPress: () => router.push("/(hidden)/balance") },
                  ]
                );
              } else if (err.response?.status === 403) {
                Alert.alert(
                  "Үйлчилгээний нөхцөл",
                  "Дэнчин байршуулахын тулд үйлчилгээний нөхцлийг зөвшөөрнө үү.",
                  [
                    { text: "Цуцлах", style: "cancel" },
                    { text: "Зөвшөөрөх", onPress: () => router.push("/(hidden)/eula-acceptance") },
                  ]
                );
              } else {
                Alert.alert("Алдаа", errorMsg);
              }
            } finally {
              setPlacingDeposit(false);
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
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ProductDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={palette.gray400} />
        <Text style={styles.errorText}>Бараа олдсонгүй</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Буцах</Text>
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

  // Check if current user is the product owner
  const productOwnerId = product.user?._id || product.user;
  const isOwner = currentUserId && productOwnerId && currentUserId.toString() === productOwnerId.toString();

  // Determine if this is a fixed price or auction product
  const isFixedPrice = product.sellType === 'fixed';
  const isAuction = !isFixedPrice;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: !isOwner && !isAuctionEnded ? 100 : 20 }}
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
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Дэлгэрэнгүй</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Share.share({ message: `${product?.title} — BidNomad дээр харна уу` });
            }}
          >
            <Ionicons name="share-outline" size={24} color={palette.text} />
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
              <Text style={styles.statusBadgeText}>Зарагдсан</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.activeBadge]}>
              <Ionicons name="time" size={16} color="#fff" />
              <Text style={styles.statusBadgeText}>Зарагдаж байгаа</Text>
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
              <Ionicons name="time-outline" size={20} color={palette.brand600} />
              <Text style={styles.timerLabel}>Цаг дуусахад</Text>
              <CountdownTimer
                deadline={product.bidDeadline}
                onEnd={() => fetchProductDetail()}
              />
            </View>
          )}

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View>
              <Text style={styles.priceLabel}>Одоогийн үнэ</Text>
              <Text style={styles.priceAmount}>
                {formatPrice(product.currentBid || product.price)}
              </Text>
            </View>
            <View style={styles.bidsInfo}>
              <Ionicons name="people" size={20} color={palette.textSecondary} />
              <Text style={styles.bidsCount}>{product.bids?.length || 0} санал байна</Text>
            </View>
          </View>

          {/* Deposit Required Banner */}
          {depositInfo?.depositRequired && !isOwner && (
            <View style={[styles.depositBanner, depositInfo.hasDeposit && styles.depositBannerActive]}>
              <Ionicons
                name={depositInfo.hasDeposit ? "shield-checkmark" : "lock-closed"}
                size={22}
                color={depositInfo.hasDeposit ? "#16a34a" : "#f59e0b"}
              />
              <View style={styles.depositBannerBody}>
                <Text style={[styles.depositBannerTitle, { color: depositInfo.hasDeposit ? "#16a34a" : palette.text }]}>
                  {depositInfo.hasDeposit ? "Дэнчин байршсан" : "Дэнчин шаардлагатай"}
                </Text>
                <Text style={styles.depositBannerSub}>
                  ₮{depositInfo.depositAmount.toLocaleString()} · дуудлага дуусахад буцаагдана
                </Text>
              </View>
              {!depositInfo.hasDeposit && (
                <TouchableOpacity style={styles.depositBannerBtn} onPress={handlePlaceDeposit} disabled={placingDeposit}>
                  <Text style={styles.depositBannerBtnText}>{placingDeposit ? "..." : "Байршуулах"}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Description - Rich HTML */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Дэлгэрэнгүй</Text>
            {product.description ? (
              <RenderHtml
                contentWidth={width - 64}
                source={{ html: product.description }}
                tagsStyles={{
                  body: { color: palette.textSecondary, fontSize: 15, lineHeight: 24 },
                  p: { marginBottom: 10 },
                  h1: { color: palette.text, fontSize: 24, fontWeight: "700", marginVertical: 10 },
                  h2: { color: palette.text, fontSize: 20, fontWeight: "700", marginVertical: 8 },
                  h3: { color: palette.text, fontSize: 18, fontWeight: "600", marginVertical: 6 },
                  a: { color: palette.brand600, textDecorationLine: "underline" },
                  strong: { fontWeight: "700", color: palette.text },
                  em: { fontStyle: "italic", color: palette.textSecondary },
                }}
              />
            ) : (
              <Text style={styles.description}>No description available</Text>
            )}
          </View>

          {/* Vehicle History Report */}
          {product.vin && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="document-text-outline" size={20} color={palette.text} /> Vehicle History Report
              </Text>
              {product.vehicleHistoryReport?.available ? (
                <View style={styles.vehicleReportAvailable}>
                  <View style={styles.vehicleReportHeader}>
                    <Ionicons name="shield-checkmark" size={32} color={palette.success500 || "#10B981"} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.vehicleReportTitle}>Report Available</Text>
                      <Text style={styles.vehicleReportProvider}>
                        Provider: {product.vehicleHistoryReport.provider}
                      </Text>
                    </View>
                  </View>
                  {product.vehicleHistoryReport.reportUrl && (
                    <TouchableOpacity style={styles.vehicleReportButton}>
                      <Text style={styles.vehicleReportButtonText}>View Full Report</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.vehicleReportUnavailable}>
                  <Text style={styles.vehicleReportUnavailableText}>
                    <Ionicons name="information-circle" size={16} /> Report not available
                  </Text>
                  <Text style={styles.vehicleReportReason}>
                    This may be due to the vehicle's age, origin, or VIN format.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Item Specifics Grid */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Нарийн мэдээлэл</Text>

            <View style={styles.specificsGrid}>
              {/* Category */}
              <View style={styles.specificItem}>
                <Text style={styles.specificLabel}>Категори</Text>
                <Text style={styles.specificValue}>
                  {product.category?.title ||
                    product.category?.titleMn ||
                    product.category?.name ||
                    "N/A"}
                </Text>
              </View>

              {/* Vehicle Fields */}
              {product.year && (
                <View style={styles.specificItem}>
                  <Text style={styles.specificLabel}>Жил</Text>
                  <Text style={styles.specificValue}>{product.year}</Text>
                </View>
              )}
              {product.make && (
                <View style={styles.specificItem}>
                  <Text style={styles.specificLabel}>Үйлдвэр</Text>
                  <Text style={styles.specificValue}>{product.make}</Text>
                </View>
              )}
              {product.model && (
                <View style={styles.specificItem}>
                  <Text style={styles.specificLabel}>Модель</Text>
                  <Text style={styles.specificValue}>{product.model}</Text>
                </View>
              )}
              {product.mileage && (
                <View style={styles.specificItem}>
                  <Text style={styles.specificLabel}>Явсан миль</Text>
                  <Text style={styles.specificValue}>{product.mileage.toLocaleString()} km</Text>
                </View>
              )}
              {product.transmission && (
                <View style={styles.specificItem}>
                  <Text style={styles.specificLabel}>Араа</Text>
                  <Text style={styles.specificValue}>{product.transmission}</Text>
                </View>
              )}
              {product.fuelType && (
                <View style={styles.specificItem}>
                  <Text style={styles.specificLabel}>Түлшний төрөл</Text>
                  <Text style={styles.specificValue}>{product.fuelType}</Text>
                </View>
              )}
              {product.vehicleTitle && (
                <View style={styles.specificItem}>
                  <Text style={styles.specificLabel}>Машины нэр</Text>
                  <Text style={styles.specificValue}>{product.vehicleTitle}</Text>
                </View>
              )}
              {product.vin && (
                <View style={[styles.specificItem, { width: "100%" }]}>
                  <Text style={styles.specificLabel}>VIN</Text>
                  <Text style={[styles.specificValue, { fontFamily: "monospace" }]}>{product.vin}</Text>
                </View>
              )}

              {/* General Fields */}
              {product.brand && (
                <View style={styles.specificItem}>
                  <Text style={styles.specificLabel}>Бренд</Text>
                  <Text style={styles.specificValue}>{product.brand}</Text>
                </View>
              )}
              {product.condition && (
                <View style={styles.specificItem}>
                  <Text style={styles.specificLabel}>Хэрэглэсэн эсэх</Text>
                  <Text style={styles.specificValue}>{product.condition}</Text>
                </View>
              )}
              {product.color && (
                <View style={styles.specificItem}>
                  <Text style={styles.specificLabel}>Өнгө</Text>
                  <Text style={styles.specificValue}>{product.color}</Text>
                </View>
              )}
              {product.size && (
                <View style={styles.specificItem}>
                  <Text style={styles.specificLabel}>Хэмжээ</Text>
                  <Text style={styles.specificValue}>{product.size}</Text>
                </View>
              )}

              {/* Custom Item Specifics */}
              {product.itemSpecifics && Object.keys(product.itemSpecifics).length > 0 && (
                Object.entries(product.itemSpecifics).map(([key, value]: [string, any]) => (
                  <View key={key} style={styles.specificItem}>
                    <Text style={styles.specificLabel}>{key}</Text>
                    <Text style={styles.specificValue}>{value}</Text>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Bid History */}
          <View style={styles.bidHistorySection}>
            <View style={styles.bidHistoryHeader}>
              <Ionicons name="time-outline" size={18} color={palette.text} />
              <Text style={styles.sectionTitle}>Bid History</Text>
            </View>
            {bidHistory.length > 0 ? (
              bidHistory.slice(0, 20).map((entry) => {
                const bidderName =
                  entry.user?.name || entry.user?.username || entry.user?.email || "Anonymous";
                const created = entry.createdAt
                  ? new Date(entry.createdAt).toLocaleString("mn-MN")
                  : "";

                return (
                  <View key={entry._id} style={styles.bidHistoryItem}>
                    <View style={styles.bidHistoryRow}>
                      <Text style={styles.bidHistoryName}>{bidderName}</Text>
                      <Text style={styles.bidHistoryPrice}>
                        {formatPrice(entry.price || entry.amount || 0)}
                      </Text>
                    </View>
                    {created ? (
                      <Text style={styles.bidHistoryTime}>{created}</Text>
                    ) : null}
                  </View>
                );
              })
            ) : null}
          </View>

          {/* Product Statistics */}
          <View style={styles.productStatsContainer}>
            {/* Statistics Row */}
            <View style={styles.productStatsRow}>
              <View style={styles.productStatItem}>
                <Ionicons name="eye" size={24} color={palette.brand600} />
                <Text style={styles.productStatValue}>
                  {product.views || 0}
                </Text>
                <Text style={styles.productStatLabel}>
                  ҮЗСЭН
                </Text>
              </View>

              <View style={styles.productStatDivider} />

              <View style={styles.productStatItem}>
                <Ionicons name="people" size={24} color={palette.brand600} />
                <Text style={styles.productStatValue}>
                  {product.bidStats?.totalBidders || 0}
                </Text>
                <Text style={styles.productStatLabel}>
                  САНАЛ ӨГСӨН
                </Text>
              </View>

              <View style={styles.productStatDivider} />

              <View style={styles.productStatItem}>
                <Ionicons name="hammer" size={24} color={palette.brand600} />
                <Text style={styles.productStatValue}>
                  {product.bidStats?.totalBids || bidHistory.length || 0}
                </Text>
                <Text style={styles.productStatLabel}>
                  НИЙТ САНАЛ
                </Text>
              </View>
            </View>

            {/* No Bids Message */}
            {bidHistory.length === 0 && (
              <View style={styles.productNoBidsMessage}>
                <Ionicons name="information-circle-outline" size={18} color={palette.textSecondary} />
                <Text style={styles.productNoBidsText}>
                  одоогоор санал ороогүй байна
                </Text>
              </View>
            )}
          </View>

          {/* Seller Description*/}
          {product.sellerDescription && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="document-text" size={20} color={palette.text} /> Борлуулагчийн тайлбар
              </Text>
              <RenderHtml
                contentWidth={width - 64}
                source={{ html: product.sellerDescription }}
                tagsStyles={{
                  body: { color: palette.textSecondary, fontSize: 15, lineHeight: 26 },
                  p: { marginBottom: 12 },
                  h1: { color: palette.text, fontSize: 22, fontWeight: "700", marginTop: 20, marginBottom: 10 },
                  h2: { color: palette.text, fontSize: 20, fontWeight: "700", marginTop: 16, marginBottom: 8 },
                  h3: { color: palette.text, fontSize: 18, fontWeight: "600", marginTop: 14, marginBottom: 6 },
                  a: { color: palette.brand600, textDecorationLine: "underline" },
                  strong: { fontWeight: "700", color: palette.text },
                  em: { fontStyle: "italic", color: palette.textSecondary },
                  ul: { marginVertical: 10 },
                  ol: { marginVertical: 10 },
                  li: { marginVertical: 4 },
                }}
              />
            </View>
          )}

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.sectionTitle}>Төстэй бүтээгдэхүүнүүд</Text>
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

      {/* Bid/Buy Action Bar - Only show if not owner and auction not ended */}
      {!isOwner && !isAuctionEnded && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={styles.actionBar}>
          {isAuction ? (
            depositInfo?.depositRequired && !depositInfo?.hasDeposit ? (
              <>
                {/* Deposit gate: user must place deposit before bidding */}
                <View style={styles.depositActionInfo}>
                  <Ionicons name="lock-closed" size={18} color="#f59e0b" />
                  <Text style={styles.depositActionText}>
                    Санал өгөхийн тулд ₮{depositInfo.depositAmount.toLocaleString()} дэнчин байршуулна уу
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.depositButton, placingDeposit && styles.bidButtonDisabled]}
                  onPress={handlePlaceDeposit}
                  disabled={placingDeposit}
                >
                  {placingDeposit ? (
                    <ActivityIndicator color={palette.white} />
                  ) : (
                    <>
                      <Ionicons name="lock-open-outline" size={20} color={palette.white} />
                      <Text style={styles.bidButtonText}>Дэнчин</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Auction: Quick increment chips + bid input */}
                {(() => {
                  const base = product.currentBid || product.price || 0;
                  const inc = Math.max(product.minIncrement || 5000, 5000);
                  const presets = [inc, inc * 2, inc * 5, inc * 10];
                  return (
                    <View style={styles.quickChipsRow}>
                      {presets.map((delta) => (
                        <TouchableOpacity
                          key={delta}
                          style={[styles.quickChip, { borderColor: palette.brand600, backgroundColor: isDark ? palette.brand600 + '22' : '#eef2ff' }]}
                          onPress={() => {
                            setBidAmount(String(base + delta));
                            Haptics.selectionAsync();
                          }}
                        >
                          <Text style={[styles.quickChipText, { color: palette.brand600 }]}>
                            +{formatPrice(delta)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })()}
                <View style={styles.bidInputContainer}>
                  <Text style={styles.bidInputLabel}>Таны санал (₮)</Text>
                  <TextInput
                    style={styles.bidInput}
                    value={bidAmount}
                    onChangeText={setBidAmount}
                    keyboardType="numeric"
                    placeholder="Үнийн дүн оруулах"
                    placeholderTextColor={palette.textSecondary}
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.bidButton, submitting && styles.bidButtonDisabled]}
                  onPress={handlePlaceBid}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={palette.white} />
                  ) : (
                    <>
                      <Ionicons name="hammer" size={20} color={palette.white} />
                      <Text style={styles.bidButtonText}>Санал өгөх</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )
          ) : (
            <>
              {/* Fixed Price: Show buy button */}
              <View style={styles.priceDisplayContainer}>
                <Text style={styles.priceDisplayLabel}>Үнэ:</Text>
                <Text style={styles.priceDisplayValue}>{formatPrice(product.price)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.buyButton, submitting && styles.buyButtonDisabled]}
                onPress={handleBuyNow}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={palette.white} />
                ) : (
                  <>
                    <Ionicons name="cart" size={20} color={palette.white} />
                    <Text style={styles.buyButtonText}>Худалдаж авах</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
        </KeyboardAvoidingView>
      )}

      {/* Owner-Only: Bidders List and Winner Selection */}
      {isOwner && bidHistory.length > 0 && (
        <View style={[styles.ownerBiddersContainer, { backgroundColor: palette.surface, borderTopColor: palette.border }]}>
          <View style={styles.biddersSection}>
            <Text style={[styles.biddersSectionTitle, { color: palette.text }]}>
              Санал өгсөн хүмүүс:
            </Text>
            <ScrollView
              style={styles.biddersList}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
            >
              {bidHistory.map((bid: any, index: number) => {
                const bidderName = bid.user?.name || bid.user?.username || bid.user?.email || 'Хэрэглэгч';
                const bidderContact = bid.user?.phone || bid.user?.email || '';

                return (
                  <View
                    key={bid._id}
                    style={[
                      styles.bidderItem,
                      {
                        backgroundColor: index === 0 ? palette.brand50 : palette.background,
                        borderColor: palette.border
                      }
                    ]}
                  >
                    <View style={styles.bidderRank}>
                      {index === 0 ? (
                        <Ionicons name="trophy" size={20} color={palette.warning600 || "#f59e0b"} />
                      ) : (
                        <Text style={[styles.bidderRankText, { color: palette.textSecondary }]}>
                          #{index + 1}
                        </Text>
                      )}
                    </View>

                    <View style={styles.bidderInfo}>
                      <Text style={[styles.bidderName, { color: palette.text }]}>
                        {bidderName}
                      </Text>
                      <Text style={[styles.bidderContact, { color: palette.textSecondary }]}>
                        {bidderContact}
                      </Text>
                    </View>

                    <View style={styles.bidderPrice}>
                      <Text style={[styles.bidPrice, { color: palette.brand600 }]}>
                        {formatPrice(bid.price || bid.amount || 0)}
                      </Text>
                      <Text style={[styles.bidTime, { color: palette.textSecondary }]}>
                        {bid.createdAt ? new Date(bid.createdAt).toLocaleDateString('mn-MN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Winner Selection (if auction ended) */}
            {isAuctionEnded && bidHistory.length > 0 && (
              <TouchableOpacity
                style={[styles.selectWinnerButton, { backgroundColor: palette.success600 || palette.brand600 }]}
                onPress={() => {
                  const topBidder = bidHistory[0];
                  const bidderName = topBidder.user?.name || topBidder.user?.username || 'Хэрэглэгч';
                  Alert.alert(
                    "Худалдан авагчийг сонгох",
                    `${bidderName} (${formatPrice(topBidder.price || topBidder.amount || 0)}) -д зарах уу?`,
                    [
                      { text: "Цуцлах", style: "cancel" },
                      {
                        text: "Батлах",
                        onPress: () => Alert.alert("Амжилттай", "Худалдаж авагч сонгогдлоо. Админ баталгаажуулна.")
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color={palette.white} />
                <Text style={styles.selectWinnerText}>
                  Худалдан авагчийг сонгох
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Success Celebration Confetti */}
      {showConfetti && <SuccessConfetti onComplete={() => setShowConfetti(false)} />}
    </SafeAreaView>
    
  );
}

const getStyles = (palette: typeof theme, isDark: boolean) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: palette.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: palette.textSecondary,
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    color: palette.textSecondary,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: palette.brand600,
    borderRadius: 8,
  },
  backButtonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
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
    color: palette.text,
  },
  imageGallery: {
    width: width,
    height: 300,
    backgroundColor: palette.sectionBg,
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
    color: palette.white,
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
    backgroundColor: palette.brand600,
  },
  endedBadge: {
    backgroundColor: palette.gray500,
  },
  statusBadgeText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: "700",
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: palette.surface,
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
    borderColor: palette.brand600,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  infoSection: {
    backgroundColor: palette.surface,
    padding: 16,
    marginTop: 8,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: palette.text,
    marginBottom: 16,
  },
  timerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: isDark ? palette.sectionBg : palette.brand50,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.textSecondary,
  },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.border,
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: palette.secondary500 || palette.brand600,
  },
  bidsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bidsCount: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.textSecondary,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: palette.textSecondary,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  detailLabel: {
    fontSize: 15,
    color: palette.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: palette.text,
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
    borderBottomColor: palette.border,
  },
  bidHistoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bidHistoryUser: {
    fontSize: 15,
    color: palette.textSecondary,
    fontWeight: "500",
  },
  bidHistoryAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.brand600,
  },
  similarSection: {
    marginBottom: 24,
  },
  similarCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: palette.card,
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
    color: palette.text,
    padding: 8,
    paddingBottom: 4,
  },
  similarPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.brand600,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  quickChipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  bidInputContainer: {
    flex: 1,
  },
  bidInputLabel: {
    fontSize: 11,
    color: palette.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  bidInput: {
    height: 48,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "600",
    color: palette.text,
    backgroundColor: palette.inputBg,
  },
  bidButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: palette.brand600,
    borderRadius: 12,
    minWidth: 120,
  },
  bidButtonDisabled: {
    opacity: 0.6,
  },
  bidButtonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "700",
  },
  // Fixed price buy button styles
  priceDisplayContainer: {
    flex: 1,
  },
  priceDisplayLabel: {
    fontSize: 11,
    color: palette.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  priceDisplayValue: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.brand600,
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: palette.success600 || palette.brand600,
    borderRadius: 12,
    minWidth: 140,
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  buyButtonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "700",
  },
  // Owner message styles
  ownerMessageContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 8,
  },
  ownerMessageText: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Owner bidders list styles
  ownerBiddersContainer: {
    borderTopWidth: 1,
    paddingTop: 16,
    paddingBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  biddersSection: {
    paddingHorizontal: 16,
  },
  biddersSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  biddersList: {
    maxHeight: 300,
  },
  bidderItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  bidderRank: {
    width: 32,
    alignItems: "center",
    marginRight: 12,
  },
  bidderRankText: {
    fontSize: 14,
    fontWeight: "600",
  },
  bidderInfo: {
    flex: 1,
  },
  bidderName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  bidderContact: {
    fontSize: 12,
  },
  bidderPrice: {
    alignItems: "flex-end",
  },
  bidPrice: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  bidTime: {
    fontSize: 11,
  },
  selectWinnerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  selectWinnerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  noBidsContainer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  noBidsText: {
    fontSize: 14,
  },
  bidHistorySection: {
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 4,
    gap: 10,
  },
  bidHistoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bidHistoryItem: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  bidHistoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bidHistoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.text,
  },
  bidHistoryPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.brand600,
  },
  bidHistoryTime: {
    fontSize: 12,
    color: palette.textSecondary,
    marginTop: 2,
  },
  bidHistoryEmpty: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  // Product Statistics Styles
  productStatsContainer: {
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  productStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  productStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  productStatValue: {
    fontSize: 24,
    fontWeight: "700",
    color: palette.text,
    marginTop: 4,
  },
  productStatLabel: {
    fontSize: 11,
    color: palette.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  productStatDivider: {
    width: 1,
    height: 50,
    backgroundColor: palette.border,
  },
  productNoBidsMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: isDark ? palette.sectionBg : palette.brand50,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  productNoBidsText: {
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: "500",
  },
  // New styles for enhanced sections
  sectionCard: {
    backgroundColor: palette.card,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  // Vehicle History Report
  vehicleReportAvailable: {
    marginTop: 12,
  },
  vehicleReportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  vehicleReportTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.text,
  },
  vehicleReportProvider: {
    fontSize: 14,
    color: palette.textSecondary,
    marginTop: 4,
  },
  vehicleReportButton: {
    backgroundColor: palette.brand600,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  vehicleReportButtonText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: "600",
  },
  vehicleReportUnavailable: {
    backgroundColor: palette.sectionBg,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  vehicleReportUnavailableText: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.text,
    marginBottom: 6,
  },
  vehicleReportReason: {
    fontSize: 13,
    color: palette.textSecondary,
  },
  // Item Specifics Grid
  specificsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    marginHorizontal: -6,
  },
  specificItem: {
    width: "48%",
    backgroundColor: palette.sectionBg,
    padding: 12,
    borderRadius: 8,
    margin: 6,
    borderWidth: 1,
    borderColor: palette.border,
  },
  specificLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  specificValue: {
    fontSize: 15,
    fontWeight: "600",
    color: palette.text,
  },
  // Deposit banner (shown in product info section)
  depositBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: isDark ? palette.sectionBg : palette.secondary50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.secondary200 || palette.border,
    marginBottom: 16,
  },
  depositBannerActive: {
    backgroundColor: isDark ? "#0d1f12" : palette.success50 || "#f0fdf4",
    borderColor: palette.success200 || "#bbf7d0",
  },
  depositBannerBody: {
    flex: 1,
  },
  depositBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  depositBannerSub: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  depositBannerBtn: {
    backgroundColor: palette.secondary500 || palette.brand600,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  depositBannerBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  // Deposit gate in action bar
  depositActionInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  depositActionText: {
    flex: 1,
    fontSize: 12,
    color: palette.textSecondary,
    lineHeight: 16,
  },
  depositButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: palette.secondary500 || palette.brand600,
    borderRadius: 12,
    minWidth: 100,
  },
});







