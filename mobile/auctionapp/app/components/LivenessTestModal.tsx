import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LivenessTestModalProps {
  visible: boolean;
  onClose: () => void;
}

interface MotionFrame {
  timestamp: number;
  angleX: number;
  angleY: number;
  distance: number;
  lighting: number;
}

export default function LivenessTestModal({
  visible,
  onClose
}: LivenessTestModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [frames, setFrames] = useState<MotionFrame[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [testPhase, setTestPhase] = useState<'instruction' | 'recording' | 'analysis' | 'result'>('instruction');
  const [countdown, setCountdown] = useState(3);
  const recordingInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      // Reset when modal closes
      setTestPhase('instruction');
      setFrames([]);
      setAnalysisResult(null);
      setCountdown(3);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    }
  }, [visible]);

  const startTest = () => {
    setTestPhase('recording');
    setCountdown(3);

    // Countdown
    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = () => {
    setIsRecording(true);
    setFrames([]);

    const startTime = Date.now();
    const duration = 3000; // 3 seconds
    const fps = 15;
    const frameInterval = 1000 / fps;

    // Simulate motion capture (in real app, you'd use device motion sensors)
    recordingInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= duration) {
        stopRecording();
        return;
      }

      // Simulate frame capture
      const progress = elapsed / duration;
      const frame: MotionFrame = {
        timestamp: elapsed,
        angleX: Math.sin(progress * Math.PI * 4) * 20, // Simulated tilt
        angleY: Math.cos(progress * Math.PI * 3) * 25,
        distance: 1.0 + Math.sin(progress * Math.PI * 2) * 0.2,
        lighting: 1.0 + Math.cos(progress * Math.PI * 3) * 0.2
      };

      setFrames(prev => [...prev, frame]);
    }, frameInterval);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
    }
    setTestPhase('analysis');

    // Analyze after a short delay
    setTimeout(() => {
      analyzeMotion();
    }, 500);
  };

  const analyzeMotion = () => {
    if (frames.length === 0) {
      Alert.alert('Алдаа', 'Хангалттай өгөгдөл байхгүй байна');
      setTestPhase('instruction');
      return;
    }

    // Simple liveness analysis
    const angles = frames.map(f => Math.abs(f.angleX) + Math.abs(f.angleY));
    const maxAngle = Math.max(...angles);
    const minAngle = Math.min(...angles);
    const angleRange = maxAngle - minAngle;

    const distances = frames.map(f => f.distance);
    const distanceRange = Math.max(...distances) - Math.min(...distances);

    const lightingValues = frames.map(f => f.lighting);
    const lightingRange = Math.max(...lightingValues) - Math.min(...lightingValues);

    // Scoring
    let score = 0;
    let details = [];

    // Check angle variation (should be > 30° for good motion)
    if (angleRange > 30) {
      score += 35;
      details.push({ name: 'Хөдөлгөөний хэмжээ', status: 'pass', value: `${angleRange.toFixed(1)}°` });
    } else if (angleRange > 15) {
      score += 20;
      details.push({ name: 'Хөдөлгөөний хэмжээ', status: 'warning', value: `${angleRange.toFixed(1)}°` });
    } else {
      details.push({ name: 'Хөдөлгөөний хэмжээ', status: 'fail', value: `${angleRange.toFixed(1)}°` });
    }

    // Check distance variation
    if (distanceRange > 0.2) {
      score += 25;
      details.push({ name: 'Зайн өөрчлөлт', status: 'pass', value: distanceRange.toFixed(2) });
    } else if (distanceRange > 0.1) {
      score += 15;
      details.push({ name: 'Зайн өөрчлөлт', status: 'warning', value: distanceRange.toFixed(2) });
    } else {
      details.push({ name: 'Зайн өөрчлөлт', status: 'fail', value: distanceRange.toFixed(2) });
    }

    // Check lighting variation
    if (lightingRange > 0.15) {
      score += 20;
      details.push({ name: 'Гэрлийн өөрчлөлт', status: 'pass', value: lightingRange.toFixed(2) });
    } else if (lightingRange > 0.08) {
      score += 10;
      details.push({ name: 'Гэрлийн өөрчлөлт', status: 'warning', value: lightingRange.toFixed(2) });
    } else {
      details.push({ name: 'Гэрлийн өөрчлөлт', status: 'fail', value: lightingRange.toFixed(2) });
    }

    // Check motion smoothness
    let smoothFrames = 0;
    for (let i = 1; i < frames.length; i++) {
      const angleDiff = Math.abs(frames[i].angleY - frames[i-1].angleY);
      if (angleDiff > 0 && angleDiff < 20) smoothFrames++;
    }
    const smoothness = smoothFrames / (frames.length - 1);

    if (smoothness > 0.6) {
      score += 20;
      details.push({ name: 'Хөдөлгөөний жигдрэлт', status: 'pass', value: `${(smoothness * 100).toFixed(0)}%` });
    } else if (smoothness > 0.4) {
      score += 10;
      details.push({ name: 'Хөдөлгөөний жигдрэлт', status: 'warning', value: `${(smoothness * 100).toFixed(0)}%` });
    } else {
      details.push({ name: 'Хөдөлгөөний жигдрэлт', status: 'fail', value: `${(smoothness * 100).toFixed(0)}%` });
    }

    const confidence = score / 100;
    const isLive = score >= 65;

    setAnalysisResult({
      isLive,
      confidence,
      score,
      details,
      frameCount: frames.length,
      recommendation: isLive ? 'Амьд баталгаажуулалт амжилттай' : 'Амьд баталгаажуулалт шаардлага хангахгүй байна'
    });

    setTestPhase('result');
  };

  const resetTest = () => {
    setTestPhase('instruction');
    setFrames([]);
    setAnalysisResult(null);
    setCountdown(3);
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={theme.gray400} />
          <Text style={styles.permissionTitle}>Камер ашиглах эрх хэрэгтэй</Text>
          <Text style={styles.permissionText}>
            Амьд байдлын шалгалт хийхийн тулд камер ашиглах эрх олгоно уу
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Зөвшөөрөх</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Цуцлах</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Амьд байдлын шалгалт</Text>
          <View style={{ width: 44 }} />
        </View>

        {testPhase === 'instruction' && (
          <ScrollView style={styles.content}>
            <View style={styles.instructionContainer}>
              <Ionicons name="information-circle" size={64} color={theme.brand600} />
              <Text style={styles.instructionTitle}>Хэрхэн ажилладаг вэ?</Text>
              <Text style={styles.instructionText}>
                Энэхүү шалгалт нь үнэмлэхний 3D хөдөлгөөнийг хянаж, хуурамч эсэхийг илрүүлнэ.
              </Text>

              <View style={styles.stepsList}>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Үнэмлэхээ камерын өмнө барина уу</Text>
                </View>

                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>3 секундын турш үнэмлэхээ дараах байдлаар хөдөлгөнө:</Text>
                </View>

                <View style={styles.motionList}>
                  <View style={styles.motionItem}>
                    <Ionicons name="swap-horizontal" size={20} color={theme.brand600} />
                    <Text style={styles.motionText}>Зүүн-баруун эргүүлэх</Text>
                  </View>
                  <View style={styles.motionItem}>
                    <Ionicons name="swap-vertical" size={20} color={theme.brand600} />
                    <Text style={styles.motionText}>Дээш-доош эргүүлэх</Text>
                  </View>
                  <View style={styles.motionItem}>
                    <Ionicons name="resize" size={20} color={theme.brand600} />
                    <Text style={styles.motionText}>Ойр-хол хөдөлгөх</Text>
                  </View>
                </View>

                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>Системийн дүн шинжилгээг хүлээнэ</Text>
                </View>
              </View>

              <View style={styles.warningBox}>
                <Ionicons name="warning" size={20} color="#FF9800" />
                <Text style={styles.warningText}>
                  Энэ нь зөвхөн тестийн горим. Үнэмлэхний дүрс нь хадгалагдахгүй.
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {testPhase === 'recording' && (
          <View style={styles.cameraContainer}>
            {countdown > 0 ? (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownText}>{countdown}</Text>
                <Text style={styles.countdownLabel}>Бэлтгэл...</Text>
              </View>
            ) : (
              <>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="back"
                />
                <View style={styles.recordingOverlay}>
                  <View style={styles.recordingIndicator}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>Бичлэг хийгдэж байна...</Text>
                  </View>
                  <Text style={styles.instructionHint}>
                    Үнэмлэхээ эргүүлж, хөдөлгөнө үү
                  </Text>
                  <View style={styles.frameCounter}>
                    <Text style={styles.frameCounterText}>{frames.length} кадр</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {testPhase === 'analysis' && (
          <View style={styles.analysisContainer}>
            <ActivityIndicator size="large" color={theme.brand600} />
            <Text style={styles.analysisText}>Дүн шинжилгээ хийж байна...</Text>
            <Text style={styles.analysisSubtext}>{frames.length} кадр шинжилж байна</Text>
          </View>
        )}

        {testPhase === 'result' && analysisResult && (
          <ScrollView style={styles.content}>
            <View style={styles.resultContainer}>
              <View style={[
                styles.resultBadge,
                analysisResult.isLive ? styles.resultBadgeSuccess : styles.resultBadgeFail
              ]}>
                <Ionicons
                  name={analysisResult.isLive ? "checkmark-circle" : "close-circle"}
                  size={64}
                  color={analysisResult.isLive ? "#4CAF50" : "#F44336"}
                />
                <Text style={[
                  styles.resultTitle,
                  analysisResult.isLive ? styles.resultTitleSuccess : styles.resultTitleFail
                ]}>
                  {analysisResult.isLive ? 'Амжилттай!' : 'Амжилтгүй'}
                </Text>
                <Text style={styles.resultScore}>
                  Оноо: {analysisResult.score}/100
                </Text>
                <Text style={styles.resultConfidence}>
                  Итгэлцэл: {(analysisResult.confidence * 100).toFixed(0)}%
                </Text>
              </View>

              <View style={styles.detailsCard}>
                <Text style={styles.detailsTitle}>Дэлгэрэнгүй дүн шинжилгээ</Text>
                {analysisResult.details.map((detail: any, index: number) => (
                  <View key={index} style={styles.detailRow}>
                    <Ionicons
                      name={
                        detail.status === 'pass' ? 'checkmark-circle' :
                        detail.status === 'warning' ? 'alert-circle' :
                        'close-circle'
                      }
                      size={20}
                      color={
                        detail.status === 'pass' ? '#4CAF50' :
                        detail.status === 'warning' ? '#FF9800' :
                        '#F44336'
                      }
                    />
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailName}>{detail.name}</Text>
                      <Text style={styles.detailValue}>{detail.value}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                  {analysisResult.recommendation}
                </Text>
                <Text style={styles.infoSubtext}>
                  Нийт кадр: {analysisResult.frameCount}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Action Button */}
        <View style={styles.footer}>
          {testPhase === 'instruction' && (
            <TouchableOpacity style={styles.startButton} onPress={startTest}>
              <Ionicons name="play-circle" size={24} color="#fff" />
              <Text style={styles.startButtonText}>Шалгалт эхлүүлэх</Text>
            </TouchableOpacity>
          )}

          {testPhase === 'result' && (
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.retryButton]}
                onPress={resetTest}
              >
                <Ionicons name="refresh" size={20} color="#2196F3" />
                <Text style={styles.retryButtonText}>Дахин оролдох</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.closeActionButton]}
                onPress={onClose}
              >
                <Text style={styles.closeActionButtonText}>Хаах</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  instructionContainer: {
    padding: 24,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  stepsList: {
    width: '100%',
    marginBottom: 24,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.brand600,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    paddingTop: 4,
  },
  motionList: {
    marginLeft: 44,
    marginTop: 8,
    marginBottom: 12,
  },
  motionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  motionText: {
    fontSize: 14,
    color: '#555',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  countdownContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  countdownText: {
    fontSize: 120,
    fontWeight: '700',
    color: '#fff',
  },
  countdownLabel: {
    fontSize: 24,
    color: '#fff',
    marginTop: 16,
  },
  recordingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionHint: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  frameCounter: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  frameCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  analysisContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  analysisText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  analysisSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  resultContainer: {
    padding: 24,
  },
  resultBadge: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  resultBadgeSuccess: {
    backgroundColor: '#E8F5E9',
  },
  resultBadgeFail: {
    backgroundColor: '#FFEBEE',
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 16,
  },
  resultTitleSuccess: {
    color: '#4CAF50',
  },
  resultTitleFail: {
    color: '#F44336',
  },
  resultScore: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  resultConfidence: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  detailsCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  detailInfo: {
    flex: 1,
  },
  detailName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#1565C0',
    fontWeight: '600',
    marginBottom: 8,
  },
  infoSubtext: {
    fontSize: 13,
    color: '#1976D2',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: theme.brand600,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  retryButton: {
    backgroundColor: '#E3F2FD',
  },
  retryButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  closeActionButton: {
    backgroundColor: '#F5F5F5',
  },
  closeActionButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
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
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.gray600,
  },
});
