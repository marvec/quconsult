import type { VercelRequest, VercelResponse } from '@vercel/node';
import { waitUntil } from '@vercel/functions';
import nodemailer from 'nodemailer';
import path from 'node:path';
import { z } from 'zod';
import { OdpovediSchema, scoreReadiness, type Odpovedi } from '../lib/scoring';
import { loadCards } from '../lib/knowledge/load';
import { selectCards } from '../lib/knowledge/select';
import { buildUserPrompt } from '../lib/ai/prompt';
import { generateReport } from '../lib/ai/generate';
import { renderPdf } from '../lib/pdf/render';
import { slugify } from '../lib/slugify';
import { canSpend, recordSpend } from '../lib/cost-cap';
import type { ScoreResult } from '../lib/scoring';

const knowledgeDir = path.join(process.cwd(), 'lib', 'knowledge');

const requestSchema = z.object({
  jmeno: z.string().trim().min(2).max(100),
  firma: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  telefon: z.string().trim().max(40).optional(),
  odpovedi: z.unknown(),
  recaptchaToken: z.string().trim().min(1),
  gdprConsent: z.literal(true),
});

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  'error-codes'?: string[];
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function isOriginAllowed(origin: string | undefined, allowedCsv: string): boolean {
  if (!origin) return false;
  return allowedCsv.split(',').map((s) => s.trim()).filter(Boolean).includes(origin);
}

function setCorsHeaders(res: VercelResponse, origin: string | undefined, allowedCsv: string): void {
  if (origin && isOriginAllowed(origin, allowedCsv)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

async function verifyRecaptcha(token: string, secret: string): Promise<RecaptchaResponse> {
  const params = new URLSearchParams({ secret, response: token });
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  return (await response.json()) as RecaptchaResponse;
}

function formatDate(): string {
  return new Date().toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface FinalizeInput {
  jmeno: string;
  firma: string;
  email: string;
  telefon?: string;
  odpovedi: Odpovedi;
  score: ScoreResult;
}

async function processFinalization(p: FinalizeInput): Promise<void> {
  const smtpHost = getEnv('SMTP_HOST');
  const smtpPort = Number(getEnv('SMTP_PORT'));
  const smtpUser = getEnv('SMTP_USER');
  const smtpPass = getEnv('SMTP_PASS');
  const smtpFrom = getEnv('SMTP_FROM');
  const notificationEmail = getEnv('NOTIFICATION_EMAIL');

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  try {
    if (!canSpend()) {
      console.warn('[ai-readiness] daily cost cap reached, skipping OpenAI call');
      await transporter.sendMail({
        from: smtpFrom,
        to: notificationEmail,
        subject: `[QuConsult] AI Readiness od ${p.firma} — daily cap reached`,
        text: `Submission od ${p.email} (${p.firma}) — daily OpenAI cap reached, follow-up manuálně.\n\nScore: ${p.score.total}/100\nOdpovědi: ${JSON.stringify(p.odpovedi, null, 2)}`,
      });
      return;
    }

    const allCards = await loadCards(knowledgeDir);
    const selected = selectCards(p.odpovedi, p.score, allCards);

    const userPrompt = buildUserPrompt({
      firma: p.firma,
      velikost: String(p.odpovedi.velikost ?? '—'),
      obor: String(p.odpovedi.obor ?? '—'),
      erp: String(p.odpovedi.erp ?? '—'),
      cinnost: String(p.odpovedi.cinnost ?? ''),
      odpovedi: p.odpovedi,
      score: p.score,
      cards: selected,
    });

    const report = await generateReport(userPrompt);
    recordSpend(0.02);

    const pdfBuffer = await renderPdf({
      firma: p.firma,
      date: formatDate(),
      score: p.score,
      paragraphs: report.paragraphs,
      nextSteps: report.nextSteps,
      oneLineSummary: report.oneLineSummary,
    });

    const slug = slugify(p.firma);
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `quconsult-ai-readiness-${slug}-${ymd}.pdf`;

    await transporter.sendMail({
      from: smtpFrom,
      to: p.email,
      subject: 'Váš AI Readiness report od QuConsult',
      text: `Dobrý den, ${p.jmeno},\n\nděkujeme za vyplnění dotazníku. V příloze najdete krátký 4stránkový report s orientačním skóre a konkrétními doporučeními.\n\nTým QuConsult se na Vaše odpovědi také podívá a do jednoho pracovního dne se Vám ozveme s návazným kontaktem.\n\nS pozdravem,\ntým QuConsult\nhello@quconsult.cz\nquconsult.cz`,
      attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: notificationEmail,
      replyTo: p.email,
      subject: `[QuConsult] AI Readiness od ${p.firma} — score ${p.score.total}/100`,
      text: `Nová submission od ${p.email} (${p.firma}, ${p.odpovedi.velikost}, ${p.odpovedi.obor}).\n\nScore: ${p.score.total}/100\n  Data: ${p.score.dimensions.data}\n  Lidé: ${p.score.dimensions.lide}\n  Strategie: ${p.score.dimensions.strategie}\n  Provoz: ${p.score.dimensions.provoz}\n\nPDF byl odeslán uživateli automaticky.\nTelefon: ${p.telefon ?? '—'}\n\nFollow-up do 1 prac. dne.`,
      attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
    });
  } catch (err) {
    console.error('[ai-readiness] processFinalization failed:', err);
    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: notificationEmail,
        replyTo: p.email,
        subject: `[QuConsult] AI Readiness FAILURE od ${p.firma} — manual followup`,
        text: `Submission od ${p.email} (${p.firma}) — automatizace selhala (${err instanceof Error ? err.message : String(err)}). Follow-up manuálně.\n\nScore: ${p.score.total}/100\nOdpovědi: ${JSON.stringify(p.odpovedi, null, 2)}`,
      });
    } catch (notifyErr) {
      console.error('[ai-readiness] fallback notification also failed:', notifyErr);
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const allowedOriginCsv = process.env.ALLOWED_ORIGIN ?? '';
  const origin = req.headers.origin;

  setCorsHeaders(res, origin, allowedOriginCsv);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }
  if (!isOriginAllowed(origin, allowedOriginCsv)) {
    res.status(403).json({ ok: false, error: 'Origin not allowed' });
    return;
  }

  const reqResult = requestSchema.safeParse(req.body);
  if (!reqResult.success) {
    res.status(400).json({ ok: false, error: 'Invalid form data' });
    return;
  }

  const odpovediResult = OdpovediSchema.safeParse(reqResult.data.odpovedi);
  if (!odpovediResult.success) {
    res.status(400).json({ ok: false, error: 'Invalid odpovedi structure' });
    return;
  }

  let recaptchaScore: number | undefined;
  try {
    const recaptchaSecret = getEnv('RECAPTCHA_SECRET_KEY');
    const verification = await verifyRecaptcha(reqResult.data.recaptchaToken, recaptchaSecret);
    if (!verification.success) {
      res.status(400).json({ ok: false, error: 'reCAPTCHA verification failed' });
      return;
    }
    recaptchaScore = verification.score;
    if (typeof recaptchaScore === 'number' && recaptchaScore < 0.3) {
      res.status(400).json({ ok: false, error: 'reCAPTCHA score too low' });
      return;
    }
  } catch (err) {
    console.error('[ai-readiness] reCAPTCHA verification error:', err);
    res.status(500).json({ ok: false, error: 'reCAPTCHA verification error' });
    return;
  }

  const score = scoreReadiness(odpovediResult.data);

  res.status(200).json({
    ok: true,
    score: {
      total: score.total,
      dimensions: score.dimensions,
    },
  });

  waitUntil(processFinalization({
    jmeno: reqResult.data.jmeno,
    firma: reqResult.data.firma,
    email: reqResult.data.email,
    telefon: reqResult.data.telefon,
    odpovedi: odpovediResult.data,
    score,
  }));
}
