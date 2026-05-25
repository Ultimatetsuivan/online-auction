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
  ActionSheetIOS,
  Modal,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import theme from '../theme';
import { api } from '../../src/api';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAutosaveMobile, getDraft, deleteDraft } from '../../src/hooks/useAutosaveMobile';
import { DraftStatusBanner } from '../components/DraftStatusBanner';

const MAX_IMAGE_UPLOADS = 20;

interface FormData {
  title: string;
  description: string;
  startingBid: string;
  price: string;
  buyNowPrice: string;
  category: string;
  sellType: 'auction' | 'fixed';
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
  // Phone/Electronics fields
  phoneBrand: string;
  phoneModel: string;
  storage: string;
  ram: string;
  screenSize: string;
  battery: string;
  phoneCondition: string;
}

export default function AddProductScreen() {
  const { isDarkMode, themeColors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [parentCategory, setParentCategory] = useState('');
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Picker modal states
  const [showParentCategoryPicker, setShowParentCategoryPicker] = useState(false);
  const [showSubcategoryPicker, setShowSubcategoryPicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showFuelTypePicker, setShowFuelTypePicker] = useState(false);
  const [showTransmissionPicker, setShowTransmissionPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);

  // Collapsible sections - default to collapsed for cleaner mobile UX
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    basic: true,
    automotive: false,
    phone: false,
    auction: false,
    images: true,
  });

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    startingBid: '',
    price: '',
    buyNowPrice: '',
    category: '',
    sellType: 'auction',
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
    phoneBrand: '',
    phoneModel: '',
    storage: '',
    ram: '',
    screenSize: '',
    battery: '',
    phoneCondition: '',
  });

  // Form validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Validation functions
  const validateField = (fieldName: keyof FormData, value: any): string => {
    switch (fieldName) {
      case 'title':
        if (!value || !value.trim()) return 'Бүтээгдэхүүний нэр шаардлагатай';
        if (value.trim().length < 3) return 'Хамгийн багадаа 3 тэмдэгт оруулна уу';
        if (value.trim().length > 100) return 'Хамгийн ихдээ 100 тэмдэгт оруулна уу';
        return '';
      case 'description':
        if (!value || !value.trim()) return 'Тайлбар шаардлагатай';
        if (value.trim().length < 10) return 'Хамгийн багадаа 10 тэмдэгт оруулна уу';
        if (value.trim().length > 2000) return 'Хамгийн ихдээ 2000 тэмдэгт оруулна уу';
        return '';
      case 'startingBid':
        if (!value || value === '0') return 'Эхлэх үнэ шаардлагатай';
        const bidValue = parseFloat(value);
        if (isNaN(bidValue) || bidValue <= 0) return 'Зөв үнэ оруулна уу';
        if (bidValue < 1000) return 'Хамгийн багадаа 1,000₮ байх ёстой';
        if (bidValue > 1000000000) return 'Хэт их үнэ байна';
        return '';
      case 'price':
        if (!value || value === '0') return 'Тогтмол үнэ шаардлагатай';
        const priceValue = parseFloat(value);
        if (isNaN(priceValue) || priceValue <= 0) return 'Зөв үнэ оруулна уу';
        if (priceValue < 1000) return 'Хамгийн багадаа 1,000₮ байх ёстой';
        if (priceValue > 1000000000) return 'Хэт их үнэ байна';
        return '';
      case 'category':
        if (!value) return 'Категори сонгоно уу';
        return '';
      case 'scheduledDate':
        if (formData.startMode === 'scheduled' && !value) return 'Огноо оруулна уу';
        if (value) {
          const datePattern = /^\d{4}-\d{2}-\d{2}$/;
          if (!datePattern.test(value)) return 'Огноог YYYY-MM-DD хэлбэрээр оруулна уу';
        }
        return '';
      case 'scheduledTime':
        if (formData.startMode === 'scheduled' && !value) return 'Цаг оруулна уу';
        if (value) {
          const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
          if (!timePattern.test(value)) return 'Цагийг HH:MM хэлбэрээр оруулна уу';
        }
        return '';
      case 'year':
        if (isAutomotiveCategory() && value) {
          const yearNum = parseInt(value);
          const currentYear = new Date().getFullYear();
          if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
            return `Он жил 1900-${currentYear + 1} хооронд байх ёстой`;
          }
        }
        return '';
      case 'mileage':
        if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) {
          return 'Зөв гүйлт оруулна уу';
        }
        return '';
      default:
        return '';
    }
  };

  const handleFieldChange = (fieldName: keyof FormData, value: any) => {
    // Update form data
    setFormData({ ...formData, [fieldName]: value });

    // Clear error for this field
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: '' });
    }

    // Auto-fill based on title input
    if (fieldName === 'title' && value.length > 3) {
      if (isAutomotiveCategory()) {
        autoFillCarDetails(value);
      } else if (isPhoneCategory()) {
        autoFillPhoneDetails(value);
      }
    }
  };

  const handleFieldBlur = (fieldName: keyof FormData) => {
    const error = validateField(fieldName, formData[fieldName]);
    if (error) {
      setErrors({ ...errors, [fieldName]: error });
    }
  };

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
          'Өмнө хийж байсан талбар олдлоо',
          `Тэр талбараасаа үргэлжлүүлэх үү?`,
          [
            {
              text: 'Аних',
              style: 'cancel',
              onPress: () => deleteDraft(draftKey),
            },
            {
              text: 'Тэгье',
              onPress: () => {
                setFormData({ ...formData, ...draft });
                Alert.alert('Амжилттай', 'Өмнө нь хийж байсан талбар сэргээгдлээ!');
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
        Alert.alert(
          'Зөвшөрөл шаардлагатай',
          'Зураг оруулахын тулд Settings > Privacy > Photos-с апп-д зургийн санд хандах зөвшөрөл өгнө үү',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    }
    return true;
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/category/');
      const categoriesData = response.data?.data || response.data || [];
      setCategories(categoriesData);
    } catch (error) {
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

  // Auto-expand relevant sections when category changes
  useEffect(() => {
    if (formData.category) {
      if (isAutomotiveCategory()) {
        setExpandedSections(prev => ({ ...prev, automotive: true, phone: false }));
      } else if (isPhoneCategory()) {
        setExpandedSections(prev => ({ ...prev, phone: true, automotive: false }));
      } else {
        setExpandedSections(prev => ({ ...prev, automotive: false, phone: false }));
      }
    }
  }, [formData.category]);

  // Auto-expand auction section when basic fields are filled
  useEffect(() => {
    if (formData.title && formData.description && formData.category && formData.startingBid) {
      setExpandedSections(prev => ({ ...prev, auction: true }));
    }
  }, [formData.title, formData.description, formData.category, formData.startingBid]);

  const isAutomotiveCategory = () => {
    if (!formData.category || !categories.length) return false;
    const selectedCat = categories.find((c) => c._id === formData.category);
    if (!selectedCat) return false;

    // Check selected category
    const titleMn = (selectedCat?.titleMn || '').toLowerCase();
    const titleEn = (selectedCat?.title || '').toLowerCase();

    // Check parent category if exists
    let parentTitleMn = '';
    let parentTitleEn = '';
    if (selectedCat.parent) {
      const parentId = selectedCat.parent?._id || selectedCat.parent;
      const parentCat = categories.find((c) => c._id === parentId);
      if (parentCat) {
        parentTitleMn = (parentCat?.titleMn || '').toLowerCase();
        parentTitleEn = (parentCat?.title || '').toLowerCase();
      }
    }

    // Only match if category OR parent is automotive (not subcategory of automotive)
    const isAutoCat =
      titleMn === 'автомашин' ||
      titleMn === 'тээврийн хэрэгсэл' ||
      titleEn === 'car' ||
      titleEn === 'vehicle' ||
      titleEn === 'automotive';

    const parentIsAutoCat =
      parentTitleMn === 'автомашин' ||
      parentTitleMn === 'тээврийн хэрэгсэл' ||
      parentTitleEn === 'car' ||
      parentTitleEn === 'vehicle' ||
      parentTitleEn === 'automotive';

    return isAutoCat || parentIsAutoCat;
  };

  const isPhoneCategory = () => {
    if (!formData.category || !categories.length) return false;
    const selectedCat = categories.find((c) => c._id === formData.category);
    if (!selectedCat) return false;

    // Check selected category
    const titleMn = (selectedCat?.titleMn || '').toLowerCase();
    const titleEn = (selectedCat?.title || '').toLowerCase();

    // Check parent category if exists
    let parentTitleMn = '';
    let parentTitleEn = '';
    if (selectedCat.parent) {
      const parentId = selectedCat.parent?._id || selectedCat.parent;
      const parentCat = categories.find((c) => c._id === parentId);
      if (parentCat) {
        parentTitleMn = (parentCat?.titleMn || '').toLowerCase();
        parentTitleEn = (parentCat?.title || '').toLowerCase();
      }
    }

    // Check if category or parent is phone-related
    const isPhoneCat =
      titleMn.includes('утас') ||
      titleMn.includes('гар утас') ||
      titleMn.includes('смартфон') ||
      titleMn.includes('телефон') ||
      titleEn.includes('phone') ||
      titleEn.includes('smartphone') ||
      titleEn.includes('mobile');

    const parentIsPhoneCat =
      parentTitleMn.includes('утас') ||
      parentTitleMn.includes('гар утас') ||
      parentTitleMn.includes('смартфон') ||
      parentTitleMn.includes('телефон') ||
      parentTitleEn.includes('phone') ||
      parentTitleEn.includes('smartphone') ||
      parentTitleEn.includes('mobile');

    return isPhoneCat || parentIsPhoneCat;
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({ ...expandedSections, [section]: !expandedSections[section] });
  };

  // Auto-fill car details from common patterns
  const autoFillCarDetails = (titleText: string) => {
    const lowerTitle = titleText.toLowerCase().trim();

    // Common car models database with descriptions
    const carDatabase: Record<string, { manufacturer: string; model: string; year?: string; description?: string }> = {
      'prius 30': {
        manufacturer: 'Toyota',
        model: 'Prius',
        year: '2010',
        description: 'Toyota Prius 30 үе. Найдвартай гибрид автомашин, эдийн засгийн түлш зарцуулалттай. Такси болон хувийн хэрэглээнд тохиромжтой.'
      },
      'prius 20': {
        manufacturer: 'Toyota',
        model: 'Prius',
        year: '2004',
        description: 'Toyota Prius 20 үе. Анхны гибрид загваруудын нэг, хямд засвартай. Эдийн засагт ээлтэй сонголт.'
      },
      'prius 50': {
        manufacturer: 'Toyota',
        model: 'Prius',
        year: '2016',
        description: 'Toyota Prius 50 үе. Шинэчлэгдсэн дизайн, бага түлш зарцуулалт, өндөр найдвартай. Орчин үеийн гибрид автомашин.'
      },
      'camry 40': {
        manufacturer: 'Toyota',
        model: 'Camry',
        year: '2006',
        description: 'Toyota Camry 40 үе. Тав тух сайтай, өргөн бензин хөдөлгүүр. Гэр бүлийн автомашинд тохиромжтой.'
      },
      'camry 50': {
        manufacturer: 'Toyota',
        model: 'Camry',
        year: '2012',
        description: 'Toyota Camry 50 үе. Орчин үеийн дизайн, найдвартай хөдөлгүүр, өндөр аюулгүй байдал. Бизнес класс автомашин.'
      },
      'camry 70': {
        manufacturer: 'Toyota',
        model: 'Camry',
        year: '2018',
        description: 'Toyota Camry 70 үе. Хамгийн сүүлийн үеийн загвар, шинэлэг технологи, спортлог дизайн. Дээд зэргийн тав тух.'
      },
      'lexus rx350': {
        manufacturer: 'Lexus',
        model: 'RX350',
        description: 'Lexus RX350. Тансаг SUV, өндөр чанарын материал, дэлхийн түвшний найдвартай байдал. Статус болон тав тухыг хослуулсан.'
      },
      'lexus lx570': {
        manufacturer: 'Lexus',
        model: 'LX570',
        description: 'Lexus LX570. Full-size тансаг SUV, хүчирхэг V8 хөдөлгүүр, 7 суудалтай. Premium класс.'
      },
      'honda fit': {
        manufacturer: 'Honda',
        model: 'Fit',
        description: 'Honda Fit. Жижиг боловч өргөн дотоод орон зайтай, эдийн засагт ээлтэй. Хотын хэрэглээнд төгс.'
      },
      'nissan note': {
        manufacturer: 'Nissan',
        model: 'Note',
        description: 'Nissan Note. Compact хэмжээтэй, өргөн багтаамжтай, найдвартай. Өдөр тутмын хэрэглээнд тохиромжтой.'
      },
    };

    for (const [pattern, details] of Object.entries(carDatabase)) {
      if (lowerTitle.includes(pattern)) {
        setFormData(prev => ({
          ...prev,
          manufacturer: details.manufacturer,
          model: details.model,
          year: details.year || prev.year,
          description: !prev.description.trim() && details.description ? details.description : prev.description,
        }));
        break;
      }
    }
  };

  // Auto-fill phone details from common patterns
  const autoFillPhoneDetails = (titleText: string) => {
    const lowerTitle = titleText.toLowerCase().trim();

    // Common phone models database with descriptions
    const phoneDatabase: Record<string, { brand: string; model: string; storage?: string; ram?: string; description?: string }> = {
      'iphone 15 pro max': {
        brand: 'Apple',
        model: 'iPhone 15 Pro Max',
        storage: '256GB',
        ram: '8GB',
        description: 'Хамгийн сүүлийн үеийн iPhone 15 Pro Max. A17 Pro процессор, ProMotion дэлгэц, дээд зэргийн камерын систем. Сайн байдалтай.'
      },
      'iphone 15 pro': {
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        storage: '128GB',
        ram: '8GB',
        description: 'iPhone 15 Pro загвар. Титан хүрээ, гурван камер, өндөр хурдтай процессор. Хэрэглэгдсэн боловч сайн байдалтай.'
      },
      'iphone 14 pro': {
        brand: 'Apple',
        model: 'iPhone 14 Pro',
        storage: '128GB',
        ram: '6GB',
        description: 'iPhone 14 Pro. Dynamic Island, 48MP камер, ProMotion технологи. Өдөр тутмын хэрэглээнд тохиромжтой.'
      },
      'iphone 13 pro': {
        brand: 'Apple',
        model: 'iPhone 13 Pro',
        storage: '128GB',
        ram: '6GB',
        description: 'iPhone 13 Pro. Урт батарей, ProMotion дэлгэц, гурван камер. Найдвартай загвар.'
      },
      'iphone 12': {
        brand: 'Apple',
        model: 'iPhone 12',
        storage: '64GB',
        ram: '4GB',
        description: 'iPhone 12. 5G дэмжлэгтэй, OLED дэлгэц, хоёр камер. Үнэ чанарын харьцаа сайн.'
      },
      'samsung s24 ultra': {
        brand: 'Samsung',
        model: 'Galaxy S24 Ultra',
        storage: '256GB',
        ram: '12GB',
        description: 'Samsung S24 Ultra. Snapdragon 8 Gen 3, 200MP камер, S Pen дэмжлэгтэй. Хамгийн хүчирхэг Android утас.'
      },
      'samsung s23': {
        brand: 'Samsung',
        model: 'Galaxy S23',
        storage: '128GB',
        ram: '8GB',
        description: 'Samsung Galaxy S23. Compact загвар, өндөр гүйцэтгэл, сайн камер. Өдөр тутмын хэрэглээнд тохиромжтой.'
      },
      'xiaomi 14': {
        brand: 'Xiaomi',
        model: 'Xiaomi 14',
        storage: '256GB',
        ram: '12GB',
        description: 'Xiaomi 14. Snapdragon 8 Gen 3, Leica камер, хурдан цэнэглэгч. Өндөр чанартай утас.'
      },
    };

    for (const [pattern, details] of Object.entries(phoneDatabase)) {
      if (lowerTitle.includes(pattern)) {
        setFormData(prev => ({
          ...prev,
          phoneBrand: details.brand,
          phoneModel: details.model,
          storage: details.storage || prev.storage,
          ram: details.ram || prev.ram,
          description: !prev.description.trim() && details.description ? details.description : prev.description,
        }));
        break;
      }
    }
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

  // Auto-generate title for phones
  useEffect(() => {
    if (isPhoneCategory() && formData.phoneBrand && formData.phoneModel) {
      const autoTitle = `${formData.phoneBrand} ${formData.phoneModel}${formData.storage ? ' ' + formData.storage : ''}`;
      if (formData.title !== autoTitle) {
        setFormData((prev) => ({ ...prev, title: autoTitle }));
      }
    }
  }, [formData.phoneBrand, formData.phoneModel, formData.storage, formData.category]);

  const showImageSourceOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Цуцлах', 'Камер', 'Зургийн сан'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImageFromCamera();
          } else if (buttonIndex === 2) {
            pickImagesFromLibrary();
          }
        }
      );
    } else {
      // For Android, show Alert
      Alert.alert(
        'Зураг сонгох',
        'Та зургаа хаанаас авах вэ?',
        [
          { text: 'Цуцлах', style: 'cancel' },
          { text: 'Камер', onPress: () => pickImageFromCamera() },
          { text: 'Зургийн сан', onPress: () => pickImagesFromLibrary() },
        ],
        { cancelable: true }
      );
    }
  };

  const pickImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Зөвшөрөл шаардлагатай',
          'Камер ашиглахын тулд Settings-с апп-д камер ашиглах зөвшөрөл өгнө үү',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets) {
        if (images.length >= MAX_IMAGE_UPLOADS) {
          Alert.alert('Анхааруулга', `Та хамгийн ихдээ ${MAX_IMAGE_UPLOADS} зураг оруулах боломжтой.`);
          return;
        }
        setImages([...images, result.assets[0]]);
      }
    } catch (error: any) {
      Alert.alert('Алдаа', `Камер ашиглахад алдаа гарлаа: ${error.message || 'Дахин оролдоно уу'}`);
    }
  };

  const pickImagesFromLibrary = async () => {
    try {
      // Check and request permission first
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const hasPermission = await requestImagePermissions();
        if (!hasPermission) {
          return;
        }
      }

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
      } else if (result.canceled) {
      }
    } catch (error: any) {
      Alert.alert(
        'Алдаа',
        `Зураг сонгоход алдаа гарлаа: ${error.message || 'Дахин оролдоно уу'}`
      );
    }
  };

  const pickImages = showImageSourceOptions;

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    // Adjust primary index if needed
    if (index === primaryImageIndex) {
      setPrimaryImageIndex(0);
    } else if (index < primaryImageIndex) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    }
  };

  const setPrimaryImage = (index: number) => {
    setPrimaryImageIndex(index);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImages(newImages);

    // Update primary index
    if (fromIndex === primaryImageIndex) {
      setPrimaryImageIndex(toIndex);
    } else if (fromIndex < primaryImageIndex && toIndex >= primaryImageIndex) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    } else if (fromIndex > primaryImageIndex && toIndex <= primaryImageIndex) {
      setPrimaryImageIndex(primaryImageIndex + 1);
    }
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
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    // Validate all required fields
    const titleError = validateField('title', formData.title);
    if (titleError) newErrors.title = titleError;

    const descError = validateField('description', formData.description);
    if (descError) newErrors.description = descError;

    const categoryError = validateField('category', formData.category);
    if (categoryError) newErrors.category = categoryError;

    // Validate based on sell type
    if (formData.sellType === 'auction') {
      const bidError = validateField('startingBid', formData.startingBid);
      if (bidError) newErrors.startingBid = bidError;

      if (formData.startMode === 'scheduled') {
        const dateError = validateField('scheduledDate', formData.scheduledDate);
        if (dateError) newErrors.scheduledDate = dateError;

        const timeError = validateField('scheduledTime', formData.scheduledTime);
        if (timeError) newErrors.scheduledTime = timeError;

        // Check if scheduled time is in the future
        if (!dateError && !timeError) {
          const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
          if (scheduledDateTime <= new Date()) {
            newErrors.scheduledDate = 'Эхлэх хугацаа ирээдүй байх ёстой';
          }
        }
      }

      if (!formData.duration) {
        Alert.alert('Алдаа', 'Дуудлага худалдааны хугацаа сонгоно уу');
        return false;
      }
    } else if (formData.sellType === 'fixed') {
      const priceError = validateField('price', formData.price);
      if (priceError) newErrors.price = priceError;
    }

    // Validate automotive fields if applicable
    if (isAutomotiveCategory()) {
      const yearError = validateField('year', formData.year);
      if (yearError) newErrors.year = yearError;

      const mileageError = validateField('mileage', formData.mileage);
      if (mileageError) newErrors.mileage = mileageError;
    }

    if (images.length === 0) {
      Alert.alert('Алдаа', 'Дор хаяж 1 зураг оруулна уу');
      return false;
    }

    // Set all errors at once
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert('Алдаа', 'Бүх шаардлагатай талбаруудыг зөв бөглөнө үү');
      return false;
    }

    return true;
  };

  // Manual save draft handler
  const handleSaveDraft = async () => {
    if (!formData.title && !formData.description) {
      Alert.alert('Error', 'Please enter a title or description to save as draft');
      return;
    }

    try {
      await AsyncStorage.setItem(
        `@auction_draft_${draftKey}`,
        JSON.stringify({
          data: formData,
          _timestamp: Date.now(),
          _version: '1.0',
        })
      );
      Alert.alert('Амжилттай', 'Ноорог хадгалагдлаа! Дараа үргэлжлүүлж болно.');
    } catch (error) {
      Alert.alert('Алдаа', 'Ноорог хадгалахад алдаа гарлаа');
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.post('/api/ai/generate-description', {
        prompt: aiPrompt,
        title: formData.title,
        category: formData.category,
        condition: formData.condition,
        brand: formData.brand,
      }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setFormData(prev => ({ ...prev, description: res.data.description }));
      setShowAiInput(false);
      setAiPrompt('');
    } catch {
      Alert.alert('Алдаа', 'AI тайлбар үүсгэхэд алдаа гарлаа');
    } finally {
      setAiLoading(false);
    }
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
      formDataToSend.append('sellType', formData.sellType);
      formDataToSend.append('price', formData.sellType === 'fixed' ? formData.price : formData.startingBid);

      // Buy It Now price (optional)
      if (formData.buyNowPrice) {
        formDataToSend.append('buyNowPrice', formData.buyNowPrice);
      }

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

      // Add images with proper MIME types
      for (let i = 0; i < images.length; i++) {
        const image = images[i];

        // Determine proper MIME type from image asset
        let mimeType = image.mimeType || 'image/jpeg';
        let extension = 'jpg';

        // Handle different image formats
        if (mimeType.includes('png')) {
          extension = 'png';
        } else if (mimeType.includes('webp')) {
          extension = 'webp';
        } else if (mimeType.includes('heic') || mimeType.includes('heif')) {
          // iOS HEIC images - convert to JPEG
          mimeType = 'image/jpeg';
          extension = 'jpg';
        } else {
          // Default to JPEG for all other formats
          mimeType = 'image/jpeg';
          extension = 'jpg';
        }

        // Set primary image indicator
        const isPrimary = i === primaryImageIndex;

        formDataToSend.append('images', {
          uri: image.uri,
          name: `photo_${i}_${isPrimary ? 'primary' : 'secondary'}.${extension}`,
          type: mimeType,
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
      const errorMsg = error.response?.data?.message || error.message || 'Бүтээгдэхүүн нэмэхэд алдаа гарлаа';
      Alert.alert('Алдаа', errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const parentCategories = categories.filter((c) => !c.parent);
  const showAutomotiveFields = isAutomotiveCategory();

  // Calculate form completion progress
  const calculateProgress = (): number => {
    let completed = 0;
    let total = 6; // Base required fields: title, description, category, startingBid, duration, images

    if (formData.title.trim()) completed++;
    if (formData.description.trim()) completed++;
    if (formData.category) completed++;
    if (formData.startingBid && parseFloat(formData.startingBid) > 0) completed++;
    if (formData.duration) completed++;
    if (images.length > 0) completed++;

    // Scheduled auction fields
    if (formData.startMode === 'scheduled') {
      total += 2;
      if (formData.scheduledDate) completed++;
      if (formData.scheduledTime) completed++;
    }

    // Automotive fields
    if (showAutomotiveFields) {
      total += 3;
      if (formData.manufacturer) completed++;
      if (formData.model) completed++;
      if (formData.year) completed++;
    }

    return (completed / total) * 100;
  };

  const progress = calculateProgress();

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

      {/* Progress Indicator */}
      <View style={[styles.progressContainer, { backgroundColor: themeColors.surface }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressText, { color: themeColors.text }]}>
            Form Completion
          </Text>
          <Text style={[styles.progressPercentage, {
            color: progress === 100 ? theme.success600 : theme.brand600
          }]}>
            {Math.round(progress)}%
          </Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: themeColors.border }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progress}%`,
                backgroundColor: progress === 100 ? theme.success600 : theme.brand600,
              }
            ]}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
        {/* SECTION: Category Selection */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <CollapsibleSectionHeader
            icon="pricetags"
            title="Категори"
            iconColor={theme.primary500}
            isExpanded={expandedSections.category}
            onToggle={() => toggleSection('category')}
            themeColors={themeColors}
          />

          {expandedSections.category && (
          <View>

          {/* Parent Category */}
          <RequiredLabel color={themeColors.text}>Үндсэн категори *</RequiredLabel>
          <TouchableOpacity
            style={[styles.pickerContainer, {
              backgroundColor: themeColors.inputBg,
              borderColor: themeColors.border
            }]}
            onPress={() => setShowParentCategoryPicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="grid-outline" size={20} color={themeColors.textSecondary} style={styles.pickerIcon} />
            <Text style={[styles.pickerText, {
              color: parentCategory ? themeColors.text : themeColors.textSecondary
            }]}>
              {parentCategory
                ? `${parentCategories.find(c => c._id === parentCategory)?.icon || ''} ${parentCategories.find(c => c._id === parentCategory)?.titleMn || parentCategories.find(c => c._id === parentCategory)?.title || 'Үндсэн категори сонгох'}`
                : 'Үндсэн категори сонгох'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>

          {/* Subcategory */}
          <RequiredLabel color={themeColors.text}>Дэд категори *</RequiredLabel>
          <TouchableOpacity
            style={[styles.pickerContainer, !parentCategory && styles.pickerDisabled, {
              backgroundColor: themeColors.inputBg,
              borderColor: themeColors.border
            }]}
            onPress={() => {
              if (!parentCategory || subcategories.length === 0) return;
              setShowSubcategoryPicker(true);
            }}
            activeOpacity={0.7}
            disabled={!parentCategory || subcategories.length === 0}
          >
            <Ionicons name="list-outline" size={20} color={themeColors.textSecondary} style={styles.pickerIcon} />
            <Text style={[styles.pickerText, {
              color: formData.category ? themeColors.text : themeColors.textSecondary
            }]}>
              {formData.category
                ? subcategories.find(c => c._id === formData.category)?.titleMn || subcategories.find(c => c._id === formData.category)?.title || 'Дэд категори сонгох'
                : 'Дэд категори сонгох'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>

          {/* AI Category Suggester */}
          </View>
          )}
        </View>

        {/* SECTION: Basic Product Info */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <CollapsibleSectionHeader
            icon="information-circle"
            title="Үндсэн мэдээлэл"
            iconColor={theme.primary500}
            isExpanded={expandedSections.basic}
            onToggle={() => toggleSection('basic')}
            themeColors={themeColors}
          />

          {expandedSections.basic && (
          <View>

          {/* Title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RequiredLabel color={themeColors.text}>Бүтээгдэхүүний нэр *</RequiredLabel>
            {showAutomotiveFields && formData.year && formData.manufacturer && formData.model && (
              <Text style={[styles.label, { color: theme.success600, fontSize: 12 }]}>(Auto)</Text>
            )}
          </View>
          <TextInput
            style={[
              styles.input,
              showAutomotiveFields && formData.year && formData.manufacturer && formData.model && styles.inputDisabled,
              errors.title && styles.inputError,
              {
                backgroundColor: themeColors.inputBg,
                borderColor: errors.title ? theme.danger600 : themeColors.border,
                color: themeColors.text
              }
            ]}
            placeholder={showAutomotiveFields ? '2020 Toyota Camry' : 'iPhone 13 Pro 128GB'}
            placeholderTextColor={themeColors.textSecondary}
            value={formData.title}
            onChangeText={(text) => handleFieldChange('title', text)}
            onBlur={() => handleFieldBlur('title')}
            editable={!(showAutomotiveFields && formData.year && formData.manufacturer && formData.model)}
          />
          <ErrorText message={errors.title} />
          <CharacterCounter current={formData.title.length} max={100} themeColor={themeColors.textSecondary} />
          {(isAutomotiveCategory() || isPhoneCategory()) && !formData.title && (
            <HelpText
              text={isAutomotiveCategory()
                ? "Жишээ: 'Prius 30' эсвэл 'Camry 50' гэж бичвэл автоматаар бөглөнө"
                : "Жишээ: 'iPhone 15 Pro' эсвэл 'Samsung S24' гэж бичвэл автоматаар бөглөнө"}
              themeColor={themeColors.textSecondary}
            />
          )}

          {/* Description */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <RequiredLabel color={themeColors.text}>Тайлбар *</RequiredLabel>
            <TouchableOpacity onPress={() => setShowAiInput(v => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5,
                borderRadius: 8, borderWidth: 1.5,
                borderColor: showAiInput ? theme.brand600 : themeColors.border,
                backgroundColor: showAiInput ? theme.brand600 + '18' : 'transparent' }}>
              <Text style={{ fontSize: 13 }}>✨</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: showAiInput ? theme.brand600 : themeColors.textSecondary }}>AI тайлбар</Text>
            </TouchableOpacity>
          </View>
          {showAiInput && (
            <View style={{ marginBottom: 10, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: theme.brand600, backgroundColor: isDarkMode ? '#1e293b' : '#f8f9ff' }}>
              <Text style={{ fontSize: 12, color: themeColors.textSecondary, marginBottom: 8 }}>
                Юу зарж байгаагаа энгийнээр тайлбарла
              </Text>
              <TextInput
                style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: themeColors.border,
                  backgroundColor: themeColors.inputBg, color: themeColors.text, fontSize: 13, minHeight: 80, textAlignVertical: 'top' }}
                placeholder="Жишээ: 2 жил хэрэглэсэн iPhone 13, дэлгэц бүрэн бүтэн, цэнэг 89%..."
                placeholderTextColor={themeColors.textSecondary}
                value={aiPrompt}
                onChangeText={setAiPrompt}
                multiline
              />
              <TouchableOpacity onPress={handleAiGenerate} disabled={aiLoading || !aiPrompt.trim()}
                style={{ marginTop: 8, padding: 10, borderRadius: 8,
                  backgroundColor: aiLoading || !aiPrompt.trim() ? theme.brand600 + '60' : theme.brand600,
                  alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                {aiLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ fontSize: 13 }}>✨</Text>}
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                  {aiLoading ? 'Үүсгэж байна...' : 'Тайлбар үүсгэх'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              errors.description && styles.inputError,
              {
                backgroundColor: themeColors.inputBg,
                borderColor: errors.description ? theme.danger600 : themeColors.border,
                color: themeColors.text
              }
            ]}
            placeholder="Бүтээгдэхүүний дэлгэрэнгүй тайлбар бичнэ үү..."
            placeholderTextColor={themeColors.textSecondary}
            value={formData.description}
            onChangeText={(text) => handleFieldChange('description', text)}
            onBlur={() => handleFieldBlur('description')}
            multiline
            numberOfLines={6}
          />
          <ErrorText message={errors.description} />
          <CharacterCounter current={formData.description.length} max={2000} themeColor={themeColors.textSecondary} />
          {(isAutomotiveCategory() || isPhoneCategory()) && !formData.description && (
            <HelpText
              text="Танил загваруудын тайлбар автоматаар үүснэ. Өөрийн мэдээлэл нэмж оруулж болно."
              themeColor={themeColors.textSecondary}
            />
          )}

          </View>
          )}
        </View>

        {/* SECTION: Phone/Electronics Fields */}
        {isPhoneCategory() && (
          <View style={[styles.section, { backgroundColor: themeColors.card }]}>
            <CollapsibleSectionHeader
              icon="phone-portrait"
              title="📱 Утасны мэдээлэл"
              iconColor={theme.info600}
              isExpanded={expandedSections.phone}
              onToggle={() => toggleSection('phone')}
              themeColors={themeColors}
            />

            {expandedSections.phone && (
            <View>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <RequiredLabel color={themeColors.textSecondary}>Брэнд *</RequiredLabel>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }]}
                  placeholder="Apple"
                  placeholderTextColor={themeColors.textSecondary}
                  value={formData.phoneBrand}
                  onChangeText={(text) => handleFieldChange('phoneBrand', text)}
                />
              </View>

              <View style={styles.halfInput}>
                <RequiredLabel color={themeColors.textSecondary}>Загвар *</RequiredLabel>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }]}
                  placeholder="iPhone 15 Pro"
                  placeholderTextColor={themeColors.textSecondary}
                  value={formData.phoneModel}
                  onChangeText={(text) => handleFieldChange('phoneModel', text)}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Багтаамж</Text>
                <View style={[styles.pickerContainer, {
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.border
                }]}>
                  <Picker
                    style={[styles.picker, { color: themeColors.text }]}
                    selectedValue={formData.storage}
                    onValueChange={(value) => handleFieldChange('storage', value)}
                    itemStyle={Platform.OS === 'ios' ? { fontSize: 15, height: 120 } : undefined}
                    dropdownIconColor={themeColors.textSecondary}
                  >
                    <Picker.Item label="Сонгох" value="" color={themeColors.textSecondary} />
                    <Picker.Item label="64GB" value="64GB" color={themeColors.text} />
                    <Picker.Item label="128GB" value="128GB" color={themeColors.text} />
                    <Picker.Item label="256GB" value="256GB" color={themeColors.text} />
                    <Picker.Item label="512GB" value="512GB" color={themeColors.text} />
                    <Picker.Item label="1TB" value="1TB" color={themeColors.text} />
                  </Picker>
                </View>
              </View>

              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>RAM</Text>
                <View style={[styles.pickerContainer, {
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.border
                }]}>
                  <Picker
                    style={[styles.picker, { color: themeColors.text }]}
                    selectedValue={formData.ram}
                    onValueChange={(value) => handleFieldChange('ram', value)}
                    itemStyle={Platform.OS === 'ios' ? { fontSize: 15, height: 120 } : undefined}
                    dropdownIconColor={themeColors.textSecondary}
                  >
                    <Picker.Item label="Сонгох" value="" color={themeColors.textSecondary} />
                    <Picker.Item label="4GB" value="4GB" color={themeColors.text} />
                    <Picker.Item label="6GB" value="6GB" color={themeColors.text} />
                    <Picker.Item label="8GB" value="8GB" color={themeColors.text} />
                    <Picker.Item label="12GB" value="12GB" color={themeColors.text} />
                    <Picker.Item label="16GB" value="16GB" color={themeColors.text} />
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Дэлгэц</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }]}
                  placeholder='6.7"'
                  placeholderTextColor={themeColors.textSecondary}
                  value={formData.screenSize}
                  onChangeText={(text) => handleFieldChange('screenSize', text)}
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Батарей</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }]}
                  placeholder="4500mAh"
                  placeholderTextColor={themeColors.textSecondary}
                  value={formData.battery}
                  onChangeText={(text) => handleFieldChange('battery', text)}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: themeColors.textSecondary }]}>Байдал</Text>
            <View style={[styles.pickerContainer, {
              backgroundColor: themeColors.inputBg,
              borderColor: themeColors.border
            }]}>
              <Picker
                style={[styles.picker, { color: themeColors.text }]}
                selectedValue={formData.phoneCondition}
                onValueChange={(value) => handleFieldChange('phoneCondition', value)}
                itemStyle={Platform.OS === 'ios' ? { fontSize: 15, height: 120 } : undefined}
                dropdownIconColor={themeColors.textSecondary}
              >
                <Picker.Item label="Сонгох" value="" color={themeColors.textSecondary} />
                <Picker.Item label="Шинэ" value="Шинэ" color={themeColors.text} />
                <Picker.Item label="Маш сайн" value="Маш сайн" color={themeColors.text} />
                <Picker.Item label="Сайн" value="Сайн" color={themeColors.text} />
                <Picker.Item label="Хэрэглэгдсэн" value="Хэрэглэгдсэн" color={themeColors.text} />
              </Picker>
            </View>
            </View>
            )}
          </View>
        )}

        {/* SECTION: Automotive Fields */}
        {showAutomotiveFields && (
          <View style={[styles.section, { backgroundColor: themeColors.card }]}>
            <CollapsibleSectionHeader
              icon="car-sport"
              title="🚗 Автомашины мэдээлэл"
              iconColor={theme.success600}
              isExpanded={expandedSections.automotive}
              onToggle={() => toggleSection('automotive')}
              themeColors={themeColors}
            />

            {expandedSections.automotive && (
            <View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <RequiredLabel color={themeColors.textSecondary}>Үйлдвэрлэгч *</RequiredLabel>
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
                <RequiredLabel color={themeColors.textSecondary}>Загвар *</RequiredLabel>
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
                <RequiredLabel color={themeColors.textSecondary}>Он жил *</RequiredLabel>
                <TextInput
                  style={[
                    styles.input,
                    errors.year && styles.inputError,
                    {
                      backgroundColor: themeColors.inputBg,
                      borderColor: errors.year ? theme.danger600 : themeColors.border,
                      color: themeColors.text
                    }
                  ]}
                  placeholder="2020"
                  placeholderTextColor={themeColors.textSecondary}
                  value={formData.year}
                  onChangeText={(text) => handleFieldChange('year', text)}
                  onBlur={() => handleFieldBlur('year')}
                  keyboardType="numeric"
                />
                <ErrorText message={errors.year} />
              </View>

              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Гүйлт (км)</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.mileage && styles.inputError,
                    {
                      backgroundColor: themeColors.inputBg,
                      borderColor: errors.mileage ? theme.danger600 : themeColors.border,
                      color: themeColors.text
                    }
                  ]}
                  placeholder="50000"
                  placeholderTextColor={themeColors.textSecondary}
                  value={formData.mileage}
                  onChangeText={(text) => handleFieldChange('mileage', text)}
                  onBlur={() => handleFieldBlur('mileage')}
                  keyboardType="numeric"
                />
                <ErrorText message={errors.mileage} />
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
                <TouchableOpacity
                  style={[styles.pickerContainer, {
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.border
                  }]}
                  onPress={() => setShowFuelTypePicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="water-outline" size={20} color={themeColors.textSecondary} style={styles.pickerIcon} />
                  <Text style={[styles.pickerText, {
                    color: formData.fuelType ? themeColors.text : themeColors.textSecondary
                  }]}>
                    {formData.fuelType || 'Сонгох'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.label, { color: themeColors.textSecondary }]}>Хурдны хайрцаг</Text>
            <TouchableOpacity
              style={[styles.pickerContainer, {
                backgroundColor: themeColors.inputBg,
                borderColor: themeColors.border
              }]}
              onPress={() => setShowTransmissionPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={20} color={themeColors.textSecondary} style={styles.pickerIcon} />
              <Text style={[styles.pickerText, {
                color: formData.transmission ? themeColors.text : themeColors.textSecondary
              }]}>
                {formData.transmission || 'Сонгох'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Өнгө</Text>
                <TouchableOpacity
                  style={[styles.pickerContainer, {
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.border
                  }]}
                  onPress={() => setShowColorPicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="color-palette-outline" size={20} color={themeColors.textSecondary} style={styles.pickerIcon} />
                  <Text style={[styles.pickerText, {
                    color: formData.color ? themeColors.text : themeColors.textSecondary
                  }]}>
                    {formData.color || 'Сонгох'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Байдал</Text>
                <TouchableOpacity
                  style={[styles.pickerContainer, {
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.border
                  }]}
                  onPress={() => setShowConditionPicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color={themeColors.textSecondary} style={styles.pickerIcon} />
                  <Text style={[styles.pickerText, {
                    color: formData.condition ? themeColors.text : themeColors.textSecondary
                  }]}>
                    {formData.condition || 'Сонгох'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            </View>
            )}
          </View>
        )}

        {/* SECTION: Selling Options */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <CollapsibleSectionHeader
            icon="timer"
            title={formData.sellType === 'auction' ? '⚡ Дуудлага худалдаа тохиргоо' : '💰 Шууд худалдаа тохиргоо'}
            iconColor={theme.success600}
            isExpanded={expandedSections.auction}
            onToggle={() => toggleSection('auction')}
            themeColors={themeColors}
          />

          {expandedSections.auction && (
          <View>

          {/* Sell Type Selection */}
          <Text style={[styles.label, { color: themeColors.text }]}>Зарах төрөл</Text>
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeButton, formData.sellType === 'auction' && styles.modeButtonActive, {
              backgroundColor: formData.sellType === 'auction' ? theme.success600 : themeColors.surface,
              borderColor: theme.success600
            }]}
            onPress={() => setFormData({ ...formData, sellType: 'auction' })}
          >
            <Ionicons name="hammer" size={20} color={formData.sellType === 'auction' ? theme.white : theme.success600} />
            <Text style={[styles.modeButtonText, formData.sellType === 'auction' && styles.modeButtonTextActive]}>
              Дуудлага худалдаа
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, formData.sellType === 'fixed' && styles.modeButtonActive, {
              backgroundColor: formData.sellType === 'fixed' ? theme.success600 : themeColors.surface,
              borderColor: theme.success600
            }]}
            onPress={() => setFormData({ ...formData, sellType: 'fixed' })}
          >
            <Ionicons name="pricetag" size={20} color={formData.sellType === 'fixed' ? theme.white : theme.success600} />
            <Text style={[styles.modeButtonText, formData.sellType === 'fixed' && styles.modeButtonTextActive]}>
              Шууд худалдаа
            </Text>
          </TouchableOpacity>
        </View>

          {/* Fixed Price Mode */}
          {formData.sellType === 'fixed' && (
            <View>
              <RequiredLabel color={themeColors.text}>Үнэ (₮) *</RequiredLabel>
              <TextInput
                style={[
                  styles.input,
                  errors.price && styles.inputError,
                  {
                    backgroundColor: themeColors.inputBg,
                    borderColor: errors.price ? theme.danger600 : themeColors.border,
                    color: themeColors.text
                  }
                ]}
                placeholder="1000000"
                placeholderTextColor={themeColors.textSecondary}
                value={formData.price}
                onChangeText={(text) => handleFieldChange('price', text)}
                onBlur={() => handleFieldBlur('price')}
                keyboardType="numeric"
              />
              <ErrorText message={errors.price} />

              <View style={[styles.infoCard, { backgroundColor: theme.info100 }]}>
                <Ionicons name="information-circle" size={20} color={theme.info600} />
                <Text style={[styles.infoText, { color: theme.info700 }]}>
                  💰 Худалдан авагч таны тогтоосон үнээр шууд худалдан авах боломжтой
                </Text>
              </View>
            </View>
          )}

          {/* Auction Mode */}
          {formData.sellType === 'auction' && (
          <View>

          {/* Starting Bid - Only for Auction */}
          <RequiredLabel color={themeColors.text}>Эхлэх үнэ (₮) *</RequiredLabel>
          <TextInput
            style={[
              styles.input,
              errors.startingBid && styles.inputError,
              {
                backgroundColor: themeColors.inputBg,
                borderColor: errors.startingBid ? theme.danger600 : themeColors.border,
                color: themeColors.text
              }
            ]}
            placeholder="100000"
            placeholderTextColor={themeColors.textSecondary}
            value={formData.startingBid}
            onChangeText={(text) => handleFieldChange('startingBid', text.replace(/[^0-9]/g, ''))}
            onBlur={() => handleFieldBlur('startingBid')}
            keyboardType="numeric"
          />
          {!errors.startingBid && (
            <Text style={[styles.helperText, { color: themeColors.textSecondary }]}>
              Дуудлага худалдаа эхлэх үнэ (зөвхөн тоо оруулна уу)
            </Text>
          )}
          <ErrorText message={errors.startingBid} />

          {/* Buy It Now Price - Optional */}
          <Text style={[styles.label, { color: themeColors.textSecondary }]}>Шууд зарагдах үнэ (₮) (заавал биш)</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: themeColors.inputBg,
                borderColor: themeColors.border,
                color: themeColors.text
              }
            ]}
            placeholder="500000"
            placeholderTextColor={themeColors.textSecondary}
            value={formData.buyNowPrice}
            onChangeText={(text) => handleFieldChange('buyNowPrice', text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />
          <Text style={[styles.helperText, { color: themeColors.textSecondary }]}>
            Энэ үнээр хэрэглэгч дуудлага худалдааг алгасаад шууд худалдаж авч болно
          </Text>

          {/* Auction Start Mode */}
          <Text style={[styles.label, { color: themeColors.text }]}>Эхлэх горим</Text>
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
              <RequiredLabel color={themeColors.textSecondary}>Огноо *</RequiredLabel>
              <TextInput
                style={[
                  styles.input,
                  errors.scheduledDate && styles.inputError,
                  {
                    backgroundColor: themeColors.inputBg,
                    borderColor: errors.scheduledDate ? theme.danger600 : themeColors.border,
                    color: themeColors.text
                  }
                ]}
                placeholder="2025-12-31"
                placeholderTextColor={themeColors.textSecondary}
                value={formData.scheduledDate}
                onChangeText={(text) => handleFieldChange('scheduledDate', text)}
                onBlur={() => handleFieldBlur('scheduledDate')}
              />
              <ErrorText message={errors.scheduledDate} />
            </View>

            <View style={styles.halfInput}>
              <RequiredLabel color={themeColors.textSecondary}>Цаг *</RequiredLabel>
              <TextInput
                style={[
                  styles.input,
                  errors.scheduledTime && styles.inputError,
                  {
                    backgroundColor: themeColors.inputBg,
                    borderColor: errors.scheduledTime ? theme.danger600 : themeColors.border,
                    color: themeColors.text
                  }
                ]}
                placeholder="14:00"
                placeholderTextColor={themeColors.textSecondary}
                value={formData.scheduledTime}
                onChangeText={(text) => handleFieldChange('scheduledTime', text)}
                onBlur={() => handleFieldBlur('scheduledTime')}
              />
              <ErrorText message={errors.scheduledTime} />
            </View>
          </View>
        )}

          {/* Duration */}
          <RequiredLabel color={themeColors.text}>Үргэлжлэх хугацаа (хоног) *</RequiredLabel>
          <TouchableOpacity
            style={[styles.pickerContainer, {
              backgroundColor: themeColors.inputBg,
              borderColor: themeColors.border
            }]}
            onPress={() => setShowDurationPicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={20} color={themeColors.textSecondary} style={styles.pickerIcon} />
            <Text style={[styles.pickerText, {
              color: formData.duration ? themeColors.text : themeColors.textSecondary
            }]}>
              {formData.duration ? `${formData.duration} хоног` : 'Хугацаа сонгох'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>

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
          </View>
          )}

          </View>
          )}
        </View>

        {/* SECTION: Images */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <CollapsibleSectionHeader
            icon="images"
            title={`Зургууд * (${images.length}/${MAX_IMAGE_UPLOADS})`}
            iconColor={theme.primary500}
            isExpanded={expandedSections.images}
            onToggle={() => toggleSection('images')}
            themeColors={themeColors}
          />

          {expandedSections.images && (
          <View>

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
          <>
            <Text style={[styles.imageHintText, { color: themeColors.textSecondary }]}>
              Tap an image to set as cover photo. First image is the cover by default.
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesPreview}>
              {images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.imagePreviewContainer}
                  onPress={() => setPrimaryImage(index)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: image.uri }} style={styles.imagePreview} />

                  {/* Primary Image Badge */}
                  {index === primaryImageIndex && (
                    <View style={styles.primaryBadge}>
                      <Ionicons name="star" size={16} color={theme.white} />
                      <Text style={styles.primaryBadgeText}>Cover</Text>
                    </View>
                  )}

                  {/* Image Number Badge */}
                  <View style={[styles.imageNumberBadge, { backgroundColor: themeColors.surface }]}>
                    <Text style={[styles.imageNumberText, { color: themeColors.text }]}>{index + 1}</Text>
                  </View>

                  {/* Reorder Buttons */}
                  {images.length > 1 && (
                    <View style={styles.reorderButtons}>
                      {index > 0 && (
                        <TouchableOpacity
                          style={[styles.reorderButton, { backgroundColor: themeColors.surface }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            moveImage(index, index - 1);
                          }}
                        >
                          <Ionicons name="chevron-back" size={16} color={themeColors.text} />
                        </TouchableOpacity>
                      )}
                      {index < images.length - 1 && (
                        <TouchableOpacity
                          style={[styles.reorderButton, { backgroundColor: themeColors.surface }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            moveImage(index, index + 1);
                          }}
                        >
                          <Ionicons name="chevron-forward" size={16} color={themeColors.text} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Remove Button */}
                  <TouchableOpacity
                    style={[styles.removeImageButton, { backgroundColor: themeColors.surface }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color={theme.danger600} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
        </View>
        )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={uploading}
        >
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

        {/* Save Draft Button */}
        <TouchableOpacity
          style={[styles.draftButton, {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border
          }]}
          onPress={handleSaveDraft}
          disabled={uploading}
        >
          <Ionicons name="save-outline" size={20} color={themeColors.text} />
          <Text style={[styles.draftButtonText, { color: themeColors.text }]}>
            Хадгалах
          </Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Parent Category Picker Modal */}
      <Modal
        visible={showParentCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowParentCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Үндсэн категори</Text>
              <TouchableOpacity onPress={() => setShowParentCategoryPicker(false)}>
                <Ionicons name="close" size={28} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={parentCategories}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    { borderBottomColor: themeColors.border },
                    parentCategory === item._id && { backgroundColor: theme.brand100 }
                  ]}
                  onPress={() => {
                    handleParentCategoryChange(item._id);
                    setShowParentCategoryPicker(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, {
                    color: parentCategory === item._id ? theme.brand700 : themeColors.text,
                    fontWeight: parentCategory === item._id ? '700' : '400'
                  }]}>
                    {item.icon || ''} {item.titleMn || item.title}
                  </Text>
                  {parentCategory === item._id && (
                    <Ionicons name="checkmark" size={24} color={theme.brand600} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Subcategory Picker Modal */}
      <Modal
        visible={showSubcategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubcategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Дэд категори</Text>
              <TouchableOpacity onPress={() => setShowSubcategoryPicker(false)}>
                <Ionicons name="close" size={28} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={subcategories}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    { borderBottomColor: themeColors.border },
                    formData.category === item._id && { backgroundColor: theme.brand100 }
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, category: item._id });
                    setShowSubcategoryPicker(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, {
                    color: formData.category === item._id ? theme.brand700 : themeColors.text,
                    fontWeight: formData.category === item._id ? '700' : '400'
                  }]}>
                    {item.titleMn || item.title}
                  </Text>
                  {formData.category === item._id && (
                    <Ionicons name="checkmark" size={24} color={theme.brand600} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Fuel Type Picker Modal */}
      <Modal
        visible={showFuelTypePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFuelTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Түлш</Text>
              <TouchableOpacity onPress={() => setShowFuelTypePicker(false)}>
                <Ionicons name="close" size={28} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[
                { label: 'Бензин', value: 'Бензин', icon: 'water-outline' },
                { label: 'Дизель', value: 'Дизель', icon: 'water-outline' },
                { label: 'Цахилгаан', value: 'Цахилгаан', icon: 'flash-outline' },
                { label: 'Гибрид', value: 'Гибрид', icon: 'leaf-outline' },
                { label: 'Хий', value: 'Хий', icon: 'cloud-outline' },
              ]}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    { borderBottomColor: themeColors.border },
                    formData.fuelType === item.value && { backgroundColor: theme.brand100 }
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, fuelType: item.value });
                    setShowFuelTypePicker(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Ionicons name={item.icon as any} size={22} color={formData.fuelType === item.value ? theme.brand600 : themeColors.textSecondary} />
                    <Text style={[styles.modalOptionText, {
                      color: formData.fuelType === item.value ? theme.brand700 : themeColors.text,
                      fontWeight: formData.fuelType === item.value ? '700' : '400'
                    }]}>
                      {item.label}
                    </Text>
                  </View>
                  {formData.fuelType === item.value && (
                    <Ionicons name="checkmark" size={24} color={theme.brand600} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Transmission Picker Modal */}
      <Modal
        visible={showTransmissionPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTransmissionPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Хурдны хайрцаг</Text>
              <TouchableOpacity onPress={() => setShowTransmissionPicker(false)}>
                <Ionicons name="close" size={28} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[
                { label: 'Автомат', value: 'Автомат' },
                { label: 'Механик', value: 'Механик' },
                { label: 'CVT', value: 'CVT' },
              ]}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    { borderBottomColor: themeColors.border },
                    formData.transmission === item.value && { backgroundColor: theme.brand100 }
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, transmission: item.value });
                    setShowTransmissionPicker(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, {
                    color: formData.transmission === item.value ? theme.brand700 : themeColors.text,
                    fontWeight: formData.transmission === item.value ? '700' : '400'
                  }]}>
                    {item.label}
                  </Text>
                  {formData.transmission === item.value && (
                    <Ionicons name="checkmark" size={24} color={theme.brand600} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Өнгө</Text>
              <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                <Ionicons name="close" size={28} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[
                { label: 'Цагаан', value: 'Цагаан' },
                { label: 'Хар', value: 'Хар' },
                { label: 'Саарал', value: 'Саарал' },
                { label: 'Мөнгөлөг', value: 'Мөнгөлөг' },
                { label: 'Улаан', value: 'Улаан' },
                { label: 'Цэнхэр', value: 'Цэнхэр' },
                { label: 'Ногоон', value: 'Ногоон' },
                { label: 'Шар', value: 'Шар' },
                { label: 'Хүрэн', value: 'Хүрэн' },
                { label: 'Алтан', value: 'Алтан' },
                { label: 'Бусад', value: 'Бусад' },
              ]}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    { borderBottomColor: themeColors.border },
                    formData.color === item.value && { backgroundColor: theme.brand100 }
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, color: item.value });
                    setShowColorPicker(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, {
                    color: formData.color === item.value ? theme.brand700 : themeColors.text,
                    fontWeight: formData.color === item.value ? '700' : '400'
                  }]}>
                    {item.label}
                  </Text>
                  {formData.color === item.value && (
                    <Ionicons name="checkmark" size={24} color={theme.brand600} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Condition Picker Modal */}
      <Modal
        visible={showConditionPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConditionPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Байдал</Text>
              <TouchableOpacity onPress={() => setShowConditionPicker(false)}>
                <Ionicons name="close" size={28} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[
                { label: 'Шинэ', value: 'Шинэ' },
                { label: 'Маш сайн', value: 'Маш сайн' },
                { label: 'Сайн', value: 'Сайн' },
                { label: 'Хэрэглэгдсэн', value: 'Хэрэглэгдсэн' },
              ]}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    { borderBottomColor: themeColors.border },
                    formData.condition === item.value && { backgroundColor: theme.brand100 }
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, condition: item.value });
                    setShowConditionPicker(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, {
                    color: formData.condition === item.value ? theme.brand700 : themeColors.text,
                    fontWeight: formData.condition === item.value ? '700' : '400'
                  }]}>
                    {item.label}
                  </Text>
                  {formData.condition === item.value && (
                    <Ionicons name="checkmark" size={24} color={theme.brand600} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Duration Picker Modal */}
      <Modal
        visible={showDurationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDurationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Үргэлжлэх хугацаа</Text>
              <TouchableOpacity onPress={() => setShowDurationPicker(false)}>
                <Ionicons name="close" size={28} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[
                { label: '1 хоног', value: '1' },
                { label: '3 хоног', value: '3' },
                { label: '5 хоног', value: '5' },
                { label: '7 хоног', value: '7' },
                { label: '10 хоног', value: '10' },
                { label: '14 хоног', value: '14' },
              ]}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    { borderBottomColor: themeColors.border },
                    formData.duration === item.value && { backgroundColor: theme.brand100 }
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, duration: item.value });
                    setShowDurationPicker(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, {
                    color: formData.duration === item.value ? theme.brand700 : themeColors.text,
                    fontWeight: formData.duration === item.value ? '700' : '400'
                  }]}>
                    {item.label}
                  </Text>
                  {formData.duration === item.value && (
                    <Ionicons name="checkmark" size={24} color={theme.brand600} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ErrorText component for inline validation messages
const ErrorText = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={14} color={theme.danger600} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
};

// Required field label component
const RequiredLabel = ({ children, color }: { children: string; color: string }) => {
  return (
    <Text style={[styles.label, { color }]}>
      {children.replace(' *', '')} <Text style={styles.requiredAsterisk}>*</Text>
    </Text>
  );
};

// Character counter component
const CharacterCounter = ({ current, max, themeColor }: { current: number; max: number; themeColor: string }) => {
  const isNearLimit = current > max * 0.8;
  const isOverLimit = current > max;

  return (
    <Text style={[
      styles.characterCounter,
      {
        color: isOverLimit ? theme.danger600 : isNearLimit ? theme.warning600 : themeColor
      }
    ]}>
      {current} / {max}
    </Text>
  );
};

// Help text component
const HelpText = ({ text, themeColor }: { text: string; themeColor: string }) => {
  return (
    <View style={styles.helpTextContainer}>
      <Ionicons name="information-circle-outline" size={14} color={themeColor} />
      <Text style={[styles.helpText, { color: themeColor }]}>{text}</Text>
    </View>
  );
};

// Collapsible Section Header component
const CollapsibleSectionHeader = ({
  icon,
  title,
  iconColor,
  isExpanded,
  onToggle,
  themeColors
}: {
  icon: string;
  title: string;
  iconColor: string;
  isExpanded: boolean;
  onToggle: () => void;
  themeColors: any;
}) => {
  return (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
        <Text style={[styles.sectionHeaderText, { color: themeColors.text }]}>
          {title}
        </Text>
      </View>
      <Ionicons
        name={isExpanded ? 'chevron-up' : 'chevron-down'}
        size={20}
        color={themeColors.textSecondary}
      />
    </TouchableOpacity>
  );
};

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
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  requiredAsterisk: {
    color: theme.danger600,
    fontSize: 14,
    fontWeight: '700',
  },
  characterCounter: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 4,
    fontWeight: '500',
  },
  helpTextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  helpText: {
    fontSize: 12,
    flex: 1,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    minHeight: 52,
    marginBottom: 16,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  textArea: {
    height: 140,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  pickerContainer: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    minHeight: 52,
    marginBottom: 20,
  },
  pickerDisabled: {
    opacity: 0.5,
  },
  pickerIcon: {
    marginRight: 8,
  },
  picker: {
    flex: 1,
    height: Platform.OS === 'ios' ? 52 : 48,
    backgroundColor: 'transparent',
    marginLeft: -4,
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
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
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 8,
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
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 8,
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
    marginTop: 16,
    marginBottom: 20,
  },
  imageHintText: {
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: 16,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: theme.gray200,
  },
  primaryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: theme.warning600,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryBadgeText: {
    color: theme.white,
    fontSize: 11,
    fontWeight: '700',
  },
  imageNumberBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  imageNumberText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reorderButtons: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  reorderButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.success600,
    paddingVertical: 18,
    borderRadius: 14,
    marginTop: 24,
    marginBottom: 0,
    shadowColor: theme.success600,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.white,
  },
  draftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 12,
    borderWidth: 2,
  },
  draftButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 13,
    color: theme.danger600,
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  inputError: {
    borderColor: theme.danger600,
    borderWidth: 1.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  modalOptionText: {
    fontSize: 16,
    flex: 1,
  },
});
