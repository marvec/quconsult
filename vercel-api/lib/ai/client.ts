import OpenAI from 'openai';

let cached: OpenAI | undefined;

export function getOpenAI(): OpenAI {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing env var OPENAI_API_KEY');
  cached = new OpenAI({ apiKey });
  return cached;
}
