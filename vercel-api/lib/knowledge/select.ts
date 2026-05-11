import type { Card } from './types';
import type { ScoreResult } from '../scoring';
import { evalTriggers } from './triggers';

type AnyOdpovedi = Record<string, unknown>;
const DIMS = ['data', 'lide', 'strategie', 'provoz', 'icp'] as const;
const PER_DIM_CAP = 3;
const TOTAL_CAP = 15;

export function selectCards(odpovedi: AnyOdpovedi, score: ScoreResult, allCards: Card[]): Card[] {
  const triggered = allCards.filter((c) => evalTriggers(c.frontmatter.triggers, odpovedi, score));

  const selected: Card[] = [];
  for (const dim of DIMS) {
    const inDim = triggered
      .filter((c) => c.frontmatter.dimension === dim)
      .sort((a, b) => b.frontmatter.priority - a.frontmatter.priority);
    const must = inDim.filter((c) => c.frontmatter.weight === 'must');
    const maySlots = Math.max(0, PER_DIM_CAP - must.length);
    const may = inDim.filter((c) => c.frontmatter.weight === 'may').slice(0, maySlots);
    selected.push(...must, ...may);
  }
  return selected.slice(0, TOTAL_CAP);
}
