import { describe, it, expect } from 'vitest';
import { selectCards } from './select.js';
import type { Card } from './types.js';
import type { ScoreResult } from '../scoring.js';

const score: ScoreResult = {
  total: 65,
  dimensions: { data: 70, lide: 60, strategie: 55, provoz: 80 },
  breakdown: {
    data: { kvalita: 35, kde: 15, reporting: 20 },
    lide: { vedeni: 25, postoj: 22, kapacita: 13 },
    strategie: { cil: 25, horizont: 20, rozpocet: 10 },
    provoz: { erp: 35, velikost: 30, obor: 15 },
  },
};

const odpovedi = {
  'data-kvalita': 'Použitelná',
  velikost: '50–150',
};

function card(id: string, dim: 'data' | 'lide' | 'strategie' | 'provoz' | 'icp', priority: number, weight: 'must' | 'may', triggers: any[]): Card {
  return {
    frontmatter: { id, dimension: dim, priority, weight, triggers },
    body: `body of ${id}`,
    filepath: `${id}.md`,
  };
}

describe('selectCards', () => {
  it('filters out cards whose triggers do not match', () => {
    const all: Card[] = [
      card('match', 'data', 5, 'must', [{ field: 'data-kvalita', equals: 'Použitelná' }]),
      card('nomatch', 'data', 5, 'must', [{ field: 'data-kvalita', equals: 'Vynikající' }]),
    ];
    const result = selectCards(odpovedi, score, all);
    expect(result.map((c) => c.frontmatter.id)).toEqual(['match']);
  });

  it('always includes "must" cards regardless of priority', () => {
    const all: Card[] = [
      card('low-must', 'data', 1, 'must', [{ field: 'data-kvalita', equals: 'Použitelná' }]),
      card('high-may', 'data', 9, 'may', [{ field: 'data-kvalita', equals: 'Použitelná' }]),
    ];
    const result = selectCards(odpovedi, score, all);
    expect(result.map((c) => c.frontmatter.id).sort()).toEqual(['high-may', 'low-must']);
  });

  it('caps "may" cards at 3 per dimension when no "must" cards', () => {
    const all: Card[] = Array.from({ length: 5 }, (_, i) =>
      card(`may-${i}`, 'data', 10 - i, 'may', [{ field: 'data-kvalita', equals: 'Použitelná' }]),
    );
    const result = selectCards(odpovedi, score, all);
    expect(result).toHaveLength(3);
    expect(result.map((c) => c.frontmatter.id)).toEqual(['may-0', 'may-1', 'may-2']);
  });

  it('reduces "may" slots when "must" cards present', () => {
    const all: Card[] = [
      card('must-a', 'data', 5, 'must', [{ field: 'data-kvalita', equals: 'Použitelná' }]),
      card('must-b', 'data', 5, 'must', [{ field: 'data-kvalita', equals: 'Použitelná' }]),
      card('may-1', 'data', 9, 'may', [{ field: 'data-kvalita', equals: 'Použitelná' }]),
      card('may-2', 'data', 8, 'may', [{ field: 'data-kvalita', equals: 'Použitelná' }]),
    ];
    const result = selectCards(odpovedi, score, all);
    expect(result.map((c) => c.frontmatter.id).sort()).toEqual(['may-1', 'must-a', 'must-b']);
  });

  it('hard caps total at 15 across all dimensions', () => {
    const all: Card[] = [];
    for (const dim of ['data', 'lide', 'strategie', 'provoz', 'icp'] as const) {
      for (let i = 0; i < 5; i++) {
        all.push(card(`${dim}-${i}`, dim, 10 - i, 'must', []));
      }
    }
    const result = selectCards(odpovedi, score, all);
    expect(result).toHaveLength(15);
  });
});
