// app/(tabs)/sell.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import theme from "../theme";
import { api } from "../../src/api";
// import * as ImagePicker from "expo-image-picker"; // optional

type Photo = { uri: string };

export default function SellScreen() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [duration, setDuration] = useState<string | null>("7 өдөр");
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const canPost = title.trim() && price.trim() && category && photos.length > 0 && duration;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/category/");
      const categoriesData = response.data?.data || response.data || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const addPhoto = async () => {
    // Optional real picker:
    // const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    // if (!res.canceled) setPhotos((p) => [...p, { uri: res.assets[0].uri }]);

    // Fallback (no library): push a dummy image so UI flows
    setPhotos((p) => [
      ...p,
      { uri: "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=800" },
    ]);
  };

  const removePhoto = (idx: number) => {
    setPhotos((p) => p.filter((_, i) => i !== idx));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>Sell your item</Text>

        {/* Photos */}
        <Text style={styles.label}>Photos <Text style={styles.req}>*</Text></Text>
        <View style={styles.photoRow}>
          {photos.map((p, i) => (
            <View key={`${p.uri}-${i}`} style={styles.photoWrap}>
              <Image source={{ uri: p.uri }} style={styles.photo} />
              <TouchableOpacity style={styles.remove} onPress={() => removePhoto(i)}>
                <Ionicons name="close" size={16} color={theme.gray700} />
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 6 && (
            <TouchableOpacity style={styles.addTile} onPress={addPhoto} activeOpacity={0.8}>
              <Ionicons name="add" size={24} color={theme.brand600} />
              <Text style={styles.addTileText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <Text style={styles.label}>Title <Text style={styles.req}>*</Text></Text>
        <View style={styles.inputWrap}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. iPhone 14 Pro 128GB"
            placeholderTextColor={theme.gray500}
            style={styles.input}
          />
        </View>

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <View style={[styles.inputWrap, { height: 120, paddingVertical: 8 }]}>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder="Condition, accessories, defects, etc."
            placeholderTextColor={theme.gray500}
            style={[styles.input, { height: "100%", textAlignVertical: "top" }]}
            multiline
          />
        </View>

        {/* Category / Condition */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <PickerChip
            label="Категори"
            value={category}
            onPress={(next) => setCategory(next)}
            categories={categories}
          />
          <PickerChip
            label="Байдал"
            value={condition}
            onPress={(next) => setCondition(next)}
            options={["Шинэ", "Шинэ шиг", "Сайн", "Хэрэглэгдсэн", "Эд ангиар"]}
          />
        </View>

        {/* Price */}
        <Text style={[styles.label, { marginTop: 14 }]}>
          Price <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.inputWrap}>
          <View style={styles.priceLeft}>
            <Text style={styles.priceCurrency}>₮</Text>
          </View>
          <TextInput
            value={price}
            onChangeText={(t) => setPrice(t.replace(/[^\d.]/g, ""))}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={theme.gray500}
            style={[styles.input, { paddingLeft: 0 }]}
          />
        </View>

        {/* Duration */}
        <PickerChip
          label="Хугацаа"
          value={duration}
          onPress={(next) => setDuration(next)}
          options={["3 өдөр", "7 өдөр", "14 өдөр", "30 өдөр"]}
        />

        {/* Post button (disabled until required fields) */}
        <TouchableOpacity
          disabled={!canPost || submitting}
          style={[styles.postBtn, (!canPost || submitting) && { opacity: 0.5 }]}
          onPress={async () => {
            setSubmitting(true);
            try {
              // Calculate bid deadline based on duration
              const days = parseInt(duration?.split(' ')[0] || "7");
              const deadline = new Date();
              deadline.setDate(deadline.getDate() + days);

              // Prepare form data
              const formData = new FormData();
              formData.append('title', title.trim());
              formData.append('description', desc.trim() || title.trim());
              formData.append('price', price);
              formData.append('category', category || '');
              formData.append('bidDeadline', deadline.toISOString());
              formData.append('bidThreshold', '1000'); // Default threshold

              // Add images (currently dummy URLs, would need real file upload)
              // For now, we'll send without images since we're using dummy URLs
              // photos.forEach((photo, index) => {
              //   formData.append('images', {
              //     uri: photo.uri,
              //     type: 'image/jpeg',
              //     name: `product-${index}.jpg`,
              //   } as any);
              // });

              const response = await api.post('/api/product/', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              });

              if (response.status === 201 || response.status === 200) {
                Alert.alert('Амжилттай', 'Таны зар амжилттай нэмэгдлээ', [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Clear form
                      setTitle("");
                      setDesc("");
                      setCategory(null);
                      setCondition(null);
                      setPrice("");
                      setPhotos([]);
                      setDuration("7 өдөр");
                      // Navigate to my listings
                      router.push("/(tabs)/selling");
                    },
                  },
                ]);
              }
            } catch (error: any) {
              console.error('Error posting product:', error);
              Alert.alert(
                'Алдаа',
                error.response?.data?.error || 'Зар нэмэхэд алдаа гарлаа. Дахин оролдоно уу.'
              );
            } finally {
              setSubmitting(false);
            }
          }}
          activeOpacity={0.9}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={styles.postBtnText}>Зар нэмэх</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Small picker chip (inline) - Hierarchical for categories ---------- */
function PickerChip({
  label,
  value,
  onPress,
  options,
  categories,
}: {
  label: string;
  value: string | null;
  onPress: (next: string) => void;
  options?: string[];
  categories?: any[];
}) {
  const [open, setOpen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<any[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // For simple options (not categories)
  const list = options || [];

  // Initialize categories when opened
  useEffect(() => {
    if (open && categories && categories.length > 0) {
      const parents = categories.filter(cat => !cat.parent);
      setCurrentLevel(parents);
    }
  }, [open, categories]);

  const handleCategoryClick = async (category: any) => {
    setLoading(true);
    try {
      // Check if this category has children
      const response = await api.get(`/api/category/`);
      const allCategories = response.data?.data || response.data || [];
      const children = allCategories.filter((cat: any) => cat.parent === category._id);

      if (children.length > 0) {
        // Has children - navigate deeper
        setCurrentLevel(children);
        setBreadcrumb([...breadcrumb, category]);
      } else {
        // Leaf category - select it
        onPress(category.titleMn || category.title);
        setOpen(false);
        setCurrentLevel(categories?.filter(cat => !cat.parent) || []);
        setBreadcrumb([]);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBreadcrumbClick = async (index: number) => {
    if (index === -1) {
      // Back to root
      const parents = categories?.filter(cat => !cat.parent) || [];
      setCurrentLevel(parents);
      setBreadcrumb([]);
    } else {
      // Navigate to specific breadcrumb level
      const targetCategory = breadcrumb[index];
      setLoading(true);
      try {
        const response = await api.get(`/api/category/`);
        const allCategories = response.data?.data || response.data || [];
        const children = allCategories.filter((cat: any) => cat.parent === targetCategory._id);

        setCurrentLevel(children);
        setBreadcrumb(breadcrumb.slice(0, index + 1));
      } catch (error) {
        console.error("Error navigating breadcrumb:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label} {label === "Категори" && <Text style={styles.req}>*</Text>}</Text>
      <TouchableOpacity
        style={[
          styles.chip,
          value ? { backgroundColor: theme.brand100, borderColor: theme.brand600 } : null,
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.chipText, value ? { color: theme.brand700 } : null]}>
          {value || `Сонгох`}
        </Text>
        <Ionicons name="chevron-down" size={16} color={value ? theme.brand700 : theme.gray500} />
      </TouchableOpacity>

      {/* Hierarchical sheet for categories or simple list for options */}
      {open && (
        <View style={styles.sheetLike}>
          {categories ? (
            <>
              {/* Breadcrumb Navigation */}
              {breadcrumb.length > 0 && (
                <View style={styles.breadcrumbContainerSheet}>
                  <TouchableOpacity
                    onPress={() => handleBreadcrumbClick(-1)}
                    style={styles.breadcrumbItemSheet}
                  >
                    <Ionicons name="home-outline" size={12} color={theme.brand600} />
                    <Text style={styles.breadcrumbTextSheet}>Бүгд</Text>
                  </TouchableOpacity>
                  {breadcrumb.map((cat, index) => (
                    <View key={cat._id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="chevron-forward" size={10} color="#999" style={{ marginHorizontal: 2 }} />
                      <TouchableOpacity
                        onPress={() => handleBreadcrumbClick(index)}
                        style={styles.breadcrumbItemSheet}
                      >
                        <Text style={[
                          styles.breadcrumbTextSheet,
                          index === breadcrumb.length - 1 && { fontWeight: "700" }
                        ]}>
                          {cat.titleMn || cat.title}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Category List */}
              {loading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={theme.brand600} />
                </View>
              ) : (
                <>
                  {currentLevel.map((cat) => (
                    <TouchableOpacity
                      key={cat._id}
                      style={styles.sheetRow}
                      onPress={() => handleCategoryClick(cat)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name={cat.icon || "cube-outline"} size={16} color={theme.brand600} />
                        <Text style={styles.sheetRowText}>{cat.titleMn || cat.title}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color="#aaa" />
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </>
          ) : (
            // Simple list for non-category options
            <>
              {list.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.sheetRow}
                  onPress={() => { onPress(opt); setOpen(false); }}
                >
                  <Text style={styles.sheetRowText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
          <TouchableOpacity style={styles.sheetCancel} onPress={() => {
            setOpen(false);
            setCurrentLevel(categories?.filter(cat => !cat.parent) || []);
            setBreadcrumb([]);
          }}>
            <Text style={styles.sheetCancelText}>Хаах</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, backgroundColor: "#FFFFFF" },
  screenTitle: { color: theme.gray900, fontSize: 22, fontWeight: "900", marginBottom: 12 },

  label: { color: theme.gray700, fontSize: 13, fontWeight: "800", marginBottom: 6, textTransform: "uppercase" },
  req: { color: theme.brand500 },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.gray100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.gray200,
    paddingHorizontal: 12,
  },
  input: { flex: 1, color: theme.gray900, paddingVertical: Platform.OS === "android" ? 8 : 10, fontSize: 15 },

  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  photoWrap: { width: 90, height: 90, borderRadius: 12, overflow: "hidden" },
  photo: { width: "100%", height: "100%" },
  remove: {
    position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)",
  },
  addTile: {
    width: 90, height: 90, borderRadius: 12, borderWidth: 1,
    borderColor: theme.gray200, backgroundColor: theme.gray100,
    alignItems: "center", justifyContent: "center",
  },
  addTileText: { color: theme.brand600, fontWeight: "800", marginTop: 2 },

  chip: {
    height: 44,
    backgroundColor: theme.gray100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.gray200,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chipText: { color: theme.gray900, fontWeight: "600" },

  priceLeft: { paddingRight: 8, justifyContent: "center" },
  priceCurrency: { color: theme.brand600, fontSize: 16, fontWeight: "900" },

  postBtn: {
    marginTop: 18,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.brand600,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  postBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  sheetLike: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    maxHeight: 300,
  },
  sheetRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetRowText: { color: "#111", fontWeight: "600" },
  sheetCancel: { padding: 12, alignItems: "center" },
  sheetCancelText: { color: theme.brand600, fontWeight: "800" },
  breadcrumbContainerSheet: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: theme.gray100,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  breadcrumbItemSheet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  breadcrumbTextSheet: {
    fontSize: 11,
    color: theme.brand600,
    fontWeight: "500",
  },
});