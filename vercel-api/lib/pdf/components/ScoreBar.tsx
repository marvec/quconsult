import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, spacing, fontSize, fontFamily } from '../tokens';

const styles = StyleSheet.create({
  row: { marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontFamily: fontFamily.sans, fontSize: fontSize.body, color: colors.ink },
  score: { fontFamily: fontFamily.serif, fontSize: fontSize.body, color: colors.ink },
  track: { marginTop: 4, height: 4, backgroundColor: colors.border, borderRadius: 1 },
  fill: { height: '100%', backgroundColor: colors.amber, borderRadius: 1 },
});

export interface ScoreBarProps {
  label: string;
  score: number;
}

export function ScoreBar({ label, score }: ScoreBarProps) {
  const clamped = Math.max(1, Math.min(100, score));
  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.score}>{score}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
    </View>
  );
}
