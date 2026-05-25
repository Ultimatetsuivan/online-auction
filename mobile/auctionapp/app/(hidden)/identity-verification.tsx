import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/api';
import IDCardScanner from '../components/IDCardScanner';
import LivenessTestModal from '../components/LivenessTestModal';
import MongolianIDCardGuide from '../components/MongolianIDCardGuide';

interface DocumentPhoto {
  type: 'idCardFront' | 'idCardBack' | 'selfieWithId';
  uri: string;
  uploaded: boolean;
  url?: string;
  publicId?: string;
}

const DOCUMENT_LABELS = {
  idCardFront: 'Үнэмлэхний урд тал',
  idCardBack: 'Үнэмлэхний ар тал',
  selfieWithId: 'Үнэмлэх барьсан селфи'
};

const DOCUMENT_INSTRUCTIONS = {
  idCardFront: '• Бүх мэдээлэл тод харагдах\n• Гэрэл сайн байх\n• Тод зураг авах',
  idCardBack: '• Ар талын мэдээлэл тод\n• Баркод/QR код харагдах\n• Гэрэл сайн байх',
  selfieWithId: '• Та болон үнэмлэх тод харагдах\n• Царай бүтнээр харагдах\n• Үнэмлэхний урд тал харагдах'
};

export default function IdentityVerification() {
  const [documents, setDocuments] = useState<DocumentPhoto[]>([
    { type: 'idCardFront', uri: '', uploaded: false },
    { type: 'idCardBack', uri: '', uploaded: false },
    { type: 'selfieWithId', uri: '', uploaded: false }
  ]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [currentScanIndex, setCurrentScanIndex] = useState<number>(0);
  const [livenessTestVisible, setLivenessTestVisible] = useState(false);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/identity-verification/my-status');
      setVerificationStatus(response.data.user);

      if (response.data.user.identityVerified) {
        Alert.alert(
          'Баталгаажсан',
          'Таны данс аль хэдийн баталгаажсан байна!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else if (response.data.user.identityVerification?.status === 'pending') {
        Alert.alert(
          'Хүлээгдэж байна',
          'Таны баталгаажуулалт хүлээгдэж байна. 24-48 цагийн дотор хариу ирнэ.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else if (response.data.user.identityVerification?.status === 'rejected') {
        // Don't show alert or navigate away - let the user see the rejection reason card
        // and allow them to resubmit
      }
    } catch (error) {
      console.error('Error checking status:', error);
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

      const isSelfie = documents[index].type === 'selfieWithId';

      const result = await ImagePicker.launchImagePickerAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: isSelfie ? [3, 4] : [4, 3],
        quality: 0.9, // High quality for ID verification
      });

      if (!result.canceled && result.assets[0]) {
        const newDocuments = [...documents];
        newDocuments[index] = {
          ...newDocuments[index],
          uri: result.assets[0].uri,
          uploaded: false
        };
        setDocuments(newDocuments);

        // Upload photo
        uploadPhoto(index, result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Алдаа', 'Зураг сонгоход алдаа гарлаа');
    }
  };

  const takePhoto = async (index: number) => {
    // For selfie, use regular camera
    const isSelfie = documents[index].type === 'selfieWithId';

    if (isSelfie) {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
          Alert.alert('Зөвшөөрөл шаардлагатай', 'Камер руу нэвтрэх эрх олгоно уу');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.9,
          cameraType: ImagePicker.CameraType.front
        });

        if (!result.canceled && result.assets[0]) {
          const newDocuments = [...documents];
          newDocuments[index] = {
            ...newDocuments[index],
            uri: result.assets[0].uri,
            uploaded: false
          };
          setDocuments(newDocuments);

          // Upload photo
          uploadPhoto(index, result.assets[0].uri);
        }
      } catch (error) {
        console.error('Error taking photo:', error);
        Alert.alert('Алдаа', 'Зураг авахад алдаа гарлаа');
      }
    } else {
      // For ID cards, use scanner with rectangle overlay
      setCurrentScanIndex(index);
      setScannerVisible(true);
    }
  };

  const handleScanCapture = (uri: string) => {
    const newDocuments = [...documents];
    newDocuments[currentScanIndex] = {
      ...newDocuments[currentScanIndex],
      uri: uri,
      uploaded: false
    };
    setDocuments(newDocuments);

    // Upload photo
    uploadPhoto(currentScanIndex, uri);
  };

  const uploadPhoto = async (index: number, uri: string) => {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: `id_verification_${documents[index].type}_${Date.now()}.jpg`
      } as any);

      const response = await api.post('/api/product/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.url) {
        const newDocuments = [...documents];
        newDocuments[index] = {
          ...newDocuments[index],
          url: response.data.url,
          publicId: response.data.publicId,
          uploaded: true
        };
        setDocuments(newDocuments);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Алдаа', 'Зураг илгээхэд алдаа гарлаа');
    } finally {
      setUploading(false);
    }
  };

  const submitVerification = async () => {
    // Check if all documents are uploaded
    const missingDocs = documents.filter(d => !d.uploaded);
    if (missingDocs.length > 0) {
      Alert.alert(
        'Баримт дутуу байна',
        `Дараах баримтуудыг оруулна уу: ${missingDocs.map(d => DOCUMENT_LABELS[d.type]).join(', ')}`
      );
      return;
    }

    Alert.alert(
      'Баталгаажуулалт хүсэх',
      'Таны мэдээллийг нууцалж, аюулгүй хадгална.\n\nШинжилгээний хугацаа: 24-48 цаг\n\nҮргэлжлүүлэх үү?',
      [
        { text: 'Цуцлах', style: 'cancel' },
        {
          text: 'Илгээх',
          onPress: async () => {
            try {
              setSubmitting(true);

              const idCardFront = documents.find(d => d.type === 'idCardFront');
              const idCardBack = documents.find(d => d.type === 'idCardBack');
              const selfieWithId = documents.find(d => d.type === 'selfieWithId');

              await api.post('/api/identity-verification/submit', {
                idCardFront: {
                  url: idCardFront?.url,
                  publicId: idCardFront?.publicId
                },
                idCardBack: {
                  url: idCardBack?.url,
                  publicId: idCardBack?.publicId
                },
                selfieWithId: {
                  url: selfieWithId?.url,
                  publicId: selfieWithId?.publicId
                }
              });

              Alert.alert(
                'Амжилттай!',
                'Баталгаажуулалтын хүсэлт илгээгдлээ. 24-48 цагийн дотор хариу ирнэ.',
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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Ачааллаж байна...</Text>
      </SafeAreaView>
    );
  }

  const allDocumentsUploaded = documents.every(d => d.uploaded);
  const uploadedCount = documents.filter(d => d.uploaded).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Иргэний үнэмлэх баталгаажуулалт</Text>
        </View>

        {/* Rejection Alert - Show if verification was rejected */}
        {verificationStatus?.identityVerification?.status === 'rejected' && (
          <View style={styles.rejectionCard}>
            <View style={styles.rejectionHeader}>
              <Ionicons name="close-circle" size={32} color="#F44336" />
              <Text style={styles.rejectionTitle}>Баталгаажуулалт татгалзагдлаа</Text>
            </View>
            <Text style={styles.rejectionReason}>
              Шалтгаан: {verificationStatus.identityVerification.rejectionReason || 'Тодорхойгүй'}
            </Text>
            <Text style={styles.rejectionText}>
              Та дахин оролдож, шинэ баримт оруулж болно. Дээрх шалтгааныг анхаарч, зөв
              мэдээлэл оруулна уу.
            </Text>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="shield-checkmark" size={32} color="#4CAF50" />
            <Text style={styles.infoTitle}>Хувийн мэдээлэл баталгаажуулах</Text>
          </View>
          <Text style={styles.infoText}>
            Өөрийн үнэмлэх ашиглан хувийн мэдээллээ баталгаажуулна уу. Энэ нь таны дансыг
            аюулгүй болгож, итгэл найдварыг нэмэгдүүлнэ.
          </Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Баталгаажсан данс бэлгэ</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Итгэл найдварын оноо нэмэгдэнэ</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Борлуулалт хийх боломжтой</Text>
            </View>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>
            {uploadedCount} / {documents.length} баримт оруулсан
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(uploadedCount / documents.length) * 100}%` }
              ]}
            />
          </View>
        </View>

        {/* Documents */}
        <Text style={styles.sectionTitle}>Шаардлагатай баримтууд</Text>
        {documents.map((doc, index) => (
          <View key={index} style={styles.documentCard}>
            <View style={styles.documentHeader}>
              <Text style={styles.documentTitle}>{DOCUMENT_LABELS[doc.type]}</Text>
              {doc.uploaded && (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              )}
            </View>

            <Text style={styles.documentInstructions}>
              {DOCUMENT_INSTRUCTIONS[doc.type]}
            </Text>

            {doc.uri ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: doc.uri }} style={styles.photoImage} />
                {!doc.uploaded && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptySlot}>
                {doc.type === 'idCardFront' || doc.type === 'idCardBack' ? (
                  <>
                    <Text style={styles.guideLabel}>Жишээ:</Text>
                    <MongolianIDCardGuide side={doc.type === 'idCardFront' ? 'front' : 'back'} />
                    <Text style={styles.guideTapText}>Дээрх товчийг дарж зураг оруулна уу</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={48} color="#999" />
                    <Text style={styles.emptyText}>Үнэмлэх барьсан селфи оруулна уу</Text>
                  </>
                )}
              </View>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cameraButton]}
                onPress={() => takePhoto(index)}
                disabled={uploading}
              >
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Камер</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.galleryButton]}
                onPress={() => pickImage(index)}
                disabled={uploading}
              >
                <Ionicons name="images" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Зургийн сан</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Privacy Notice */}
        <View style={styles.privacyCard}>
          <Ionicons name="lock-closed" size={20} color="#666" />
          <Text style={styles.privacyText}>
            Таны хувийн мэдээлэл нууцлагдаж, аюулгүй хадгалагдана. Зөвхөн
            баталгаажуулалтын зорилгоор ашиглана.
          </Text>
        </View>

        {/* Liveness Test Button (Testing Only) */}
        <View style={styles.testSection}>
          <Text style={styles.testSectionTitle}>🧪 Тестийн хэсэг</Text>
          <TouchableOpacity
            style={styles.livenessTestButton}
            onPress={() => setLivenessTestVisible(true)}
          >
            <Ionicons name="finger-print" size={24} color="#2196F3" />
            <View style={styles.livenessTestTextContainer}>
              <Text style={styles.livenessTestText}>Амьд байдлын шалгалт</Text>
              <Text style={styles.livenessTestSubtext}>
                Үнэмлэх эргүүлэх хөдөлгөөн шалгах (тест)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!allDocumentsUploaded || submitting) && styles.submitButtonDisabled
          ]}
          onPress={submitVerification}
          disabled={!allDocumentsUploaded || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                Баталгаажуулалт хүсэх
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Liveness Test Modal */}
      <LivenessTestModal
        visible={livenessTestVisible}
        onClose={() => setLivenessTestVisible(false)}
      />

      {/* ID Card Scanner Modal */}
      <IDCardScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onCapture={handleScanCapture}
        title={
          documents[currentScanIndex]?.type === 'idCardFront'
            ? 'Үнэмлэхний урд тал'
            : 'Үнэмлэхний ар тал'
        }
        instruction="Үнэмлэхээ хүрээнд байрлуулна уу"
        side={documents[currentScanIndex]?.type === 'idCardFront' ? 'front' : 'back'}
      />
    </SafeAreaView>
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
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  rejectionCard: {
    backgroundColor: '#FFEBEE',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  rejectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C62828',
    flex: 1,
  },
  rejectionReason: {
    fontSize: 14,
    color: '#C62828',
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  rejectionText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
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
  documentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  documentInstructions: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlot: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    gap: 8,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  guideLabel: {
    alignSelf: 'flex-start',
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
  },
  guideTapText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  cameraButton: {
    backgroundColor: '#2196F3',
  },
  galleryButton: {
    backgroundColor: '#9C27B0',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  privacyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  testSection: {
    backgroundColor: '#F0F8FF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  testSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 12,
  },
  livenessTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  livenessTestTextContainer: {
    flex: 1,
  },
  livenessTestText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  livenessTestSubtext: {
    fontSize: 12,
    color: '#666',
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
