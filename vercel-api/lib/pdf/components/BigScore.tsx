import { View, Text, Svg, Circle, StyleSheet } from '@react-pdf/renderer';
import { colors, fontSize, fontFamily } from '../tokens.js';

const SIZE = 140;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const styles = StyleSheet.create({
  wrapper: { width: SIZE, height: SIZE, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  centerText: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.hero,
    color: colors.ink,
    lineHeight: 1,
  },
  outOf: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.label,
    color: colors.inkMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

export interface BigScoreProps {
  score: number;
}

export function BigScore({ score }: BigScoreProps) {
  const dashLength = (score / 100) * CIRCUMFERENCE;
  const accent = score >= 70 ? colors.amberDeep : score >= 40 ? colors.amber : colors.inkMuted;

  return (
    <View style={styles.wrapper}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.border}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={accent}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${dashLength} ${CIRCUMFERENCE}`}
          // @ts-expect-error: strokeDashoffset is valid SVG but missing from @react-pdf/renderer types
          strokeDashoffset={CIRCUMFERENCE / 4}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View style={styles.centerText}>
        <Text style={styles.number}>{score}</Text>
        <Text style={styles.outOf}>z 100</Text>
      </View>
    </View>
  );
}
