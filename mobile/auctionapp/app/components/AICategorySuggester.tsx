import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import { api } from '../../src/api';

interface CategorySuggestion {
  category: string;
  confidence: number;
  matchedKeywords?: string[];
}

interface Props {
  title: string;
  description: string;
  currentCategory: string;
  onCategorySelect: (categoryName: string) => void;
}

export const AICategorySuggester: React.FC<Props> = ({
  title,
  description,
  currentCategory,
  onCategorySelect,
}) => {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState('');

  const getSuggestions = async () => {
    if (!title || title.trim().length < 3) {
      Alert.alert('Анхааруулга', 'Бүтээгдэхүүний нэр оруулна уу (3 тэмдэгтээс дээш)');
      return;
    }

    setLoading(true);
    setError('');
    setShowSuggestions(false);

    try {
      const response = await api.post('/api/product/suggest-category', {
        title,
        description: description || '',
        useAI: false, // Set to true if you have OPENAI_API_KEY configured
      });

      if (response.data.success) {
        setSuggestions(response.data.data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Категори санал болгоход алдаа гарлаа';
      setError(errorMsg);
      Alert.alert('Алдаа', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = (category: string) => {
    onCategorySelect(category);
    setShowSuggestions(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return theme.success600;
    if (confidence >= 40) return theme.warning600;
    return theme.danger600;
  };

  const getConfidenceBgColor = (confidence: number) => {
    if (confidence >= 70) return theme.success100;
    if (confidence >= 40) return theme.warning100;
    return theme.danger100;
  };

  return (
    <View style={styles.container}>
      {/* Suggest Button */}
      <TouchableOpacity
        style={[styles.suggestButton, loading && styles.suggestButtonDisabled]}
        onPress={getSuggestions}
        disabled={loading || !title}
      >
        {loading ? (
          <>
            <ActivityIndicator size="small" color={theme.white} style={{ marginRight: 8 }} />
            <Text style={styles.suggestButtonText}>Шинжилж байна...</Text>
          </>
        ) : (
          <>
            <Ionicons name="sparkles" size={18} color={theme.white} style={{ marginRight: 8 }} />
            <Text style={styles.suggestButtonText}>AI Категори санал болгох</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.helperText}>
        AI нь таны бичсэн нэр, тайлбараас хамаарч хамгийн тохиромжтой категорийг санал болгох болно
      </Text>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={16} color={theme.warning600} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <View style={styles.suggestionsHeader}>
            <Ionicons name="stars" size={20} color={theme.brand600} />
            <Text style={styles.suggestionsTitle}>Санал болгож буй категориуд</Text>
          </View>

          {suggestions.map((suggestion, index) => {
            const isSelected = suggestion.category === currentCategory;
            const confidenceColor = getConfidenceColor(suggestion.confidence);
            const confidenceBg = getConfidenceBgColor(suggestion.confidence);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.suggestionCard,
                  isSelected && styles.suggestionCardSelected,
                ]}
                onPress={() => handleSelectCategory(suggestion.category)}
              >
                <View style={styles.suggestionHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {index === 0 && <Ionicons name="star" size={16} color={theme.warning600} />}
                      <Text style={styles.suggestionCategory}>{suggestion.category}</Text>
                    </View>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={24} color={theme.success600} />}
                </View>

                {/* Confidence Bar */}
                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceLabel}>Итгэлтэй байдал</Text>
                  <Text style={styles.confidenceValue}>{Math.round(suggestion.confidence)}%</Text>
                </View>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceBarFill,
                      {
                        width: `${suggestion.confidence}%`,
                        backgroundColor: confidenceColor,
                      },
                    ]}
                  />
                </View>

                {/* Matched Keywords */}
                {suggestion.matchedKeywords && suggestion.matchedKeywords.length > 0 && (
                  <View style={styles.keywordsContainer}>
                    <Text style={styles.keywordsLabel}>Тохирсон түлхүүр үгс:</Text>
                    <View style={styles.keywordsList}>
                      {suggestion.matchedKeywords.slice(0, 4).map((keyword, kIndex) => (
                        <View key={kIndex} style={styles.keywordBadge}>
                          <Text style={styles.keywordText}>{keyword}</Text>
                        </View>
                      ))}
                      {suggestion.matchedKeywords.length > 4 && (
                        <View style={styles.keywordBadge}>
                          <Text style={styles.keywordText}>+{suggestion.matchedKeywords.length - 4}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Select Button */}
                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    isSelected && styles.selectButtonSelected,
                  ]}
                  onPress={() => handleSelectCategory(suggestion.category)}
                >
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'arrow-forward-circle'}
                    size={18}
                    color={isSelected ? theme.white : theme.brand600}
                  />
                  <Text style={[
                    styles.selectButtonText,
                    isSelected && styles.selectButtonTextSelected,
                  ]}>
                    {isSelected ? 'Сонгосон' : 'Сонгох'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}

          {/* Manual Selection Note */}
          <View style={styles.manualNote}>
            <Ionicons name="information-circle" size={16} color={theme.gray600} />
            <Text style={styles.manualNoteText}>
              Хэрэв санал болгож буй категори таны хүссэнтэй таарахгүй бол гараар сонгох боломжтой.
            </Text>
          </View>
        </View>
      )}

      {/* No Suggestions */}
      {showSuggestions && suggestions.length === 0 && (
        <View style={styles.noSuggestionsContainer}>
          <Ionicons name="information-circle" size={20} color={theme.info600} />
          <Text style={styles.noSuggestionsText}>
            Тохирох категори олдсонгүй. Гараар сонгоно уу.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  suggestButton: {
    backgroundColor: theme.brand600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  suggestButtonDisabled: {
    opacity: 0.6,
  },
  suggestButtonText: {
    color: theme.white,
    fontSize: 15,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: theme.gray600,
    lineHeight: 16,
    marginBottom: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.warning100,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: theme.warning800,
  },
  suggestionsContainer: {
    backgroundColor: theme.brand50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.brand200,
    padding: 12,
    marginTop: 12,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.brand700,
  },
  suggestionCard: {
    backgroundColor: theme.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.gray200,
  },
  suggestionCardSelected: {
    borderColor: theme.success600,
    borderWidth: 2,
    backgroundColor: theme.success50,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  suggestionCategory: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.gray900,
  },
  confidenceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  confidenceLabel: {
    fontSize: 12,
    color: theme.gray600,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.gray900,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: theme.gray200,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  keywordsContainer: {
    marginBottom: 12,
  },
  keywordsLabel: {
    fontSize: 11,
    color: theme.gray600,
    marginBottom: 6,
  },
  keywordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  keywordBadge: {
    backgroundColor: theme.gray200,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  keywordText: {
    fontSize: 10,
    color: theme.gray700,
    fontWeight: '600',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.brand600,
  },
  selectButtonSelected: {
    backgroundColor: theme.success600,
    borderColor: theme.success600,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.brand600,
  },
  selectButtonTextSelected: {
    color: theme.white,
  },
  manualNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: theme.gray100,
    borderRadius: 8,
  },
  manualNoteText: {
    flex: 1,
    fontSize: 12,
    color: theme.gray700,
    lineHeight: 16,
  },
  noSuggestionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme.info100,
    borderRadius: 8,
    marginTop: 12,
  },
  noSuggestionsText: {
    flex: 1,
    fontSize: 13,
    color: theme.info700,
  },
});
