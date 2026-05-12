import { Document, Font } from '@react-pdf/renderer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CoverPage } from './CoverPage.js';
import { DimensionPage } from './DimensionPage.js';
import { NextStepsPage } from './NextStepsPage.js';
import type { ScoreResult } from '../../scoring.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.join(__dirname, '..', 'fonts');

Font.register({
  family: 'Inter',
  fonts: [
    { src: path.join(fontsDir, 'Inter.ttf'), fontWeight: 400, fontStyle: 'normal' },
    { src: path.join(fontsDir, 'Inter.ttf'), fontWeight: 400, fontStyle: 'italic' },
    { src: path.join(fontsDir, 'Inter.ttf'), fontWeight: 700, fontStyle: 'normal' },
    { src: path.join(fontsDir, 'Inter.ttf'), fontWeight: 700, fontStyle: 'italic' },
  ],
});
Font.register({
  family: 'NotoSerif',
  fonts: [
    { src: path.join(fontsDir, 'NotoSerif.ttf'), fontWeight: 400, fontStyle: 'normal' },
    { src: path.join(fontsDir, 'NotoSerif.ttf'), fontWeight: 400, fontStyle: 'italic' },
    { src: path.join(fontsDir, 'NotoSerif.ttf'), fontWeight: 700, fontStyle: 'normal' },
    { src: path.join(fontsDir, 'NotoSerif.ttf'), fontWeight: 700, fontStyle: 'italic' },
  ],
});

export interface ReadinessDocumentProps {
  firma: string;
  date: string;
  score: ScoreResult;
  paragraphs: { data: string; lide: string; strategie: string; provoz: string };
  nextSteps: string[];
  oneLineSummary: string;
}

export function ReadinessDocument(p: ReadinessDocumentProps) {
  return (
    <Document title={`AI Readiness Assessment — ${p.firma}`} author="QuConsult" creator="QuConsult">
      <CoverPage firma={p.firma} date={p.date} score={p.score} oneLineSummary={p.oneLineSummary} />
      <DimensionPage
        pageNumber={2}
        sections={[
          { label: 'Data', score: p.score.dimensions.data, body: p.paragraphs.data },
          { label: 'Lidé', score: p.score.dimensions.lide, body: p.paragraphs.lide },
        ]}
      />
      <DimensionPage
        pageNumber={3}
        sections={[
          { label: 'Strategie', score: p.score.dimensions.strategie, body: p.paragraphs.strategie },
          { label: 'Provoz', score: p.score.dimensions.provoz, body: p.paragraphs.provoz },
        ]}
      />
      <NextStepsPage pageNumber={4} steps={p.nextSteps} />
    </Document>
  );
}
