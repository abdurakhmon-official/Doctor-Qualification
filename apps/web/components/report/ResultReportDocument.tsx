import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { PDF_FONT_FAMILY } from '@/components/pdf/fonts';

const styles = StyleSheet.create({
  page: { fontFamily: PDF_FONT_FAMILY, fontSize: 10, color: '#0f172a', paddingTop: 36, paddingBottom: 56, paddingHorizontal: 40 },
  brand: { fontSize: 9, color: '#1d4ed8', fontWeight: 'bold', letterSpacing: 1.5 },
  title: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  subtitle: { fontSize: 11, color: '#475569', marginTop: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1pt solid #e2e8f0', paddingBottom: 14 },
  scoreBox: { alignItems: 'flex-end' },
  score: { fontSize: 28, fontWeight: 'bold', color: '#1d4ed8' },
  level: { fontSize: 10, color: '#334155', marginTop: 2 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 12 },
  metaLabel: { fontSize: 8, color: '#64748b' },
  metaValue: { fontSize: 10, fontWeight: 'bold', marginTop: 1 },
  status: { marginTop: 12, fontSize: 10, color: '#334155' },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  tableHeader: { flexDirection: 'row', borderBottom: '1pt solid #cbd5e1', paddingBottom: 4, color: '#64748b', fontSize: 8 },
  tableRow: { flexDirection: 'row', borderBottom: '0.5pt solid #e2e8f0', paddingVertical: 4 },
  colTopic: { flex: 1 },
  colCount: { width: 70, textAlign: 'right' },
  colPercent: { width: 50, textAlign: 'right' },
  barTrack: { height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, marginTop: 3 },
  barFill: { height: 4, backgroundColor: '#1d4ed8', borderRadius: 2 },
  question: { paddingVertical: 6, borderBottom: '0.5pt solid #e2e8f0' },
  questionText: { fontSize: 10 },
  answer: { fontSize: 9, color: '#475569', marginTop: 2 },
  tags: { fontSize: 8, color: '#64748b', marginTop: 2 },
  empty: { fontSize: 10, color: '#475569' },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: '#94a3b8' },
});

// interfaces

export interface ReportTopicRow {
  name: string;
  correct: number;
  total: number;
}

export interface ReportQuestionRow {
  number: number;
  text: string;
  /** Already localized, e.g. "B) Isolated T-wave inversion" or "not answered". */
  answer: string;
  tags: string;
}

export interface ResultReportProps {
  brand: string;
  title: string;
  subtitle: string;
  scoreLabel: string;
  levelLabel: string;
  meta: { label: string; value: string }[];
  statusLine: string;
  topicsTitle: string;
  topicHeaders: { topic: string; correct: string; percent: string };
  topics: ReportTopicRow[];
  reviewTitle: string;
  reviewEmpty: string;
  /** Only the questions answered wrong or left blank. */
  review: ReportQuestionRow[];
  footerNote: string;
  generatedLabel: string;
  pageLabel: (page: number, total: number) => string;
}

export function ResultReportDocument(props: ResultReportProps) {
  return (
    <Document title={props.title}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={styles.brand}>{props.brand.toUpperCase()}</Text>
            <Text style={styles.title}>{props.title}</Text>
            <Text style={styles.subtitle}>{props.subtitle}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.score}>{props.scoreLabel}</Text>
            <Text style={styles.level}>{props.levelLabel}</Text>
          </View>
        </View>

        <View style={styles.meta}>
          {props.meta.map((item) => (
            <View key={item.label}>
              <Text style={styles.metaLabel}>{item.label}</Text>
              <Text style={styles.metaValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.status}>{props.statusLine}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{props.topicsTitle}</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colTopic}>{props.topicHeaders.topic}</Text>
            <Text style={styles.colCount}>{props.topicHeaders.correct}</Text>
            <Text style={styles.colPercent}>{props.topicHeaders.percent}</Text>
          </View>
          {props.topics.map((topic) => {
            const percent = topic.total ? Math.round((topic.correct / topic.total) * 100) : 0;
            return (
              <View key={topic.name} style={styles.tableRow} wrap={false}>
                <View style={styles.colTopic}>
                  <Text>{topic.name}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${percent}%` }]} />
                  </View>
                </View>
                <Text style={styles.colCount}>
                  {topic.correct}/{topic.total}
                </Text>
                <Text style={styles.colPercent}>{percent}%</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{props.reviewTitle}</Text>
          {props.review.length === 0 ? (
            <Text style={styles.empty}>{props.reviewEmpty}</Text>
          ) : (
            props.review.map((question) => (
              <View key={question.number} style={styles.question} wrap={false}>
                <Text style={styles.questionText}>
                  {question.number}. {question.text}
                </Text>
                <Text style={styles.answer}>{question.answer}</Text>
                <Text style={styles.tags}>{question.tags}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={{ maxWidth: 380 }}>
            {props.footerNote} {props.generatedLabel}
          </Text>
          <Text render={({ pageNumber, totalPages }) => props.pageLabel(pageNumber, totalPages)} />
        </View>
      </Page>
    </Document>
  );
}
