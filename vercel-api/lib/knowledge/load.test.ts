import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCards } from './load.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, '__fixtures__');

describe('loadCards', () => {
  it('loads valid cards from data/ and lide/ subdirectories', async () => {
    const cards = await loadCards(fixturesDir, ['data', 'lide']);
    expect(cards).toHaveLength(2);
    const ids = cards.map((c) => c.frontmatter.id).sort();
    expect(ids).toEqual(['test-data-card', 'test-lide-card']);
  });

  it('parses frontmatter and body', async () => {
    const cards = await loadCards(fixturesDir, ['data']);
    const card = cards[0];
    expect(card?.frontmatter.dimension).toBe('data');
    expect(card?.frontmatter.priority).toBe(5);
    expect(card?.frontmatter.triggers).toHaveLength(1);
    expect(card?.body).toContain('roztříštěných datech');
  });

  it('throws on invalid frontmatter', async () => {
    await expect(loadCards(fixturesDir, ['_invalid'])).rejects.toThrow(/_invalid\/bad\.md/);
  });

  it('returns empty array if no cards present', async () => {
    const cards = await loadCards(fixturesDir, ['nonexistent_dir']);
    expect(cards).toEqual([]);
  });

  it('does not crash on full dimension list when some dirs are missing', async () => {
    const cards = await loadCards(fixturesDir, ['data', 'lide', 'strategie', 'provoz', 'icp']);
    expect(cards.length).toBe(2);
  });
});
