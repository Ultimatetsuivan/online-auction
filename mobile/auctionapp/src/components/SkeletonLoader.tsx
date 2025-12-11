import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import theme from '../../app/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.gray200,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      <SkeletonLoader width="100%" height={200} borderRadius={0} />
      <View style={styles.content}>
        <SkeletonLoader width="80%" height={20} style={styles.title} />
        <SkeletonLoader width="60%" height={16} style={styles.subtitle} />
        <View style={styles.priceRow}>
          <SkeletonLoader width={100} height={24} />
          <SkeletonLoader width={60} height={16} />
        </View>
        <SkeletonLoader width="100%" height={44} borderRadius={12} style={styles.button} />
      </View>
    </View>
  );
};

export const ProductDetailSkeleton: React.FC = () => {
  return (
    <View style={styles.detailContainer}>
      <SkeletonLoader width="100%" height={300} borderRadius={0} />
      <View style={styles.detailContent}>
        <SkeletonLoader width="90%" height={28} style={styles.marginBottom} />
        <SkeletonLoader width="70%" height={20} style={styles.marginBottom} />
        <SkeletonLoader width="100%" height={60} borderRadius={12} style={styles.marginBottom} />
        <SkeletonLoader width="100%" height={16} style={styles.marginBottom} />
        <SkeletonLoader width="100%" height={16} style={styles.marginBottom} />
        <SkeletonLoader width="80%" height={16} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: theme.gray50,
  },
  detailContent: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  marginBottom: {
    marginBottom: 12,
  },
});

export default SkeletonLoader;


