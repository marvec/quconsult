import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

// Placeholder echo handler — Phase 0.
// Real scoring + PDF generation lands in Phase 6 (plan §6).
const aiReadinessSchema = z.object({
  jmeno: z.string().trim().min(2).max(100),
  firma: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  odpovedi: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  recaptchaToken: z.string().trim().min(1),
  gdprConsent: z.literal(true),
});

function isOriginAllowed(origin: string | undefined, allowedCsv: string): boolean {
  if (!origin) return false;
  const allowed = allowedCsv.split(',').map((s) => s.trim()).filter(Boolean);
  return allowed.includes(origin);
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

  const parseResult = aiReadinessSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ ok: false, error: 'Invalid form data' });
    return;
  }

  // TODO Phase 6: verify reCAPTCHA, score odpovedi, generate PDF, queue follow-up.
  res.status(200).json({ ok: true, received: true });
}
