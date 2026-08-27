import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { CertificateOutput } from '@repo/contracts';

/** DejaVu Sans — full Latin + Cyrillic coverage in one file (needed for the ru-locale certificate text), served via jsDelivr from the `dejavu-fonts-ttf` npm package. */
Font.register({
  family: 'DejaVuSans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf/ttf/DejaVuSans.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: { fontFamily: 'DejaVuSans', padding: 0, backgroundColor: '#f8fafc' },
  border: { flex: 1, margin: 24, border: '3pt solid #1d4ed8', padding: 36, display: 'flex', flexDirection: 'column' },
  innerBorder: { flex: 1, border: '1pt solid #93c5fd', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  brand: { fontSize: 12, color: '#1d4ed8', fontWeight: 'bold', letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#0f172a', letterSpacing: 4, marginBottom: 6 },
  subtitle: { fontSize: 11, color: '#64748b', marginBottom: 28 },
  bodyText: { fontSize: 11, color: '#334155', marginBottom: 10, textAlign: 'center' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  specialtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 26 },
  specialty: { fontSize: 13, color: '#1d4ed8', fontWeight: 'bold' },
  level: { fontSize: 11, color: '#0f172a', backgroundColor: '#fde68a', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 10 },
  metaRow: { flexDirection: 'row', gap: 36, marginBottom: 26 },
  metaBlock: { alignItems: 'center' },
  metaLabel: { fontSize: 9, color: '#94a3b8', marginBottom: 2 },
  metaValue: { fontSize: 12, color: '#0f172a', fontWeight: 'bold' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 'auto' },
  qr: { width: 70, height: 70 },
  certId: { fontSize: 9, color: '#94a3b8' },
});

export interface CertificateDocumentLabels {
  brand: string;
  title: string;
  subtitle: string;
  bodyText: string;
  specialtyLabel: string;
  scoreLabel: string;
  dateLabel: string;
  idLabel: string;
  levelLabel: string;
}

interface CertificateDocumentProps {
  certificate: CertificateOutput;
  specialtyName: string;
  levelLabel: string;
  qrDataUrl: string;
  labels: CertificateDocumentLabels;
  issuedAtFormatted: string;
}

export function CertificateDocument({ certificate, specialtyName, levelLabel, qrDataUrl, labels, issuedAtFormatted }: CertificateDocumentProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <View style={styles.innerBorder}>
            <Text style={styles.brand}>{labels.brand}</Text>
            <Text style={styles.title}>{labels.title}</Text>
            <Text style={styles.subtitle}>{labels.subtitle}</Text>

            <Text style={styles.bodyText}>{labels.bodyText}</Text>
            <Text style={styles.name}>{certificate.userFullName}</Text>

            <View style={styles.specialtyRow}>
              <Text style={styles.specialty}>{specialtyName}</Text>
              <Text style={styles.level}>{levelLabel}</Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>{labels.scoreLabel}</Text>
                <Text style={styles.metaValue}>{certificate.score}%</Text>
              </View>
              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>{labels.dateLabel}</Text>
                <Text style={styles.metaValue}>{issuedAtFormatted}</Text>
              </View>
              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>{labels.idLabel}</Text>
                <Text style={styles.metaValue}>{certificate.certificateId}</Text>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.certId}>{certificate.certificateId}</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={qrDataUrl} style={styles.qr} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
