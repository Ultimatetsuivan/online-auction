import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/api';

interface VerificationPhoto {
  type: string;
  uri: string;
  uploaded: boolean;
  url?: string;
  publicId?: string;
}

const PHOTO_TYPE_LABELS: Record<string, string> = {
  'front': 'Урд тал',
  'back': 'Ар тал',
  'side': 'Хажуу тал',
  'top': 'Дээд тал',
  'bottom': 'Доод тал',
  'logo': 'Лого',
  'tag': 'Шошго',
  'serial': 'Серийн дугаар',
  'barcode': 'Баркод',
  'made-in-label': 'Үйлдвэрлэсэн улсын шошго',
  'sole': 'Ул',
  'insole': 'Дотор ул',
  'stitching': 'Оёдол',
  'hardware': 'Металл хэрэгсэл',
  'hallmark': 'Алтны шошго',
  'clasp': 'Түгжээ',
  'engraving': 'Сийлбэр',
  'authentication-card': 'Баталгаажуулах карт'
};

export default function RequestVerification() {
  const { productId, category } = useLocalSearchParams();
  const [requiredPhotos, setRequiredPhotos] = useState<string[]>([]);
  const [photos, setPhotos] = useState<VerificationPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fee, setFee] = useState(5000);

  useEffect(() => {
    fetchRequirements();
  }, [category]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/verification/requirements/${category}`);
      const required = response.data.requiredPhotos;
      setRequiredPhotos(required);
      setFee(response.data.fee || 5000);

      // Initialize photo slots
      const photoSlots = required.map((type: string) => ({
        type,
        uri: '',
        uploaded: false
      }));
      setPhotos(photoSlots);
    } catch (error) {
      console.error('Error fetching requirements:', error);
      Alert.alert('Алдаа', 'Шаардлага татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (index: number) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Зөвшөөрөл шаардлагатай', 'Зургийн сан руу нэвтрэх эрх олгоно уу');
        return;
      }

      const result = await ImagePicker.launchImagePickerAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhotos = [...photos];
        newPhotos[index] = {
          ...newPhotos[index],
          uri: result.assets[0].uri,
          uploaded: false
        };
        setPhotos(newPhotos);

        // Upload photo
        uploadPhoto(index, result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Алдаа', 'Зураг сонгохоюд алдаа гарлаа');
    }
  };

  const uploadPhoto = async (index: number, uri: string) => {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: `verification_${photos[index].type}_${Date.now()}.jpg`
      } as any);

      const response = await api.post('/api/product/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.url) {
        const newPhotos = [...photos];
        newPhotos[index] = {
          ...newPhotos[index],
          url: response.data.url,
          publicId: response.data.publicId,
          uploaded: true
        };
        setPhotos(newPhotos);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Алдаа', 'Зураг илгээхэд алдаа гарлаа');
    } finally {
      setUploading(false);
    }
  };

  const submitVerification = async () => {
    // Check if all photos are uploaded
    const missingPhotos = photos.filter(p => !p.uploaded);
    if (missingPhotos.length > 0) {
      Alert.alert(
        'Зургууд дутуу байна',
        `Дараах зургуудыг оруулна уу: ${missingPhotos.map(p => PHOTO_TYPE_LABELS[p.type]).join(', ')}`
      );
      return;
    }

    Alert.alert(
      'Баталгаажуулалт хүсэх',
      `Баталгаажуулалтын төлбөр: ₮${fee.toLocaleString()}\n\nШинжилгээний хугацаа: 48 цаг\n\nҮргэлжлүүлэх үү?`,
      [
        { text: 'Цуцлах', style: 'cancel' },
        {
          text: 'Илгээх',
          onPress: async () => {
            try {
              setSubmitting(true);

              const verificationPhotos = photos.map(p => ({
                type: p.type,
                url: p.url,
                publicId: p.publicId
              }));

              await api.post(`/api/verification/request/${productId}`, {
                photos: verificationPhotos
              });

              Alert.alert(
                'Амжилттай!',
                'Баталгаажуулалтын хүсэлт илгээгдлээ. 48 цагийн дотор хариу ирнэ.',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error: any) {
              console.error('Error submitting verification:', error);
              Alert.alert('Алдаа', error.response?.data?.error || 'Хүсэлт илгээхэд алдаа гарлаа');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Ачааллаж байна...</Text>
      </View>
    );
  }

  const allPhotosUploaded = photos.every(p => p.uploaded);
  const uploadedCount = photos.filter(p => p.uploaded).length;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Баталгаажуулалт хүсэх</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={20} color="#4CAF50" />
            <Text style={styles.infoText}>Төлбөр: ₮{fee.toLocaleString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#4CAF50" />
            <Text style={styles.infoText}>Шинжилгээ: 48 цаг</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#4CAF50" />
            <Text style={styles.infoText}>Баталгаажсан бэлгэ авна</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>
            {uploadedCount} / {photos.length} зураг оруулсан
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(uploadedCount / photos.length) * 100}%` }
              ]}
            />
          </View>
        </View>

        {/* Photo Requirements */}
        <Text style={styles.sectionTitle}>Шаардлагатай зургууд</Text>
        <View style={styles.photosGrid}>
          {photos.map((photo, index) => (
            <TouchableOpacity
              key={index}
              style={styles.photoSlot}
              onPress={() => pickImage(index)}
              disabled={uploading}
            >
              {photo.uri ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  {photo.uploaded ? (
                    <View style={styles.uploadedBadge}>
                      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    </View>
                  ) : (
                    <View style={styles.uploadingBadge}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.emptySlot}>
                  <Ionicons name="camera-outline" size={32} color="#999" />
                </View>
              )}
              <Text style={styles.photoLabel}>
                {PHOTO_TYPE_LABELS[photo.type] || photo.type}
              </Text>
              <Text style={styles.requiredBadge}>Заавал *</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!allPhotosUploaded || submitting) && styles.submitButtonDisabled
          ]}
          onPress={submitVerification}
          disabled={!allPhotosUploaded || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                Баталгаажуулалт хүсэх (₮{fee.toLocaleString()})
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  progressCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  photoSlot: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    flex: 1,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  uploadedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  uploadingBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  emptySlot: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  photoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  requiredBadge: {
    fontSize: 10,
    color: '#f44336',
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
