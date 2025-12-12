import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SavingStatus } from '../../src/hooks/useAutosaveMobile';
import { useTheme } from '../../src/contexts/ThemeContext';

interface DraftStatusBannerProps {
  status: SavingStatus;
  lastSaved?: number;
}

/**
 * Draft Status Banner Component (Mobile)
 *
 * Shows visual feedback when drafts are being saved
 * Appears at the top of the screen with smooth animations
 */
export const DraftStatusBanner: React.FC<DraftStatusBannerProps> = ({
  status,
  lastSaved,
}) => {
  const { themeColors } = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'idle') {
      // Hide banner
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Show banner
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [status]);

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: 'cloud-upload-outline' as const,
          text: 'Saving draft...',
          color: '#6B7280',
          backgroundColor: '#F3F4F6',
        };
      case 'saved':
        return {
          icon: 'checkmark-circle' as const,
          text: 'Draft saved',
          color: '#059669',
          backgroundColor: '#ECFDF5',
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          text: 'Save failed',
          color: '#DC2626',
          backgroundColor: '#FEF2F2',
        };
      default:
        return null;
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const seconds = Math.floor((Date.now() - lastSaved) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  const config = getStatusConfig();

  if (!config || status === 'idle') {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={config.icon} size={18} color={config.color} />
        <Text style={[styles.text, { color: config.color }]}>
          {config.text}
        </Text>
        {status === 'saved' && lastSaved && (
          <Text style={[styles.timestamp, { color: config.color }]}>
            ({formatLastSaved()})
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 1000,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '400',
    marginLeft: 4,
  },
});

export default DraftStatusBanner;
