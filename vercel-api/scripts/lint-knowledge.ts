#!/usr/bin/env tsx
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCards } from '../lib/knowledge/load';

const ANGLICISMS = [
  'synergie', 'synergick', 'disruption', 'disruptiv', 'state-of-the-art',
  'leverage', 'leveraging', 'leverag', 'transformation', 'transformov',
  'unlock potential', 'next-gen', 'best-in-class', 'cutting-edge',
];

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const knowledgeDir = path.join(__dirname, '..', 'lib', 'knowledge');

  const cards = await loadCards(knowledgeDir);

  let failed = false;
  const seenIds = new Set<string>();

  for (const card of cards) {
    const { id } = card.frontmatter;
    if (seenIds.has(id)) {
      console.error(`  DUPLICATE ID: ${id} (${card.filepath})`);
      failed = true;
    }
    seenIds.add(id);

    const body = card.body.toLowerCase();
    for (const word of ANGLICISMS) {
      if (body.includes(word)) {
        console.error(`  ANGLICISM in ${card.filepath}: "${word}"`);
        failed = true;
      }
    }
  }

  if (failed) {
    console.error(`\nKB lint FAILED.`);
    process.exit(1);
  }
  console.log(`KB lint OK — ${cards.length} cards, ${seenIds.size} unique IDs.`);
}

main().catch((err) => {
  console.error('KB lint error:', err);
  process.exit(1);
});
