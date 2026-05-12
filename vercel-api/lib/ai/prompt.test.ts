import { describe, it, expect } from 'vitest';
import { buildUserPrompt } from './prompt';
import type { Card } from '../knowledge/types';
import type { ScoreResult, Odpovedi } from '../scoring';

const score: ScoreResult = {
  total: 78,
  dimensions: { data: 80, lide: 65, strategie: 72, provoz: 95 },
  breakdown: {
    data: { kvalita: 35, kde: 25, reporting: 20 },
    lide: { vedeni: 25, postoj: 22, kapacita: 18 },
    strategie: { cil: 30, horizont: 28, rozpocet: 14 },
    provoz: { erp: 50, velikost: 30, obor: 15 },
  },
};

const cards: Card[] = [{
  frontmatter: { id: 'test-card', dimension: 'data', priority: 5, weight: 'must', triggers: [] },
  body: 'Insight text here.',
  filepath: 'test-card.md',
}];

describe('buildUserPrompt', () => {
  it('includes firma block', () => {
    const out = buildUserPrompt({
      firma: 'Acme s.r.o.', velikost: '50–150', obor: 'Výroba', erp: 'Pohoda', cinnost: 'Vyrábíme díly.',
      odpovedi: {} as Odpovedi, score, cards,
    });
    expect(out).toContain('Acme s.r.o.');
    expect(out).toContain('50–150');
    expect(out).toContain('Vyrábíme díly');
  });

  it('includes score breakdown', () => {
    const out = buildUserPrompt({
      firma: 'X', velikost: 'pod 30', obor: 'IT a software', erp: 'Vlastní řešení', cinnost: '',
      odpovedi: {} as Odpovedi, score, cards,
    });
    expect(out).toContain('Celkem: 78/100');
    expect(out).toContain('Data: 80/100');
  });

  it('lists cards with id and priority', () => {
    const out = buildUserPrompt({
      firma: 'X', velikost: 'pod 30', obor: 'IT a software', erp: 'Vlastní řešení', cinnost: '',
      odpovedi: {} as Odpovedi, score, cards,
    });
    expect(out).toContain('Card 1: test-card');
    expect(out).toContain('Insight text here.');
  });
});
