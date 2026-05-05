import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const contactSchema = z.object({
  jmeno: z.string().trim().min(2).max(100),
  firma: z.string().trim().min(1).max(120),
  pozice: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  telefon: z.string().trim().max(40).optional(),
  zprava: z.string().trim().min(10).max(5000),
  recaptchaToken: z.string().trim().min(1),
  gdprConsent: z.literal(true),
});

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  'error-codes'?: string[];
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

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

async function verifyRecaptcha(token: string, secret: string): Promise<RecaptchaResponse> {
  const params = new URLSearchParams({ secret, response: token });
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  return (await response.json()) as RecaptchaResponse;
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

  const parseResult = contactSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ ok: false, error: 'Invalid form data' });
    return;
  }
  const data = parseResult.data;

  let recaptchaScore: number | undefined;
  let recaptchaFlag = false;
  try {
    const recaptchaSecret = getEnv('RECAPTCHA_SECRET_KEY');
    const verification = await verifyRecaptcha(data.recaptchaToken, recaptchaSecret);
    if (!verification.success) {
      res.status(400).json({ ok: false, error: 'reCAPTCHA verification failed' });
      return;
    }
    recaptchaScore = verification.score;
    if (typeof recaptchaScore === 'number') {
      if (recaptchaScore < 0.3) {
        res.status(400).json({ ok: false, error: 'reCAPTCHA score too low' });
        return;
      }
      if (recaptchaScore < 0.5) {
        recaptchaFlag = true;
      }
    }
  } catch (err) {
    console.error('[contact] reCAPTCHA verification error:', err);
    res.status(500).json({ ok: false, error: 'reCAPTCHA verification error' });
    return;
  }

  try {
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

    const flagLine = recaptchaFlag
      ? `\n[FLAG] reCAPTCHA score = ${recaptchaScore} (under 0.5, possibly suspicious)`
      : '';
    const scoreLine =
      typeof recaptchaScore === 'number' ? `reCAPTCHA score: ${recaptchaScore.toFixed(2)}` : '';

    const text = [
      `Nový kontakt z webu QuConsult`,
      ``,
      `Jméno:    ${data.jmeno}`,
      `Firma:    ${data.firma}`,
      `Pozice:   ${data.pozice}`,
      `E-mail:   ${data.email}`,
      `Telefon:  ${data.telefon ?? '—'}`,
      ``,
      `Zpráva:`,
      data.zprava,
      ``,
      scoreLine,
      flagLine,
    ]
      .filter(Boolean)
      .join('\n');

    await transporter.sendMail({
      from: smtpFrom,
      to: notificationEmail,
      replyTo: data.email,
      subject: `[QuConsult] Nový kontakt: ${data.firma}`,
      text,
    });
  } catch (err) {
    console.error('[contact] mail delivery failed:', err);
    res.status(500).json({ ok: false, error: 'Mail delivery failed' });
    return;
  }

  res.status(200).json({ ok: true });
}
