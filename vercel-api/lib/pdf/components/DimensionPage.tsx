import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, spacing, fontSize, fontFamily } from '../tokens';

const styles = StyleSheet.create({
  page: { backgroundColor: colors.bg, padding: spacing.xxl, fontFamily: fontFamily.sans },
  brand: { fontFamily: fontFamily.serif, fontSize: 12, color: colors.inkMuted, marginBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `0.5pt solid ${colors.border}`, paddingBottom: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { fontFamily: fontFamily.serif, fontSize: fontSize.h2, color: colors.ink, textTransform: 'uppercase', letterSpacing: 1.5 },
  sectionScore: { fontFamily: fontFamily.serif, fontSize: fontSize.scoreNum, color: colors.amber },
  body: { fontFamily: fontFamily.sans, fontSize: fontSize.body, color: colors.ink, lineHeight: 1.55 },
  pageNum: { position: 'absolute', bottom: spacing.xl, right: spacing.xxl, fontFamily: fontFamily.sans, fontSize: fontSize.label, color: colors.inkSoft },
});

export interface DimensionPageProps {
  pageNumber: number;
  sections: Array<{ label: string; score: number; body: string }>;
}

export function DimensionPage({ pageNumber, sections }: DimensionPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.brand}>QuConsult</Text>
      {sections.map((s) => (
        <View key={s.label} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{s.label}</Text>
            <Text style={styles.sectionScore}>{s.score} / 100</Text>
          </View>
          <Text style={styles.body}>{s.body}</Text>
        </View>
      ))}
      <Text style={styles.pageNum}>QuConsult {pageNumber}</Text>
    </Page>
  );
}
