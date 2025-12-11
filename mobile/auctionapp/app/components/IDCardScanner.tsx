import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ID card aspect ratio is approximately 1.586:1 (like credit cards)
const CARD_ASPECT_RATIO = 1.586;
const OVERLAY_WIDTH = SCREEN_WIDTH * 0.85;
const OVERLAY_HEIGHT = OVERLAY_WIDTH / CARD_ASPECT_RATIO;

interface IDCardScannerProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
  title?: string;
  instruction?: string;
}

export default function IDCardScanner({
  visible,
  onClose,
  onCapture,
  title = 'Scan Your ID Card',
  instruction = 'Place your ID card within the frame'
}: IDCardScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);

  // Request permission when modal becomes visible
  useEffect(() => {
    if (visible && permission && !permission.granted && !requestingPermission) {
      handleRequestPermission();
    }
  }, [visible]);

  const handleRequestPermission = async () => {
    try {
      setRequestingPermission(true);
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Камер ашиглах эрх олгогдсонгүй',
          'Үнэмлэх скан хийхийн тулд тохиргооноос камер ашиглах эрхийг идэвхжүүлнэ үү.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert('Алдаа', 'Камер эрх хүсэхэд алдаа гарлаа');
    } finally {
      setRequestingPermission(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;

    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        exif: false
      });

      if (photo && photo.uri) {
        onCapture(photo.uri);
        onClose();
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Алдаа', 'Зураг авахад алдаа гарлаа');
    } finally {
      setCapturing(false);
    }
  };

  // Don't show modal if permission state is not loaded yet
  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color={theme.brand600} />
          <Text style={styles.loadingText}>Ачааллаж байна...</Text>
        </View>
      </Modal>
    );
  }

  // Show permission request screen if not granted
  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={theme.gray400} />
          <Text style={styles.permissionTitle}>Камер ашиглах эрх хэрэгтэй</Text>
          <Text style={styles.permissionText}>
            Үнэмлэх скан хийхийн тулд камер ашиглах эрх олгоно уу
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, requestingPermission && styles.permissionButtonDisabled]}
            onPress={handleRequestPermission}
            disabled={requestingPermission}
          >
            {requestingPermission ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.permissionButtonText}>Зөвшөөрөх</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Цуцлах</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing="back"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Overlay with card frame */}
          <View style={styles.overlay}>
            {/* Top dark overlay */}
            <View style={styles.topOverlay} />

            {/* Middle section with card frame */}
            <View style={styles.middleSection}>
              {/* Left dark overlay */}
              <View style={styles.sideOverlay} />

              {/* Card frame */}
              <View style={styles.cardFrame}>
                {/* Corner markers */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>

              {/* Right dark overlay */}
              <View style={styles.sideOverlay} />
            </View>

            {/* Bottom dark overlay */}
            <View style={styles.bottomOverlay} />
          </View>

          {/* Instructions */}
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionTitle}>{title}</Text>
            <Text style={styles.instructionText}>{instruction}</Text>
          </View>

          {/* Capture button */}
          <View style={styles.captureContainer}>
            <TouchableOpacity
              style={[styles.captureButton, capturing && styles.captureButtonDisabled]}
              onPress={handleCapture}
              disabled={capturing}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 22,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  middleSection: {
    flexDirection: 'row',
    height: OVERLAY_HEIGHT,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cardFrame: {
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: theme.brand600,
    borderWidth: 4,
  },
  topLeft: {
    top: -4,
    left: -4,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -4,
    right: -4,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -4,
    left: -4,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -4,
    right: -4,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  instructionContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 + OVERLAY_HEIGHT / 2 + 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: theme.white,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.gray900,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: theme.gray600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    width: '100%',
    backgroundColor: theme.brand600,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionButtonDisabled: {
    opacity: 0.6,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.gray600,
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.gray600,
  },
});
