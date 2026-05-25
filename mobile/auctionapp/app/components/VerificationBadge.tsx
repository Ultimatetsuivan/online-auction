import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';

interface VerificationBadgeProps {
  verified: boolean;
  badgeType?: 'basic' | 'premium' | 'luxury';
  size?: 'small' | 'medium' | 'large';
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  verified,
  badgeType = 'basic',
  size = 'small'
}) => {
  const { isDarkMode } = useTheme();

  if (!verified) return null;

  const getBadgeColor = () => {
    // In dark mode, slightly adjust colors for better visibility
    switch (badgeType) {
      case 'luxury':
        return isDarkMode ? '#FFC107' : '#FFD700'; // Gold (slightly dimmed in dark)
      case 'premium':
        return isDarkMode ? '#9E9E9E' : '#C0C0C0'; // Silver (slightly dimmed in dark)
      case 'basic':
      default:
        return isDarkMode ? '#66BB6A' : '#4CAF50'; // Green (brighter in dark)
    }
  };

  const getBadgeText = () => {
    switch (badgeType) {
      case 'luxury':
        return 'Хамгаалагдсан';
      case 'premium':
        return 'Баталгаат';
      case 'basic':
      default:
        return 'Баталгаажсан';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'large':
        return 20;
      case 'medium':
        return 16;
      case 'small':
      default:
        return 12;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'large':
        return 14;
      case 'medium':
        return 12;
      case 'small':
      default:
        return 10;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBadgeColor() }]}>
      <Ionicons name="shield-checkmark" size={getIconSize()} color="#fff" />
      <Text style={[styles.text, { fontSize: getTextSize() }]}>
        {getBadgeText()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default VerificationBadge;
