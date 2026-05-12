import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, spacing, fontSize, fontFamily } from '../tokens';
import { BigScore } from './BigScore';
import { ScoreBar } from './ScoreBar';
import type { ScoreResult } from '../../scoring';

const styles = StyleSheet.create({
  page: { backgroundColor: colors.bg, padding: spacing.xxl, fontFamily: fontFamily.sans },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  brand: { fontFamily: fontFamily.serif, fontSize: 14, color: colors.ink, fontWeight: 'bold' },
  date: { fontFamily: fontFamily.sans, fontSize: fontSize.label, color: colors.inkMuted },
  title: { marginTop: spacing.xxl, fontFamily: fontFamily.serif, fontSize: fontSize.h1, color: colors.ink },
  firma: { marginTop: spacing.sm, fontFamily: fontFamily.sans, fontSize: fontSize.bodyLg, color: colors.inkMuted },
  scoreBlock: { marginTop: spacing.xxl, alignItems: 'center' },
  summary: { marginTop: spacing.xl, fontFamily: fontFamily.serif, fontSize: fontSize.bodyLg, color: colors.ink, textAlign: 'center', lineHeight: 1.5 },
  divider: { marginTop: spacing.xxl, marginBottom: spacing.lg, borderBottom: `0.5pt solid ${colors.border}` },
  dimsLabel: { fontFamily: fontFamily.sans, fontSize: fontSize.label, color: colors.amber, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.md },
  footer: { position: 'absolute', bottom: spacing.xxl, left: spacing.xxl, right: spacing.xxl, fontFamily: fontFamily.sans, fontSize: fontSize.label, color: colors.inkSoft, textAlign: 'right' },
});

const DIM_LABELS: Record<string, string> = {
  data: 'Data',
  lide: 'Lidé',
  strategie: 'Strategie',
  provoz: 'Provoz',
};

export interface CoverPageProps {
  firma: string;
  date: string;        // already-formatted "10. května 2026"
  score: ScoreResult;
  oneLineSummary: string;
}

export function CoverPage({ firma, date, score, oneLineSummary }: CoverPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.brand}>QuConsult</Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      <Text style={styles.title}>AI Readiness Assessment</Text>
      <Text style={styles.firma}>pro {firma}</Text>

      <View style={styles.scoreBlock}>
        <BigScore score={score.total} />
        <Text style={styles.summary}>{oneLineSummary}</Text>
      </View>

      <View style={styles.divider} />
      <Text style={styles.dimsLabel}>4 dimenze</Text>
      {(['data', 'lide', 'strategie', 'provoz'] as const).map((dim) => (
        <ScoreBar key={dim} label={DIM_LABELS[dim] ?? dim} score={score.dimensions[dim]} />
      ))}

      <Text style={styles.footer}>QuConsult — Praktické AI poradenství</Text>
    </Page>
  );
}
