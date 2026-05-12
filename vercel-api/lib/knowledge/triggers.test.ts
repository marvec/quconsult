import { describe, it, expect } from 'vitest';
import { evalTrigger, evalTriggers } from './triggers.js';
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
  'data-kde': ['V ERP systému', 'V Excelu / Google Sheets'],
  velikost: '50–150',
};

describe('evalTrigger', () => {
  it('field+equals matches exact value', () => {
    expect(evalTrigger({ field: 'data-kvalita', equals: 'Použitelná' }, odpovedi, score)).toBe(true);
    expect(evalTrigger({ field: 'data-kvalita', equals: 'Roztříštěná' }, odpovedi, score)).toBe(false);
  });

  it('field+in matches membership', () => {
    expect(evalTrigger({ field: 'velikost', in: ['30–50', '50–150'] }, odpovedi, score)).toBe(true);
    expect(evalTrigger({ field: 'velikost', in: ['pod 30', '300+'] }, odpovedi, score)).toBe(false);
  });

  it('field+includes matches multi-select element', () => {
    expect(evalTrigger({ field: 'data-kde', includes: 'V ERP systému' }, odpovedi, score)).toBe(true);
    expect(evalTrigger({ field: 'data-kde', includes: 'Papírově nebo částečně papírově' }, odpovedi, score)).toBe(false);
  });

  it('dimension+scoreBand matches range (closed interval)', () => {
    expect(evalTrigger({ dimension: 'data', scoreBand: [60, 80] }, odpovedi, score)).toBe(true);
    expect(evalTrigger({ dimension: 'data', scoreBand: [70, 70] }, odpovedi, score)).toBe(true);
    expect(evalTrigger({ dimension: 'lide', scoreBand: [70, 100] }, odpovedi, score)).toBe(false);
  });

  it('total scoreBand matches total', () => {
    expect(evalTrigger({ scoreBand: [60, 70] }, odpovedi, score)).toBe(true);
    expect(evalTrigger({ scoreBand: [80, 100] }, odpovedi, score)).toBe(false);
  });
});

describe('evalTriggers (AND semantics)', () => {
  it('returns true only when all triggers match', () => {
    expect(evalTriggers(
      [{ field: 'data-kvalita', equals: 'Použitelná' }, { field: 'velikost', in: ['50–150'] }],
      odpovedi, score,
    )).toBe(true);
    expect(evalTriggers(
      [{ field: 'data-kvalita', equals: 'Použitelná' }, { field: 'velikost', equals: '300+' }],
      odpovedi, score,
    )).toBe(false);
  });

  it('returns true for empty trigger list (vacuously true)', () => {
    expect(evalTriggers([], odpovedi, score)).toBe(true);
  });
});
