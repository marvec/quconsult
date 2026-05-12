import { Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import { colors, spacing, fontSize, fontFamily } from '../tokens';

const styles = StyleSheet.create({
  page: { backgroundColor: colors.bg, padding: spacing.xxl, fontFamily: fontFamily.sans },
  brand: { fontFamily: fontFamily.serif, fontSize: 12, color: colors.inkMuted, marginBottom: spacing.xl },
  title: { fontFamily: fontFamily.serif, fontSize: fontSize.h2, color: colors.ink, textTransform: 'uppercase', letterSpacing: 1.5, paddingBottom: spacing.sm, borderBottom: `0.5pt solid ${colors.border}` },
  step: { marginTop: spacing.lg, flexDirection: 'row' },
  stepNum: { fontFamily: fontFamily.serif, fontSize: fontSize.h2, color: colors.amber, width: 32 },
  stepBody: { flex: 1, fontFamily: fontFamily.sans, fontSize: fontSize.body, color: colors.ink, lineHeight: 1.55 },
  disclaimer: { marginTop: spacing.xxl, fontFamily: fontFamily.sans, fontSize: fontSize.label, color: colors.inkMuted, lineHeight: 1.55, fontStyle: 'italic' },
  ctaWrap: { marginTop: spacing.xl, alignItems: 'flex-start' },
  cta: { backgroundColor: colors.amber, color: colors.bg, fontFamily: fontFamily.sans, fontSize: fontSize.body, paddingTop: spacing.md, paddingBottom: spacing.md, paddingLeft: spacing.lg, paddingRight: spacing.lg, textDecoration: 'none', borderRadius: 2 },
  ctaUrl: { marginTop: spacing.sm, fontFamily: fontFamily.sans, fontSize: fontSize.label, color: colors.inkSoft },
  pageNum: { position: 'absolute', bottom: spacing.xl, right: spacing.xxl, fontFamily: fontFamily.sans, fontSize: fontSize.label, color: colors.inkSoft },
});

export interface NextStepsPageProps {
  pageNumber: number;
  steps: string[]; // length 3
}

export function NextStepsPage({ pageNumber, steps }: NextStepsPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.brand}>QuConsult</Text>
      <Text style={styles.title}>Co dělat jako první</Text>

      {steps.map((step, i) => (
        <View key={i} style={styles.step}>
          <Text style={styles.stepNum}>{i + 1}.</Text>
          <Text style={styles.stepBody}>{step}</Text>
        </View>
      ))}

      <Text style={styles.disclaimer}>
        Tento report je orientační. Skóre vychází z odpovědí ve formuláři. Pro konkrétní use-case doporučujeme bezplatnou 45min konzultaci.
      </Text>

      <View style={styles.ctaWrap}>
        <Link src="https://quconsult.cz/kontakt" style={styles.cta}>
          Domluvit konzultaci  →
        </Link>
        <Text style={styles.ctaUrl}>quconsult.cz/kontakt</Text>
      </View>

      <Text style={styles.pageNum}>QuConsult {pageNumber}</Text>
    </Page>
  );
}
