import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Card } from '../knowledge/types.js';
import type { ScoreResult, Odpovedi } from '../scoring.js';

const systemDir = path.join(process.cwd(), 'lib', 'knowledge', '_system');

let cachedSystem: string | undefined;

export async function loadSystemPrompt(): Promise<string> {
  if (cachedSystem) return cachedSystem;
  const brandVoice = await readFile(path.join(systemDir, 'brand-voice.md'), 'utf-8');
  const outputFormat = await readFile(path.join(systemDir, 'output-format.md'), 'utf-8');
  cachedSystem = `${brandVoice}\n\n---\n\n${outputFormat}`;
  return cachedSystem;
}

export interface PromptInput {
  firma: string;
  velikost: string;
  obor: string;
  erp: string;
  cinnost: string;
  odpovedi: Odpovedi;
  score: ScoreResult;
  cards: Card[];
}

export function buildUserPrompt(p: PromptInput): string {
  const lines: string[] = [];

  lines.push('# Firma');
  lines.push(`- Jméno: ${p.firma}`);
  lines.push(`- Velikost: ${p.velikost}`);
  lines.push(`- Obor: ${p.obor}`);
  lines.push(`- ERP: ${p.erp}`);
  lines.push(`- Co dělají: ${p.cinnost || '—'}`);
  lines.push('');

  lines.push('# Score');
  lines.push(`- Celkem: ${p.score.total}/100`);
  lines.push(`- Data: ${p.score.dimensions.data}/100 (kvalita: ${p.score.breakdown.data.kvalita}/50, kde: ${p.score.breakdown.data.kde}/30, reporting: ${p.score.breakdown.data.reporting}/20)`);
  lines.push(`- Lidé: ${p.score.dimensions.lide}/100 (vedení: ${p.score.breakdown.lide.vedeni}/40, postoj: ${p.score.breakdown.lide.postoj}/35, kapacita: ${p.score.breakdown.lide.kapacita}/25)`);
  lines.push(`- Strategie: ${p.score.dimensions.strategie}/100 (cíl: ${p.score.breakdown.strategie.cil}/35, horizont: ${p.score.breakdown.strategie.horizont}/35, rozpočet: ${p.score.breakdown.strategie.rozpocet}/30)`);
  lines.push(`- Provoz: ${p.score.dimensions.provoz}/100 (ERP: ${p.score.breakdown.provoz.erp}/50, velikost: ${p.score.breakdown.provoz.velikost}/30, obor: ${p.score.breakdown.provoz.obor}/20)`);
  lines.push('');

  lines.push('# Insights k použití');
  p.cards.forEach((card, i) => {
    lines.push(`## Card ${i + 1}: ${card.frontmatter.id} (priority ${card.frontmatter.priority})`);
    lines.push(card.body);
    lines.push('');
  });

  lines.push('# Úkol');
  lines.push('Napište report v JSON struktuře dle schématu (viz system prompt).');
  lines.push('Insights z Card sekcí aplikujte na kontext této konkrétní firmy. Necitujte je doslovně — vždy přepište.');
  lines.push('Pokud insight nesedí na kontext firmy, ignorujte ho. Lepší kratší odstavec než nesedící.');

  return lines.join('\n');
}
