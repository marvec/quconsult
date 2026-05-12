import { describe, it, expect } from 'vitest';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPdf } from './render.js';
import type { ScoreResult } from '../scoring.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mockScore: ScoreResult = {
  total: 78,
  dimensions: { data: 80, lide: 65, strategie: 72, provoz: 95 },
  breakdown: {
    data: { kvalita: 35, kde: 25, reporting: 20 },
    lide: { vedeni: 25, postoj: 22, kapacita: 18 },
    strategie: { cil: 30, horizont: 28, rozpocet: 14 },
    provoz: { erp: 50, velikost: 30, obor: 15 },
  },
};

describe('renderPdf', () => {
  it('renders a valid PDF buffer', async () => {
    const buf = await renderPdf({
      firma: 'Žluťoučký Kůň s.r.o.',
      date: '10. května 2026',
      score: mockScore,
      paragraphs: {
        data: 'Příliš žluťoučký kůň úpěl ďábelské ódy.\n\n'.repeat(4),
        lide: 'Příliš žluťoučký kůň úpěl ďábelské ódy.\n\n'.repeat(4),
        strategie: 'Příliš žluťoučký kůň úpěl ďábelské ódy.\n\n'.repeat(4),
        provoz: 'Příliš žluťoučký kůň úpěl ďábelské ódy.\n\n'.repeat(4),
      },
      nextSteps: [
        'Označte jeden proces, kde vás roztříštěnost dat nejvíc bolí.',
        'Domluvte si interní 2hodinový workshop o postoji týmu k AI.',
        'Spočítejte úsporu hodin týdně, kterou očekáváte od prvního pilotu.',
      ],
      oneLineSummary: 'Vaše firma je v pásmu PŘIPRAVENÁ — máte všechno potřebné pro pilotní AI projekt.',
    });

    expect(buf.subarray(0, 4).toString('ascii')).toBe('%PDF');
    // @react-pdf/renderer v4 uses font subsetting — only used glyphs embedded.
    // A 4-page report with Czech text and two typefaces produces ~15–50 KB.
    expect(buf.length).toBeGreaterThan(10_000);
    expect(buf.length).toBeLessThan(2_000_000);

    const outPath = path.join(__dirname, '__smoke__.pdf');
    await writeFile(outPath, buf);
    console.log('Smoke PDF written to:', outPath);
  }, 30000);
});
