import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import theme from '../theme';
import { api } from '../../src/api';
import { AICategorySuggester } from '../components/AICategorySuggester';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAutosaveMobile, getDraft, deleteDraft } from '../../src/hooks/useAutosaveMobile';
import { DraftStatusBanner } from '../components/DraftStatusBanner';

const MAX_IMAGE_UPLOADS = 20;

interface FormData {
  title: string;
  description: string;
  startingBid: string;
  category: string;
  // Auction settings
  startMode: 'immediate' | 'scheduled';
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  // Automotive fields
  manufacturer: string;
  model: string;
  year: string;
  mileage: string;
  engineSize: string;
  fuelType: string;
  transmission: string;
  color: string;
  condition: string;
}

export default function AddProductScreen() {
  const { isDarkMode, themeColors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [parentCategory, setParentCategory] = useState('');
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    startingBid: '',
    category: '',
    startMode: 'immediate',
    scheduledDate: '',
    scheduledTime: '',
    duration: '7',
    manufacturer: '',
    model: '',
    year: '',
    mileage: '',
    engineSize: '',
    fuelType: '',
    transmission: '',
    color: '',
    condition: '',
  });

  // Draft auto-save
  const draftKey = 'addProduct';
  const savingStatus = useAutosaveMobile(draftKey, formData, 2000);
  const [lastSaved, setLastSaved] = useState<number | undefined>();

  // Load draft on component mount
  useEffect(() => {
    const loadDraft = async () => {
      const draft = await getDraft(draftKey);
      if (draft && (draft.title || draft.description)) {
        Alert.alert(
          'Draft Found',
          `Found a saved draft. Would you like to restore it?`,
          [
            {
              text: 'Discard',
              style: 'cancel',
              onPress: () => deleteDraft(draftKey),
            },
            {
              text: 'Restore',
              onPress: () => {
                setFormData({ ...formData, ...draft });
                Alert.alert('Success', 'Draft restored successfully!');
              },
            },
          ]
        );
      }
    };
    loadDraft();
  }, []);

  // Track last saved time
  useEffect(() => {
    if (savingStatus === 'saved') {
      setLastSaved(Date.now());
    }
  }, [savingStatus]);

  useEffect(() => {
    fetchCategories();
    requestImagePermissions();
  }, []);

  const requestImagePermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Зөвшөрөл шаардлагатай', 'Зураг оруулахын тулд зөвшөрөл өгнө үү');
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/category/');
      const categoriesData = response.data?.data || response.data || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Алдаа', 'Категори татахад алдаа гарлаа');
    }
  };

  const handleParentCategoryChange = (parentId: string) => {
    setParentCategory(parentId);
    setFormData({ ...formData, category: '' });

    if (parentId) {
      const subs = categories.filter((cat) => {
        const catParent = cat.parent?._id || cat.parent;
        return catParent === parentId;
      });
      setSubcategories(subs);
    } else {
      setSubcategories([]);
    }
  };

  const isAutomotiveCategory = () => {
    if (!formData.category || !categories.length) return false;
    const selectedCat = categories.find((c) => c._id === formData.category);
    if (!selectedCat) return false;
    const titleMn = (selectedCat?.titleMn || '').toLowerCase();
    const titleEn = (selectedCat?.title || '').toLowerCase();
    return (
      titleMn.includes('автомашин') ||
      titleMn.includes('машин') ||
      titleMn.includes('авто') ||
      titleMn.includes('тээврийн хэрэгсэл') ||
      titleEn.includes('car') ||
      titleEn.includes('vehicle') ||
      titleEn.includes('auto')
    );
  };

  // Auto-generate title for automotive products
  useEffect(() => {
    if (isAutomotiveCategory() && formData.year && formData.manufacturer && formData.model) {
      const autoTitle = `${formData.year} ${formData.manufacturer} ${formData.model}`;
      if (formData.title !== autoTitle) {
        setFormData((prev) => ({ ...prev, title: autoTitle }));
      }
    }
  }, [formData.year, formData.manufacturer, formData.model, formData.category]);

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: MAX_IMAGE_UPLOADS - images.length,
      });

      if (!result.canceled && result.assets) {
        const remainingSlots = MAX_IMAGE_UPLOADS - images.length;
        const newImages = result.assets.slice(0, remainingSlots);
        setImages([...images, ...newImages]);

        if (result.assets.length > remainingSlots) {
          Alert.alert('Анхааруулга', `Та хамгийн ихдээ ${MAX_IMAGE_UPLOADS} зураг оруулах боломжтой.`);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Алдаа', 'Зураг сонгоход алдаа гарлаа');
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleAICategorySelect = (suggestedCategoryName: string) => {
    const searchName = suggestedCategoryName.toLowerCase().trim();

    // Find best matching category
    const matchedCategory = categories.find((cat) => {
      const titleEn = (cat.title || '').toLowerCase().trim();
      const titleMn = (cat.titleMn || '').toLowerCase().trim();
      return titleEn === searchName || titleMn === searchName || titleEn.includes(searchName) || titleMn.includes(searchName);
    });

    if (matchedCategory) {
      if (matchedCategory.parent) {
        // It's a subcategory
        const parentId = matchedCategory.parent?._id || matchedCategory.parent;
        setParentCategory(parentId);

        const subs = categories.filter((cat) => {
          const catParent = cat.parent?._id || cat.parent;
          return catParent === parentId;
        });
        setSubcategories(subs);
        setFormData({ ...formData, category: matchedCategory._id });
        Alert.alert('Амжилттай', `Категори: ${matchedCategory.title || matchedCategory.titleMn}`);
      } else {
        // It's a parent category
        setParentCategory(matchedCategory._id);
        const subs = categories.filter((cat) => {
          const catParent = cat.parent?._id || cat.parent;
          return catParent === matchedCategory._id;
        });
        setSubcategories(subs);
        setFormData({ ...formData, category: '' });
        Alert.alert('Мэдэгдэл', `Үндсэн категори сонгогдлоо. Дэд категори сонгоно уу.`);
      }
    } else {
      Alert.alert('Анхааруулга', `"${suggestedCategoryName}" категори олдсонгүй. Гараар сонгоно уу.`);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Алдаа', 'Бүтээгдэхүүний нэр оруулна уу');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Алдаа', 'Тайлбар оруулна уу');
      return false;
    }
    if (!formData.category) {
      Alert.alert('Алдаа', 'Категори сонгоно уу');
      return false;
    }
    if (!formData.startingBid || parseFloat(formData.startingBid) <= 0) {
      Alert.alert('Алдаа', 'Эхлэх үнэ оруулна уу');
      return false;
    }
    if (!formData.duration) {
      Alert.alert('Алдаа', 'Дуудлага худалдааны хугацаа сонгоно уу');
      return false;
    }
    if (formData.startMode === 'scheduled') {
      if (!formData.scheduledDate || !formData.scheduledTime) {
        Alert.alert('Алдаа', 'Эхлэх огноо, цагийг оруулна уу');
        return false;
      }
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        Alert.alert('Алдаа', 'Эхлэх хугацаа ирээдүй байх ёстой');
        return false;
      }
    }
    if (images.length === 0) {
      Alert.alert('Алдаа', 'Дор хаяж 1 зураг оруулна уу');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setUploading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Алдаа', 'Нэвтрэх шаардлагатай');
        router.push('/(hidden)/login');
        return;
      }

      const formDataToSend = new FormData();

      // Add core fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('sellType', 'auction');
      formDataToSend.append('price', formData.startingBid);

      // Auction settings
      formDataToSend.append('startMode', formData.startMode);
      formDataToSend.append('auctionDuration', formData.duration);

      if (formData.startMode === 'scheduled') {
        formDataToSend.append('scheduledDate', formData.scheduledDate);
        formDataToSend.append('scheduledTime', formData.scheduledTime);
      }

      // Automotive fields (if applicable)
      if (isAutomotiveCategory()) {
        if (formData.manufacturer) formDataToSend.append('manufacturer', formData.manufacturer);
        if (formData.model) formDataToSend.append('model', formData.model);
        if (formData.year) formDataToSend.append('year', formData.year);
        if (formData.mileage) formDataToSend.append('mileage', formData.mileage);
        if (formData.engineSize) formDataToSend.append('engineSize', formData.engineSize);
        if (formData.fuelType) formDataToSend.append('fuelType', formData.fuelType);
        if (formData.transmission) formDataToSend.append('transmission', formData.transmission);
        if (formData.color) formDataToSend.append('color', formData.color);
        if (formData.condition) formDataToSend.append('condition', formData.condition);
      }

      // Add images
      for (const image of images) {
        const uriParts = image.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formDataToSend.append('images', {
          uri: image.uri,
          name: `photo.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      const response = await api.post('/api/product/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      // Clear draft on success
      await deleteDraft(draftKey);

      Alert.alert('Амжилттай', 'Бүтээгдэхүүн амжилттай нэмэгдлээ', [
        {
          text: 'ОК',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Submit error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Бүтээгдэхүүн нэмэхэд алдаа гарлаа';
      Alert.alert('Алдаа', errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const parentCategories = categories.filter((c) => !c.parent);
  const showAutomotiveFields = isAutomotiveCategory();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      {/* Draft Status Banner */}
      <DraftStatusBanner status={savingStatus} lastSaved={lastSaved} />

      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: themeColors.surface,
        borderBottomColor: themeColors.border
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          Бүтээгдэхүүн нэмэх
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 60 }}
        >
        {/* Parent Category */}
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Үндсэн категори *
        </Text>
        <View style={[styles.pickerContainer, { 
          backgroundColor: themeColors.inputBg,
          borderColor: themeColors.border 
        }]}>
          <Ionicons name="grid-outline" size={20} color={themeColors.textSecondary} style={styles.pickerIcon} />
          <Picker
            style={styles.picker}
            selectedValue={parentCategory}
            onValueChange={(value) => handleParentCategoryChange(value)}
          >
            <Picker.Item label="Үндсэн категори сонгох" value="" />
            {parentCategories.map((cat) => (
              <Picker.Item
                key={cat._id}
                label={`${cat.icon || ''} ${cat.titleMn || cat.title}`}
                value={cat._id}
              />
            ))}
          </Picker>
        </View>

        {/* Subcategory */}
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Дэд категори *
        </Text>
        <View style={[styles.pickerContainer, !parentCategory && styles.pickerDisabled, { 
          backgroundColor: themeColors.inputBg,
          borderColor: themeColors.border 
        }]}>
          <Ionicons name="list-outline" size={20} color={themeColors.textSecondary} style={styles.pickerIcon} />
          <Picker
            style={[styles.picker, { color: themeColors.text }]}
            selectedValue={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as string })}
            enabled={!!parentCategory && subcategories.length > 0}
          >
            <Picker.Item label="Дэд категори сонгох" value="" />
            {subcategories.map((cat) => (
              <Picker.Item
                key={cat._id}
                label={cat.titleMn || cat.title}
                value={cat._id}
              />
            ))}
          </Picker>
        </View>

        {/* AI Category Suggester */}
        <AICategorySuggester
          title={formData.title}
          description={formData.description}
          currentCategory={formData.category}
          onCategorySelect={handleAICategorySelect}
        />

        {/* Title */}
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Бүтээгдэхүүний нэр * {showAutomotiveFields && formData.year && formData.manufacturer && formData.model && '(Автоматаар үүссэн)'}
        </Text>
        <TextInput
          style={[styles.input, showAutomotiveFields && formData.year && formData.manufacturer && formData.model && styles.inputDisabled, {
            backgroundColor: themeColors.inputBg,
            borderColor: themeColors.border,
            color: themeColors.text
          }]}
          placeholder={showAutomotiveFields ? '2020 Toyota Camry' : 'iPhone 13 Pro 128GB'}
          placeholderTextColor={themeColors.textSecondary}
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
          editable={!(showAutomotiveFields && formData.year && formData.manufacturer && formData.model)}
        />

        {/* Automotive Fields */}
        {showAutomotiveFields && (
          <>
            <Text style={[styles.sectionSubtitle, { color: theme.success700 }]}>
              🚗 Автомашины мэдээлэл
            </Text>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Үйлдвэрлэгч *</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }]}
                  placeholder="Toyota"
                  placeholderTextColor={themeColors.textSecondary}
                  value={formData.manufacturer}
                  onChangeText={(text) => setFormData({ ...formData, manufacturer: text })}
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Загвар *</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }]}
                  placeholder="Camry"
                  placeholderTextColor={themeColors.textSecondary}
                  value={formData.model}
                  onChangeText={(text) => setFormData({ ...formData, model: text })}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Он жил *</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }]}
                  placeholder="2020"
                  placeholderTextColor={themeColors.textSecondary}
                  value={formData.year}
                  onChangeText={(text) => setFormData({ ...formData, year: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Гүйлт (км)</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }]}
                  placeholder="50000"
                  placeholderTextColor={themeColors.textSecondary}
                  value={formData.mileage}
                  onChangeText={(text) => setFormData({ ...formData, mileage: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Хөдөлгүүр</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }]}
                  placeholder="2.0L"
                  placeholderTextColor={themeColors.textSecondary}
                  value={formData.engineSize}
                  onChangeText={(text) => setFormData({ ...formData, engineSize: text })}
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Түлш</Text>
                <View style={[styles.pickerContainer, { 
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.border 
                }]}>
                  <Picker
                    style={[styles.picker, { color: themeColors.text }]}
                    selectedValue={formData.fuelType}
                    onValueChange={(value) => setFormData({ ...formData, fuelType: value as string })}
                  >
                    <Picker.Item label="Сонгох" value="" />
                    <Picker.Item label="Бензин" value="Бензин" />
                    <Picker.Item label="Дизель" value="Дизель" />
                    <Picker.Item label="Цахилгаан" value="Цахилгаан" />
                    <Picker.Item label="Гибрид" value="Гибрид" />
                    <Picker.Item label="Хий" value="Хий" />
                  </Picker>
                </View>
              </View>
            </View>

            <Text style={[styles.label, { color: themeColors.textSecondary }]}>Хурдны хайрцаг</Text>
            <View style={[styles.pickerContainer, { 
              backgroundColor: themeColors.inputBg,
              borderColor: themeColors.border 
            }]}>
              <Picker
                style={[styles.picker, { color: themeColors.text }]}
                selectedValue={formData.transmission}
                onValueChange={(value) => setFormData({ ...formData, transmission: value as string })}
              >
                <Picker.Item label="Сонгох" value="" />
                <Picker.Item label="Автомат" value="Автомат" />
                <Picker.Item label="Механик" value="Механик" />
                <Picker.Item label="CVT" value="CVT" />
              </Picker>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Өнгө</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }]}
                  placeholder="Цагаан"
                  placeholderTextColor={themeColors.textSecondary}
                  value={formData.color}
                  onChangeText={(text) => setFormData({ ...formData, color: text })}
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Байдал</Text>
                <View style={[styles.pickerContainer, { 
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.border 
                }]}>
                  <Picker
                    style={[styles.picker, { color: themeColors.text }]}
                    selectedValue={formData.condition}
                    onValueChange={(value) => setFormData({ ...formData, condition: value as string })}
                  >
                    <Picker.Item label="Сонгох" value="" />
                    <Picker.Item label="Шинэ" value="Шинэ" />
                    <Picker.Item label="Маш сайн" value="Маш сайн" />
                    <Picker.Item label="Сайн" value="Сайн" />
                    <Picker.Item label="Хэрэглэгдсэн" value="Хэрэглэгдсэн" />
                  </Picker>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Description */}
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Тайлбар *</Text>
        <TextInput
          style={[styles.input, styles.textArea, {
            backgroundColor: themeColors.inputBg,
            borderColor: themeColors.border,
            color: themeColors.text
          }]}
          placeholder="Бүтээгдэхүүний дэлгэрэнгүй тайлбар бичнэ үү..."
          placeholderTextColor={themeColors.textSecondary}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={6}
        />

        {/* Starting Bid */}
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Эхлэх үнэ (₮) *</Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: themeColors.inputBg,
            borderColor: themeColors.border,
            color: themeColors.text
          }]}
          placeholder="100000"
          placeholderTextColor={themeColors.textSecondary}
          value={formData.startingBid}
          onChangeText={(text) => setFormData({ ...formData, startingBid: text.replace(/[^0-9]/g, '') })}
          keyboardType="numeric"
        />

        {/* Auction Start Mode */}
        <Text style={[styles.sectionSubtitle, { color: theme.success700 }]}>
          ⚡ Дуудлага худалдаа эхлэх горим
        </Text>
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeButton, formData.startMode === 'immediate' && styles.modeButtonActive, {
              backgroundColor: formData.startMode === 'immediate' ? theme.success600 : themeColors.surface
            }]}
            onPress={() => setFormData({ ...formData, startMode: 'immediate' })}
          >
            <Ionicons name="flash" size={20} color={formData.startMode === 'immediate' ? theme.white : theme.success600} />
            <Text style={[styles.modeButtonText, formData.startMode === 'immediate' && styles.modeButtonTextActive]}>
              Шууд эхлэх
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, formData.startMode === 'scheduled' && styles.modeButtonActive, {
              backgroundColor: formData.startMode === 'scheduled' ? theme.success600 : themeColors.surface
            }]}
            onPress={() => setFormData({ ...formData, startMode: 'scheduled' })}
          >
            <Ionicons name="calendar" size={20} color={formData.startMode === 'scheduled' ? theme.white : theme.success600} />
            <Text style={[styles.modeButtonText, formData.startMode === 'scheduled' && styles.modeButtonTextActive]}>
              Төлөвлөх
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scheduled Start Fields */}
        {formData.startMode === 'scheduled' && (
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Огноо *</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.border,
                  color: themeColors.text
                }]}
                placeholder="2025-12-31"
                placeholderTextColor={themeColors.textSecondary}
                value={formData.scheduledDate}
                onChangeText={(text) => setFormData({ ...formData, scheduledDate: text })}
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Цаг *</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.border,
                  color: themeColors.text
                }]}
                placeholder="14:00"
                placeholderTextColor={themeColors.textSecondary}
                value={formData.scheduledTime}
                onChangeText={(text) => setFormData({ ...formData, scheduledTime: text })}
              />
            </View>
          </View>
        )}

        {/* Duration */}
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Үргэлжлэх хугацаа (хоног) *
        </Text>
        <View style={[styles.pickerContainer, { 
          backgroundColor: themeColors.inputBg,
          borderColor: themeColors.border 
        }]}>
          <Ionicons name="time-outline" size={20} color={themeColors.textSecondary} style={styles.pickerIcon} />
          <Picker
            style={[styles.picker, { color: themeColors.text }]}
            selectedValue={formData.duration}
            onValueChange={(value) => setFormData({ ...formData, duration: value as string })}
          >
            <Picker.Item label="Хугацаа сонгох" value="" />
            <Picker.Item label="1 хоног" value="1" />
            <Picker.Item label="3 хоног" value="3" />
            <Picker.Item label="5 хоног" value="5" />
            <Picker.Item label="7 хоног" value="7" />
            <Picker.Item label="10 хоног" value="10" />
            <Picker.Item label="14 хоног" value="14" />
          </Picker>
        </View>

        {/* Calculated End Time Display */}
        <View style={[styles.infoCard, { backgroundColor: theme.info100 }]}>
          <Ionicons name="information-circle" size={20} color={theme.info600} />
          <Text style={[styles.infoText, { color: theme.info700 }]}>
            {formData.startMode === 'immediate'
              ? `⚡ Дуудлага худалдаа шууд эхэлж ${formData.duration || '?'} хоногийн дараа дуусна`
              : formData.scheduledDate && formData.scheduledTime
              ? `📅 ${formData.scheduledDate} ${formData.scheduledTime}-д эхэлж${formData.duration ? `, ${formData.duration} хоногийн дараа дуусна` : ''}`
              : 'Огноо, цагаа оруулна уу'}
          </Text>
        </View>

        {/* Images */}
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Зургууд * ({images.length}/{MAX_IMAGE_UPLOADS})
        </Text>
        <TouchableOpacity 
          style={[styles.imagePickerButton, { 
            borderColor: images.length >= MAX_IMAGE_UPLOADS ? themeColors.border : theme.brand600,
            backgroundColor: theme.brand50 
          }]} 
          onPress={pickImages} 
          disabled={images.length >= MAX_IMAGE_UPLOADS}
        >
          <Ionicons name="camera-outline" size={24} color={images.length >= MAX_IMAGE_UPLOADS ? themeColors.textSecondary : theme.brand600} />
          <Text style={[styles.imagePickerText, images.length >= MAX_IMAGE_UPLOADS && styles.imagePickerTextDisabled, {
            color: images.length >= MAX_IMAGE_UPLOADS ? themeColors.textSecondary : theme.brand600
          }]}>
            Зураг нэмэх
          </Text>
        </TouchableOpacity>

        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesPreview}>
            {images.map((image, index) => (
              <View key={index} style={styles.imagePreviewContainer}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={[styles.removeImageButton, { backgroundColor: themeColors.surface }]} 
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color={theme.danger600} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Submit Button */}
        <TouchableOpacity style={[styles.submitButton, uploading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={uploading}>
          {uploading ? (
            <>
              <ActivityIndicator size="small" color={theme.white} />
              <Text style={styles.submitButtonText}>Нэмж байна...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={theme.white} />
              <Text style={styles.submitButtonText}>Бүтээгдэхүүн нэмэх</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 20,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    minHeight: 48,
    marginBottom: 16,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  pickerContainer: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    minHeight: 48,
    marginBottom: 16,
  },
  pickerDisabled: {
    opacity: 0.5,
  },
  pickerIcon: {
    marginRight: 8,
  },
  picker: {
    flex: 1,
    height: 48,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.success600,
  },
  modeButtonActive: {
    backgroundColor: theme.success600,
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.success600,
  },
  modeButtonTextActive: {
    color: theme.white,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  imagePickerTextDisabled: {
    opacity: 0.5,
  },
  imagesPreview: {
    marginTop: 12,
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: theme.gray200,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.success600,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.white,
  },
});
