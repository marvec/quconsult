import { describe, it, expect } from 'vitest';
import { slugify } from './slugify.js';

describe('slugify', () => {
  it('lowercases and replaces spaces with dashes', () => {
    expect(slugify('Acme Corp')).toBe('acme-corp');
  });

  it('strips Czech diakritika', () => {
    expect(slugify('Žluťoučký Kůň s.r.o.')).toBe('zlutoucky-kun-s-r-o');
  });

  it('collapses multiple dashes', () => {
    expect(slugify('Foo & Bar -- Baz')).toBe('foo-bar-baz');
  });

  it('strips leading and trailing dashes', () => {
    expect(slugify('---ACME---')).toBe('acme');
  });

  it('caps at 30 chars', () => {
    expect(slugify('a'.repeat(50)).length).toBeLessThanOrEqual(30);
  });

  it('returns "firma" for empty/whitespace input', () => {
    expect(slugify('')).toBe('firma');
    expect(slugify('   ')).toBe('firma');
  });

  it('handles full-name corner case', () => {
    expect(slugify('WellBe s.r.o. — IČ 05830931')).toBe('wellbe-s-r-o-ic-05830931');
  });
});
