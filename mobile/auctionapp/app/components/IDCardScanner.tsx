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
  side?: 'front' | 'back';
}

export default function IDCardScanner({
  visible,
  onClose,
  onCapture,
  title = 'Үнэмлэх скан хийх',
  instruction = 'Үнэмлэхээ хүрээнд байрлуулна уу',
  side = 'front',
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
                {/* Ghost ID card layout overlay */}
                {side === 'front' ? (
                  <View style={styles.ghostOverlay} pointerEvents="none">

                    {/* ── HEADER: Flag + Titles ── */}
                    <View style={styles.ghostHeader}>
                      <View style={styles.ghostFlag}>
                        <View style={[styles.ghostFlagStripe, { backgroundColor: 'rgba(27,79,190,0.75)' }]} />
                        <View style={[styles.ghostFlagStripe, { backgroundColor: 'rgba(200,55,45,0.75)' }]} />
                        <View style={[styles.ghostFlagStripe, { backgroundColor: 'rgba(27,79,190,0.75)' }]} />
                        <View style={styles.ghostSoyombo} />
                      </View>
                      <View style={styles.ghostTitleBlock}>
                        <Text style={styles.ghostTitleMain} numberOfLines={1}>МОНГОЛ УЛСЫН ИРГЭНИЙ ҮНЭМЛЭХ</Text>
                        <Text style={styles.ghostTitleSub} numberOfLines={1}>CITIZEN IDENTITY CARD OF MONGOLIA</Text>
                      </View>
                    </View>

                    {/* ── BODY: [Photo | Fields] [Decorative right strip] ── */}
                    <View style={styles.ghostBody}>

                      {/* Left+Center: Photo and Fields stacked */}
                      <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
                        {/* Photo portrait */}
                        <View style={styles.ghostPhoto}>
                          <Ionicons name="person" size={20} color="rgba(255,255,255,0.35)" />
                        </View>

                        {/* Fields */}
                        <View style={styles.ghostFields}>
                          {[
                            { mn: 'Овог', en: 'Family name' },
                            { mn: 'Эцэг/эх/-ийн нэр', en: 'Surname' },
                            { mn: 'Нэр', en: 'Given name' },
                            { mn: 'Хүйс', en: 'Sex' },
                            { mn: 'Төрсөн он, сар, өдөр', en: 'Date of birth' },
                          ].map((f, i) => (
                            <View key={i} style={styles.ghostFieldGroup}>
                              <Text style={styles.ghostFieldLabel}>{f.mn}  <Text style={styles.ghostFieldLabelEn}>{f.en}</Text></Text>
                              <View style={styles.ghostFieldLine} />
                            </View>
                          ))}
                          {/* Civil ID — under Date of birth */}
                          <View style={[styles.ghostFieldGroup, { marginTop: 2, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 2 }]}>
                            <Text style={styles.ghostFooterLabel}>Иргэний бүртгэлийн дугаар  <Text style={styles.ghostFieldLabelEn}>Civil identification number</Text></Text>
                            <View style={styles.ghostFooterLine} />
                          </View>
                        </View>
                      </View>

                      {/* Right: 3 rectangular grid blocks */}
                      <View style={styles.ghostDecoBlocks}>
                        {[0,1,2].map(block => (
                          <View key={block} style={styles.ghostDecoBlock}>
                            {Array.from({ length: 5 }).map((_, row) => (
                              <View key={row} style={styles.ghostDecoBlockRow}>
                                {Array.from({ length: 3 }).map((_, col) => (
                                  <View key={col} style={[styles.ghostDecoBlockCell, {
                                    opacity: (row + col) % 2 === 0 ? 0.7 : 0.3
                                  }]} />
                                ))}
                              </View>
                            ))}
                          </View>
                        ))}
                      </View>
                    </View>

                  </View>

                ) : (

                  <View style={styles.ghostOverlay} pointerEvents="none">

                    {/* ── HEADER: Emblem + Issuing authority ── */}
                    <View style={styles.ghostHeader}>
                      <View style={styles.ghostEmblem} />
                      <View style={styles.ghostTitleBlock}>
                        <Text style={styles.ghostFieldLabel}>Олгосон байгуулллага  <Text style={styles.ghostFieldLabelEn}>Issuing authority</Text></Text>
                        <Text style={styles.ghostTitleMain} numberOfLines={1}>Улсын бүртгэлийн ерөнхий газар</Text>
                        <Text style={styles.ghostFieldLabelEn} numberOfLines={1}>The General Authority for State Registration</Text>
                      </View>
                    </View>

                    {/* ── BODY ── */}
                    <View style={styles.ghostBody}>

                      {/* Chip (large, gold) */}
                      <View style={styles.ghostChipArea}>
                        <View style={styles.ghostChip} />
                      </View>

                      {/* Center: Date fields + MNG watermark */}
                      <View style={styles.ghostBackCenter}>
                        <View style={styles.ghostFieldGroup}>
                          <Text style={styles.ghostFieldLabel}>Олгосон он, сар, өдөр  <Text style={styles.ghostFieldLabelEn}>Date of issue</Text></Text>
                          <View style={styles.ghostFieldLine} />
                        </View>
                        <View style={[styles.ghostFieldGroup, { marginTop: 6 }]}>
                          <Text style={styles.ghostFieldLabel}>Хүчинтэй хугацаа  <Text style={styles.ghostFieldLabelEn}>Date of expiry</Text></Text>
                          <View style={styles.ghostFieldLine} />
                        </View>
                      </View>

                      {/* Right: 3 rectangular grid blocks (barcode-like) */}
                      <View style={styles.ghostDecoBlocks}>
                        {[0,1,2].map(block => (
                          <View key={block} style={styles.ghostDecoBlock}>
                            {Array.from({ length: 6 }).map((_, row) => (
                              <View key={row} style={styles.ghostDecoBlockRow}>
                                {Array.from({ length: 3 }).map((_, col) => (
                                  <View key={col} style={[styles.ghostDecoBlockCell, {
                                    opacity: (row + col) % 2 === 0 ? 0.75 : 0.3
                                  }]} />
                                ))}
                              </View>
                            ))}
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* ── FOOTER: QR (bottom-left) + small person photo ── */}
                    <View style={styles.ghostBackFooter}>
                      <View style={styles.ghostQR}>
                        <View style={styles.ghostQRInner}>
                          <View style={[styles.ghostQRCorner, { top: 0, left: 0 }]} />
                          <View style={[styles.ghostQRCorner, { top: 0, right: 0 }]} />
                          <View style={[styles.ghostQRCorner, { bottom: 0, left: 0 }]} />
                        </View>
                      </View>
                      {/* Small person photo + MNG below */}
                      <View style={styles.ghostBackFooterCenter}>
                        <View style={styles.ghostSmallPhoto}>
                          <Ionicons name="person" size={14} color="rgba(255,255,255,0.5)" />
                        </View>
                        <Text style={styles.ghostMNGLarge}>MNG</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Corner markers on top of ghost */}
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
    overflow: 'hidden',
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

  // ── Ghost overlay styles ──
  ghostOverlay: {
    position: 'absolute',
    top: 8, left: 8, right: 8, bottom: 8,
    flexDirection: 'column',
    gap: 4,
  },
  ghostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 34,
  },
  ghostFlag: {
    width: 48, height: 32,
    flexDirection: 'row',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  ghostFlagStripe: { flex: 1 },
  ghostSoyombo: {
    position: 'absolute',
    left: 4, top: 5,
    width: 8, height: 22,
    backgroundColor: 'rgba(255,215,0,0.7)',
    borderRadius: 1,
  },
  ghostTitleBlock: { flex: 1, justifyContent: 'center', gap: 2 },
  ghostTitleMain: {
    fontSize: 7,
    fontWeight: '800',
    color: 'rgba(26,58,140,0.9)',
    letterSpacing: 0.1,
  },
  ghostTitleSub: { fontSize: 5.5, color: 'rgba(26,58,140,0.7)' },
  ghostBody: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  ghostPhoto: {
    width: '24%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostFields: {
    flex: 1,
    justifyContent: 'space-around',
  },
  ghostFieldGroup: { gap: 1 },
  ghostFieldLabel: {
    fontSize: 5.5,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  ghostFieldLabelEn: {
    fontSize: 5,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '400',
  },
  ghostFieldLine: {
    height: 2,
    width: '88%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 1,
    marginTop: 2,
  },
  ghostDateValue: {
    fontSize: 7,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  // Right decorative blocks (3 rectangular grid sections, matches real card)
  ghostDecoBlocks: {
    width: 34,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: 2,
    gap: 3,
  },
  ghostDecoBlock: {
    flex: 1,
    backgroundColor: 'rgba(26,58,140,0.2)',
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(26,58,140,0.5)',
    padding: 2,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  ghostDecoBlockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 1,
  },
  ghostDecoBlockCell: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(26,58,140,0.85)',
    borderRadius: 0.5,
  },
  // Back: far-left 2 large circles
  ghostLeftCircles: {
    width: 22,
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 4,
  },
  ghostLargeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  // Back: chip area
  ghostChipArea: {
    width: 38,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  // MNG watermark in center lower body
  ghostMNGWatermark: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  },
  ghostMNGLarge: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 3,
  },
  // Footer (front) — full width below body
  ghostFooter: {
    height: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 3,
    gap: 2,
  },
  ghostFooterLabel: { fontSize: 5, color: 'rgba(255,255,255,0.6)' },
  ghostFooterLine: {
    height: 2, width: '40%',
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 1,
  },
  ghostChip: {
    width: 36, height: 28,
    backgroundColor: 'rgba(200,162,80,0.65)',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(200,162,80,0.9)',
  },
  // Back: center (date fields + MNG watermark)
  ghostBackCenter: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  // Back: footer row (QR + small photo + MNG)
  ghostBackFooter: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  ghostQR: {
    width: 42, height: 42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 3,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  ghostQRInner: {
    flex: 1,
    position: 'relative',
  },
  ghostQRCorner: {
    position: 'absolute',
    width: 10, height: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  ghostBackFooterCenter: {
    alignItems: 'center',
    gap: 3,
  },
  ghostSmallPhoto: {
    width: 34, height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostMNG: {
    fontSize: 6.5,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.5,
  },
  ghostEmblem: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});
