import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  if (!verified) return null;

  const getBadgeColor = () => {
    switch (badgeType) {
      case 'luxury':
        return '#FFD700'; // Gold
      case 'premium':
        return '#C0C0C0'; // Silver
      case 'basic':
      default:
        return '#4CAF50'; // Green
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
