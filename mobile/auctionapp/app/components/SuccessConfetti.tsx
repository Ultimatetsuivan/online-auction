import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
const CONFETTI_COUNT = 50;

interface ConfettiPieceProps {
  delay: number;
  color: string;
  startX: number;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ delay, color, startX }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Fall down animation
    translateY.value = withDelay(
      delay,
      withTiming(height + 100, {
        duration: 3000 + Math.random() * 2000,
        easing: Easing.linear,
      })
    );

    // Sway left and right
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(30 - Math.random() * 60, { duration: 1000 }),
          withTiming(-30 + Math.random() * 60, { duration: 1000 })
        ),
        -1,
        true
      )
    );

    // Rotate
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, {
          duration: 1000 + Math.random() * 1000,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );

    // Fade out at the end
    opacity.value = withDelay(
      delay + 2500,
      withTiming(0, { duration: 1500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { rotate: `${rotate.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        { backgroundColor: color, left: startX },
        animatedStyle,
      ]}
    />
  );
};

interface SuccessConfettiProps {
  onComplete?: () => void;
}

export const SuccessConfetti: React.FC<SuccessConfettiProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: CONFETTI_COUNT }).map((_, index) => (
        <ConfettiPiece
          key={index}
          delay={index * 50}
          color={CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]}
          startX={Math.random() * width}
        />
      ))}
    </View>
  );
};

export default SuccessConfetti;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
