import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCards } from './load.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('real KB cards smoke', () => {
  it('loads data dimension cards without errors', async () => {
    const cards = await loadCards(__dirname, ['data']);
    expect(cards.length).toBe(7);
    expect(new Set(cards.map((c) => c.frontmatter.id)).size).toBe(7);
  });

  it('loads lide dimension cards', async () => {
    const cards = await loadCards(__dirname, ['lide']);
    expect(cards.length).toBe(5);
    expect(new Set(cards.map((c) => c.frontmatter.id)).size).toBe(5);
  });

  it('loads strategie dimension cards', async () => {
    const cards = await loadCards(__dirname, ['strategie']);
    expect(cards.length).toBe(5);
    expect(new Set(cards.map((c) => c.frontmatter.id)).size).toBe(5);
  });

  it('loads provoz dimension cards', async () => {
    const cards = await loadCards(__dirname, ['provoz']);
    expect(cards.length).toBe(4);
    expect(new Set(cards.map((c) => c.frontmatter.id)).size).toBe(4);
  });

  it('loads icp dimension cards', async () => {
    const cards = await loadCards(__dirname, ['icp']);
    expect(cards.length).toBe(3);
    expect(new Set(cards.map((c) => c.frontmatter.id)).size).toBe(3);
  });

  it('loads all dimensions together (24 cards total)', async () => {
    const cards = await loadCards(__dirname);
    expect(cards.length).toBe(24);
    expect(new Set(cards.map((c) => c.frontmatter.id)).size).toBe(24);
  });
});
