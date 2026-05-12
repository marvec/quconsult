import { describe, it, expect, beforeEach } from 'vitest';
import { canSpend, recordSpend, resetCostCap } from './cost-cap.js';

describe('cost-cap', () => {
  beforeEach(() => {
    resetCostCap();
    process.env.OPENAI_DAILY_USD_CAP = '0.10';
  });

  it('allows spending under cap', () => {
    expect(canSpend()).toBe(true);
    recordSpend(0.05);
    expect(canSpend()).toBe(true);
  });

  it('blocks spending over cap', () => {
    recordSpend(0.05);
    recordSpend(0.05);
    expect(canSpend()).toBe(false);
  });

  it('uses default 5 USD when env var missing', () => {
    delete process.env.OPENAI_DAILY_USD_CAP;
    resetCostCap();
    recordSpend(4.99);
    expect(canSpend()).toBe(true);
    recordSpend(0.02);
    expect(canSpend()).toBe(false);
  });

  it('resets daily (manual trigger)', () => {
    recordSpend(0.50);
    expect(canSpend()).toBe(false);
    resetCostCap();
    expect(canSpend()).toBe(true);
  });
});
