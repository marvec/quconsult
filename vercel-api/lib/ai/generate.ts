import { zodTextFormat } from 'openai/helpers/zod';
import { ReadinessReport } from './schema.js';
import { getOpenAI } from './client.js';
import { BRAND_VOICE, OUTPUT_FORMAT } from './system-prompts.generated.js';

const TIMEOUT_MS = 25000;
const RETRY_DELAY_MS = 2000;

const SYSTEM_PROMPT = `${BRAND_VOICE}\n\n---\n\n${OUTPUT_FORMAT}`;

export async function generateReport(userPrompt: string): Promise<ReadinessReport> {
  const client = getOpenAI();

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

      try {
        const rsp = await client.responses.parse({
          model: 'o4-mini',
          input: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          reasoning: { effort: 'medium' },
          max_output_tokens: 4000,
          text: { format: zodTextFormat(ReadinessReport, 'readiness_report') },
        }, { signal: ctrl.signal });

        if (!rsp.output_parsed) {
          throw new Error('OpenAI returned unparseable response (output_parsed null)');
        }
        return rsp.output_parsed;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const isRetriable = status === 429 || (status !== undefined && status >= 500);
      if (attempt === 0 && isRetriable) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      throw err;
    }
  }
  throw new Error('generateReport: exhausted retries');
}
