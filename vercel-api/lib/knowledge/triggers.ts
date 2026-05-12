import type { Trigger } from './types.js';
import type { ScoreResult } from '../scoring.js';

type AnyOdpovedi = Record<string, unknown>;

export function evalTrigger(t: Trigger, odpovedi: AnyOdpovedi, score: ScoreResult): boolean {
  if ('equals' in t && 'field' in t) {
    return odpovedi[t.field] === t.equals;
  }
  if ('in' in t && 'field' in t) {
    return t.in.includes(odpovedi[t.field] as string);
  }
  if ('includes' in t && 'field' in t) {
    const val = odpovedi[t.field];
    return Array.isArray(val) && val.includes(t.includes);
  }
  if ('dimension' in t) {
    const v = score.dimensions[t.dimension];
    return v >= t.scoreBand[0] && v <= t.scoreBand[1];
  }
  if ('scoreBand' in t) {
    return score.total >= t.scoreBand[0] && score.total <= t.scoreBand[1];
  }
  return false;
}

export function evalTriggers(triggers: Trigger[], odpovedi: AnyOdpovedi, score: ScoreResult): boolean {
  return triggers.every((t) => evalTrigger(t, odpovedi, score));
}
