import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api';
import theme from '../theme';

const SECTIONS = [
  {
    key: 'eula',
    title: 'EULA',
    titleFull: 'EULA',
  },
  {
    key: 'privacy',
    title: 'Нууцлалын бодлого',
    titleFull: 'Нууцлалын\nбодлого',
  },
  {
    key: 'terms',
    title: 'Үйлчилгээний нөхцөл',
    titleFull: 'Үйлчилгээний\nнөхцөл',
  },
];

export default function EULAAcceptanceScreen() {
  const [activeSection, setActiveSection] = useState(0);
  const [eula, setEula] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [currentStep, setCurrentStep] = useState(3);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchEULA();
    loadCurrentStep();
  }, []);

  const loadCurrentStep = async () => {
    try {
      const step = await AsyncStorage.getItem('currentRegistrationStep');
      if (step) {
        setCurrentStep(parseInt(step));
      }
    } catch (error) {
      console.error('Error loading current step:', error);
    }
  };

  const fetchEULA = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/legal/eula/current');
      setEula(response.data?.eula || null);
    } catch (error) {
      console.error('Error fetching EULA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    setScrolledToBottom(isAtBottom);
  };

  const handleAccept = async () => {
    if (!scrolledToBottom) {
      return; // Button is disabled
    }

    if (activeSection < SECTIONS.length - 1) {
      // Move to next section
      setActiveSection(activeSection + 1);
      setScrolledToBottom(false); // Reset scroll state for next section
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      // Complete EULA acceptance
      try {
        setAccepting(true);
        await AsyncStorage.setItem('eulaAccepted', 'true');
        await AsyncStorage.setItem('eulaAcceptedAt', new Date().toISOString());
        await AsyncStorage.setItem('currentRegistrationStep', '4'); // Move to step 4

        // Return to register screen
        router.back();
      } catch (error) {
        console.error('Error saving EULA acceptance:', error);
      } finally {
        setAccepting(false);
      }
    }
  };

  const renderProgressIndicators = () => {
    // Calculate EULA progress: 0-33% (section 0), 33-66% (section 1), 66-100% (section 2)
    const eulaProgress = ((activeSection + 1) / SECTIONS.length) * 100;
    const isEulaComplete = activeSection === SECTIONS.length - 1 && scrolledToBottom;

    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((stepNumber, index) => (
          <React.Fragment key={stepNumber}>
            <View style={styles.progressStepWrapper}>
              {stepNumber === 3 && currentStep === 3 ? (
                // Step 3 (EULA) - show partial fill while on EULA screen
                <View style={styles.progressStep}>
                  <View
                    style={[
                      styles.progressStepPartial,
                      { height: `${isEulaComplete ? 100 : eulaProgress}%` }
                    ]}
                  />
                  <Text style={[
                    styles.progressText,
                    (isEulaComplete || eulaProgress > 50) && styles.progressTextActive
                  ]}>
                    {stepNumber}
                  </Text>
                </View>
              ) : (
                // Steps 1, 2, 3 (when complete), 4 - normal fill
                <View
                  style={[
                    styles.progressStep,
                    stepNumber < 3 && styles.progressStepActive, // Steps 1 & 2 are orange
                    stepNumber === 3 && currentStep > 3 && styles.progressStepActive, // Step 3 orange when complete
                    stepNumber === 4 && currentStep > 4 && styles.progressStepActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.progressText,
                      (stepNumber < 3 ||
                       (stepNumber === 3 && currentStep > 3) ||
                       (stepNumber === 4 && currentStep > 4)) && styles.progressTextActive,
                    ]}
                  >
                    {stepNumber}
                  </Text>
                </View>
              )}
            </View>
            {index < 3 && (
              <View
                style={[
                  styles.progressLine,
                  stepNumber < 3 && styles.progressLineActive, // Line after steps 1 & 2
                  stepNumber === 3 && (isEulaComplete || currentStep > 3) && styles.progressLineActive,
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (!eula) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Үйлчилгээний нөхцөл байхгүй байна
          </Text>
        </View>
      );
    }

    // Content for each section
    const content = {
      eula: `1. Ерөнхий заалт

Энэхүү Эцсийн Хэрэглэгчийн Лицензийн Гэрээ (цаашид "Гэрээ" гэх) нь мобайл аппликейшн (цаашид "Програм" гэх)-ийг ашиглахтай холбогдон хэрэглэгч Та болон Компани хооронд байгуулсан хууль ёсны хүчинтэй гэрээ болно. Програмыг суулгах, ашиглах, эсвэл бүртгэл үүсгэснээр Та энэхүү Гэрээг бүрэн уншиж танилцан, хүлээн зөвшөөрсөнд тооцно.

2. Лицензийн эрх

Компани нь Таньд Програмыг хувийн, арилжааны бус зорилгоор ашиглах онцгой бус, шилжүүлж үл болох лиценз олгоно. Та дараах үйлдлийг хориглоно:

• Програмыг хуулбарлах, өөрчлөх, реверс инженерчлэл хийх
• Програмыг худалдах, түрээслэх, дамжуулах
• Аюулгүй байдлын хамгаалалтыг тойрч гарах оролдлого хийх

3. Програмын өмчлөлийн эрх

Програм болон түүний бүх код, дизайн, контент нь Компанийн оюуны өмч бөгөөд Та зөвхөн лицензийн хүрээнд ашиглах эрхтэй.

4. Хариуцлагаас татгалзах

Програм "өөрийн байдлаар" гэрээслэгдэнэ. Компани нь аливаа алдаа, тасалдал, өгөгдөл алдагдал, ашгийн алдагдалд хариуцлага хүлээхгүй.

5. Шинэчлэл ба өөрчлөлт

Компани нь Програмд шинэчлэлт хийх, функц нэмэх, хасах эрхтэй. Шинэчлэлт нь энэ Гэрээний дагуу тооцогдоно.

6. Гэрээг дуусгавар болгох

Та Гэрээний нөхцөлийг зөрчсөн тохиолдолд Компани таны лицензийг цуцлах эрхтэй. Цуцлагдсан тохиолдолд Та Програмыг ашиглахыг бүрэн зогсооно.

7. Хууль эрх зүй

Энэхүү Гэрээ нь Монгол Улсын хууль тогтоомжид захирагдана.`,

      privacy: `1. Зорилго

Энэхүү бодлого нь хэрэглэгчийн хувийн мэдээллийг хэрхэн цуглуулах, ашиглах, хадгалах, хамгаалах талаар тодорхойлох зорилготой.

2. Бид цуглуулах мэдээлэл

Апп нь дараах төрлийн хувийн мэдээллийг цуглуулж болно:

• Бүртгэлийн мэдээлэл (нэр, утас, имэйл)
• Танилцуулга болон дуудлага худалдаанд оролцсон түүх
• Төлбөрийн мэдээлэл (гуравдагч талын төлбөрийн үйлчилгээ ашиглан)
• Байршлын мэдээлэл (зөвшөөрсөн тохиолдолд)
• Апп ашиглалтын статистик

3. Мэдээллийг ашиглах зорилго

Бид таны мэдээллийг дараах үндсэн зорилгоор ашиглана:

• Дуудлага худалдааны системийг ажиллуулах
• Хэрэглэгчийн баталгаажуулалт
• Төлбөр, худалдаа, худалдан авалт баталгаажуулах
• Үйлчилгээний чанар сайжруулах
• Хууль ёсны шаардлага биелүүлэх

4. Мэдээллийг гуравдагч талд дамжуулах нөхцөл

Бид таны мэдээллийг дараах тохиолдолд хуваалцаж болно:

• Төлбөрийн үйлчилгээ үзүүлэгч байгууллага
• Хууль сахиулах байгууллагын албан шаардлага
• Логистик болон хүргэлтийн үйлчилгээ үзүүлэгч

Гэхдээ мэдээлэл дамжуулах тохиолдол бүрт зохих хамгаалалт, гэрээний дагуу ажиллана.

5. Хадгалалт ба хамгаалалт

• Мэдээллийг шифрлэлтийн хамгаалалттай серверт хадгална
• Боломжит халдлагын эрсдлээс сэргийлсэн техникийн хамгаалалт ашиглана
• Зөвхөн эрх бүхий ажилтнууд хандана

6. Хэрэглэгчийн эрх

Танд дараах эрхүүд байна:

• Өөрийн мэдээллийг харах, засах
• Мэдээлэл устгуулах хүсэлт гаргах
• Мэдээлэл цуглуулах зөвшөөрлөөс татгалзах
• Таны мэдээлэл хэрхэн ашиглагдаж буйг лавлах

7. Бодлогын өөрчлөлт

Бид бодлогоо шинэчлэх эрхтэй бөгөөд өөрчлөлтийн талаар апп болон вебээр мэдээлнэ.`,

      terms: `1. Ерөнхий нөхцөл

Энэхүү Үйлчилгээний Нөхцөл нь хэрэглэгч Та болон Компани хооронд үүсэх эрх, үүргийг тодорхойлно. Апп-ыг ашигласнаар Та эдгээр нөхцөлийг хүлээн зөвшөөрсөнд тооцно.

2. Хэрэглэгчийн үүрэг

• Бодит, үнэн зөв мэдээлэл өгөх
• Дуудлага худалдаанд шударгаар оролцох
• Хууль бус бараа бүтээгдэхүүн оруулахгүй байх
• Апп-ын системийг албаар эвдэх, халдах оролдлого хийхгүй байх

3. Дуудлага худалдааны журам

• Тавигдсан үнэ, хугацаанд нийцүүлэн оролцоно
• Хэрэглэгчийн хийсэн санал (bid) нь буцаах боломжгүй амлалт гэж үзнэ
• Худалдан авалтын дараах төлбөр, хүргэлт хэрэглэгчийн хариуцлагаар хийгдэнэ

4. Төлбөр тооцоо

• Төлбөрийг зөвхөн баталгаажсан аргаар хийнэ
• Төлбөр амжилттай болсны дараа захиалга хүчинтэйд тооцогдоно

5. Хариуцлага

Компани нь дараах зүйлд хариуцлага хүлээхгүй:

• Хэрэглэгчийн оруулсан мэдээллийн үнэн зөв байдал
• Хэрэглэгч хоорондын маргаан
• Сүлжээний доголдлоос үүдсэн тасалдал

6. Бараа буцаалт

Буцаалт болон солилцооны бодлого нь тухайн барааг оруулсан худалдаалагчийн нөхцөлөөр зохицуулагдана.

7. Бүртгэл цуцлах

Хэрэглэгч дараах тохиолдолд аккаунт хаагдаж болно:

• Худалдан авалтын дарамт тогтоох
• Худал санал өгөх
• Хууль бус бараа байрлуулах
• Бусдыг залилан мэхлэх

8. Хууль эрх зүй

Энэхүү гэрээ нь Монгол Улсын хуулиар зохицуулагдана.`,
    };

    const currentContent = content[SECTIONS[activeSection].key as keyof typeof content];

    return (
      <Text style={styles.contentText}>
        {currentContent}
      </Text>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.brand600} />
          <Text style={styles.loadingText}>
            Ачаалж байна...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Бүртгүүлэх</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Indicators */}
      {renderProgressIndicators()}

      {/* Content Container */}
      <View style={styles.contentWrapper}>
        {/* Section Title */}
        <Text style={styles.stepTitle}>
          {SECTIONS[activeSection].key === 'eula'
            ? 'EULA'
            : SECTIONS[activeSection].key === 'privacy'
            ? 'Нууцлалын бодлого'
            : 'Үйлчилгээний нөхцөл'}
        </Text>
        <Text style={styles.stepDescription}>
          Уншиж танилцаад доошоо гүйлгэнэ үү
        </Text>

        {/* Scrollable Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {renderContent()}
        </ScrollView>

        {/* Accept Button */}
        <TouchableOpacity
          style={[
            styles.acceptButton,
            !scrolledToBottom && styles.acceptButtonDisabled,
          ]}
          onPress={handleAccept}
          disabled={accepting || !scrolledToBottom}
        >
          {accepting ? (
            <ActivityIndicator color={theme.white} />
          ) : (
            <Text
              style={[
                styles.acceptButtonText,
                !scrolledToBottom && styles.acceptButtonTextDisabled,
              ]}
            >
              Зөвшөөрөх
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.gray900,
  },
  placeholder: {
    width: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.gray700,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 80,
  },
  progressStepWrapper: {
    alignItems: 'center',
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  progressStepActive: {
    backgroundColor: theme.brand600,
  },
  progressStepPartial: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.brand600,
    borderRadius: 20,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.gray500,
    zIndex: 2,
    position: 'relative',
  },
  progressTextActive: {
    color: theme.white,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: theme.gray200,
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: theme.brand600,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.gray900,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: theme.gray500,
    marginBottom: 24,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  contentText: {
    fontSize: 15,
    color: theme.gray900,
    lineHeight: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: theme.gray400,
  },
  acceptButton: {
    backgroundColor: theme.brand600,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  acceptButtonDisabled: {
    backgroundColor: theme.gray300,
    opacity: 0.6,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.white,
  },
  acceptButtonTextDisabled: {
    color: theme.gray600,
  },
});
