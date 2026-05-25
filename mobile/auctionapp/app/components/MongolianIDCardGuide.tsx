import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

// Visual guide showing what the Mongolian ID card looks like
// Helps users understand what to photograph

interface Props {
  side: 'front' | 'back';
}

export default function MongolianIDCardGuide({ side }: Props) {
  if (side === 'front') {
    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          {/* Flag */}
          <View style={styles.flagContainer}>
            <View style={styles.flagBlue} />
            <View style={styles.flagRed} />
            <View style={styles.flagBlue} />
            <View style={styles.soyombo}>
              <Text style={styles.soyomboText}>☰</Text>
            </View>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.titleMn}>МОНГОЛ УЛСЫН ИРГЭНИЙ ҮНЭМЛЭХ</Text>
            <Text style={styles.titleEn}>CITIZEN IDENTITY CARD OF MONGOLIA</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Photo */}
          <View style={styles.photoBox}>
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>👤</Text>
            </View>
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Овог  Family name</Text>
              <View style={styles.fieldValue} />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Эцэг/эх/-ийн нэр  Surname</Text>
              <View style={styles.fieldValue} />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Нэр  Given name</Text>
              <View style={styles.fieldValue} />
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Хүйс  Sex</Text>
                <Text style={styles.fieldValueText}>Эрэгтэй / Male</Text>
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Төрсөн он, сар, өдөр  Date of birth</Text>
              <View style={styles.fieldValue} />
            </View>
          </View>

          {/* Barcode right side */}
          <View style={styles.barcodeRight}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.barcodeLine,
                  { width: i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1 },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Footer - ID number */}
        <View style={styles.footer}>
          <Text style={styles.idLabel}>Иргэний бүртгэлийн дугаар  Civil identification number</Text>
          <View style={styles.idValueRow} />
        </View>

        {/* Decorative watermark */}
        <View style={styles.watermark} pointerEvents="none">
          <Text style={styles.watermarkText}>✦</Text>
        </View>
      </View>
    );
  }

  // Back side
  return (
    <View style={styles.card}>
      {/* Issuing authority */}
      <View style={styles.backHeader}>
        <View style={styles.emblemBox}>
          <Text style={styles.emblemText}>🏛</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.backIssuingEn}>Олгосон байгуулллага  Issuing authority</Text>
          <Text style={styles.backIssuingMn}>Улсын бүртгэлийн ерөнхий газар</Text>
          <Text style={styles.backIssuingEn}>The General Authority for State Registration</Text>
        </View>
      </View>

      <View style={styles.backBody}>
        {/* Left: chip + dates */}
        <View style={{ flex: 1 }}>
          <View style={styles.chip}>
            <View style={styles.chipInner} />
            <View style={styles.chipLine} />
            <View style={styles.chipLine} />
          </View>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Олгосон он, сар, өдөр  Date of issue</Text>
            <View style={styles.dateValue} />
          </View>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Хүчинтэй хугацаа  Date of expiry</Text>
            <View style={styles.dateValue} />
          </View>
          {/* QR */}
          <View style={styles.qrBox}>
            <View style={styles.qrGrid}>
              {Array.from({ length: 9 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.qrCell,
                    (i === 0 || i === 2 || i === 6 || i === 8) && styles.qrCellDark,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.qrLabel}>QR</Text>
          </View>
        </View>

        {/* Right: fingerprint + MNG + barcode */}
        <View style={styles.backRight}>
          <View style={styles.fingerprint}>
            <Text style={styles.fingerprintText}>◉</Text>
          </View>
          <Text style={styles.mngText}>MNG</Text>
          <View style={styles.barcodeRight}>
            {Array.from({ length: 16 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.barcodeLine,
                  { width: i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1 },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const CARD_BG = '#f5e6c8';
const CARD_BORDER = '#c8a96e';
const BLUE = '#1a3a8c';
const GOLD = '#c8a250';
const FIELD_LINE = '#c8b090';

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    padding: 10,
    overflow: 'hidden',
    position: 'relative',
  },

  // --- FRONT ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  flagContainer: {
    flexDirection: 'row',
    width: 28,
    height: 18,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  flagBlue: { flex: 1, backgroundColor: '#1B4FBE' },
  flagRed: { flex: 1, backgroundColor: '#C8372D' },
  soyombo: {
    position: 'absolute',
    left: 1,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  soyomboText: { fontSize: 10, color: '#FFD700' },
  headerText: { flex: 1 },
  titleMn: { fontSize: 7, fontWeight: '800', color: BLUE, letterSpacing: 0.3 },
  titleEn: { fontSize: 5.5, color: BLUE, marginTop: 1 },

  body: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  photoBox: {
    width: 52,
  },
  photoPlaceholder: {
    width: 52,
    height: 68,
    backgroundColor: '#d4c4a0',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: { fontSize: 24 },

  fields: { flex: 1, gap: 4 },
  field: { gap: 1 },
  fieldRow: { flexDirection: 'row', gap: 8 },
  fieldLabel: { fontSize: 5.5, color: '#6b4c1e', fontWeight: '600' },
  fieldValue: {
    height: 1.5,
    backgroundColor: FIELD_LINE,
    borderRadius: 1,
    marginTop: 2,
    width: '85%',
  },
  fieldValueText: { fontSize: 7, color: '#333', fontWeight: '600' },

  barcodeRight: {
    flexDirection: 'column',
    gap: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  barcodeLine: {
    height: 2,
    backgroundColor: '#5a3e1b',
    borderRadius: 1,
  },

  footer: { borderTopWidth: 1, borderTopColor: CARD_BORDER, paddingTop: 6 },
  idLabel: { fontSize: 5.5, color: '#6b4c1e', fontWeight: '600', marginBottom: 3 },
  idValueRow: { height: 1.5, backgroundColor: FIELD_LINE, width: '60%', borderRadius: 1 },

  watermark: {
    position: 'absolute',
    right: 40,
    top: 20,
    opacity: 0.08,
  },
  watermarkText: { fontSize: 80, color: GOLD },

  // --- BACK ---
  backHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  emblemBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemText: { fontSize: 20 },
  backIssuingEn: { fontSize: 5.5, color: '#6b4c1e' },
  backIssuingMn: { fontSize: 7.5, fontWeight: '800', color: BLUE },

  backBody: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    width: 32,
    height: 24,
    backgroundColor: GOLD,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#a07830',
    marginBottom: 8,
    padding: 3,
    gap: 2,
  },
  chipInner: {
    width: 10,
    height: 10,
    backgroundColor: '#c8a250',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#a07830',
  },
  chipLine: {
    height: 1,
    backgroundColor: '#a07830',
    width: '80%',
  },
  dateBlock: { marginBottom: 6 },
  dateLabel: { fontSize: 5.5, color: '#6b4c1e', fontWeight: '600' },
  dateValue: { height: 1.5, backgroundColor: FIELD_LINE, width: '80%', borderRadius: 1, marginTop: 2 },

  qrBox: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qrGrid: {
    width: 24,
    height: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
  },
  qrCell: {
    width: 6,
    height: 6,
    backgroundColor: '#d4c4a0',
    borderRadius: 1,
  },
  qrCellDark: { backgroundColor: '#2a1a00' },
  qrLabel: { fontSize: 6, color: '#6b4c1e', fontWeight: '700' },

  backRight: {
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
  },
  fingerprint: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0cfa0',
    borderRadius: 4,
  },
  fingerprintText: { fontSize: 20, color: '#6b4c1e' },
  mngText: { fontSize: 8, fontWeight: '800', color: '#333', letterSpacing: 1 },
});
