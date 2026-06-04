import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';

const CYRILLIC = [
  'А','Б','В','Г','Д','Е','Ё',
  'Ж','З','И','Й','К','Л','М',
  'Н','О','Ө','П','Р','С','Т',
  'У','Ү','Ф','Х','Ц','Ч','Ш',
  'Щ','Ъ','Ы','Ь','Э','Ю','Я',
];

interface Props {
  value: string;
  onChange: (val: string) => void;
  error?: string | null;
}

export function RegistrationNumberInput({ value = '', onChange, error }: Props) {
  const letter1 = value[0] || '';
  const letter2 = value[1] || '';
  const digits  = value.slice(2);

  const [activePicker, setActivePicker] = useState<'l1' | 'l2' | null>(null);
  const digitsRef = useRef<TextInput>(null);

  const emit = (l1: string, l2: string, d: string) => onChange(l1 + l2 + d);

  const handleLetterPick = (letter: string) => {
    if (activePicker === 'l1') {
      emit(letter, letter2, digits);
      setActivePicker('l2');
    } else {
      emit(letter1, letter, digits);
      setActivePicker(null);
      setTimeout(() => digitsRef.current?.focus(), 100);
    }
  };

  const handleDigits = (text: string) => {
    const d = text.replace(/\D/g, '').slice(0, 8);
    emit(letter1, letter2, d);
  };

  const borderColor = error ? '#ef4444' : '#e2e8f0';

  return (
    <View>
      {/* Input row: [Л1] [Л2] [00000000] */}
      <View style={styles.row}>
        {/* Letter 1 button */}
        <TouchableOpacity
          style={[
            styles.letterBtn,
            letter1 ? styles.letterBtnFilled : styles.letterBtnEmpty,
            activePicker === 'l1' && styles.letterBtnActive,
          ]}
          onPress={() => setActivePicker(activePicker === 'l1' ? null : 'l1')}
          activeOpacity={0.7}
        >
          <Text style={[styles.letterText, letter1 ? styles.letterTextFilled : styles.letterTextEmpty]}>
            {letter1 || '?'}
          </Text>
        </TouchableOpacity>

        {/* Letter 2 button */}
        <TouchableOpacity
          style={[
            styles.letterBtn,
            letter2 ? styles.letterBtnFilled : styles.letterBtnEmpty,
            activePicker === 'l2' && styles.letterBtnActive,
          ]}
          onPress={() => setActivePicker(activePicker === 'l2' ? null : 'l2')}
          activeOpacity={0.7}
        >
          <Text style={[styles.letterText, letter2 ? styles.letterTextFilled : styles.letterTextEmpty]}>
            {letter2 || '?'}
          </Text>
        </TouchableOpacity>

        {/* Digits input */}
        <TextInput
          ref={digitsRef}
          style={[styles.digitsInput, { borderColor }]}
          placeholder="Регистрийн дугаар"
          placeholderTextColor="#94a3b8"
          value={digits}
          onChangeText={handleDigits}
          keyboardType="number-pad"
          maxLength={8}
          returnKeyType="done"
        />
      </View>

      {/* Error */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Letter picker modal (bottom sheet style) */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActivePicker(null)}
      >
        <TouchableWithoutFeedback onPress={() => setActivePicker(null)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>
            {activePicker === 'l1' ? 'Эхний үсгийг сонгоно уу' : 'Хоёр дах үсгийг сонгоно уу'}
          </Text>

          <FlatList
            data={CYRILLIC}
            keyExtractor={(item) => item}
            numColumns={7}
            scrollEnabled={false}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => {
              const selected = activePicker === 'l1' ? item === letter1 : item === letter2;
              return (
                <TouchableOpacity
                  style={[styles.gridBtn, selected && styles.gridBtnSelected]}
                  onPress={() => handleLetterPick(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.gridBtnText, selected && styles.gridBtnTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  letterBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterBtnEmpty: {
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  letterBtnFilled: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  letterBtnActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  letterText: {
    fontSize: 20,
    fontWeight: '700',
  },
  letterTextEmpty: {
    color: '#94a3b8',
    fontSize: 14,
  },
  letterTextFilled: {
    color: '#fff',
  },
  digitsInput: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    letterSpacing: 2,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#ef4444',
  },
  // Modal / bottom sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 16,
  },
  grid: {
    alignItems: 'center',
  },
  gridBtn: {
    width: 44,
    height: 44,
    margin: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridBtnSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  gridBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  gridBtnTextSelected: {
    color: '#4F46E5',
  },
});
