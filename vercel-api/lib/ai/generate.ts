import { zodTextFormat } from 'openai/helpers/zod';
import { ReadinessReport } from './schema.js';
import { getOpenAI } from './client.js';
import { BRAND_VOICE, OUTPUT_FORMAT } from './system-prompts.generated.js';

// Vercel Pro maxDuration=60s. Budget after response (~2s) is ~58s.
// Reserve ~5s for PDF render + SMTP. OpenAI o4-mini with reasoning=medium
// + structured output + Czech: typical 15-30s, P99 up to 45s.
const TIMEOUT_MS = 50000;
const RETRY_DELAY_MS = 2000;

const SYSTEM_PROMPT = `${BRAND_VOICE}\n\n---\n\n${OUTPUT_FORMAT}`;

export async function generateReport(userPrompt: string): Promise<ReadinessReport> {
  const client = getOpenAI();

  // Single attempt only — at 50s timeout, retry would blow waitUntil budget.
  // Retries only on early 429/5xx where the original call exits quickly.
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const startedAt = Date.now();
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

      clearTimeout(timeoutId);
      const elapsed = Date.now() - startedAt;
      console.log(`[ai-generate] OpenAI response in ${elapsed}ms`);

      if (!rsp.output_parsed) {
        throw new Error('OpenAI returned unparseable response (output_parsed null)');
      }
      return rsp.output_parsed;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startedAt;
      const status = (err as { status?: number })?.status;
      const isAbort = (err as { name?: string })?.name === 'AbortError' || ctrl.signal.aborted;
      const isRetriable = !isAbort && (status === 429 || (status !== undefined && status >= 500));

      console.error(`[ai-generate] attempt ${attempt + 1} failed after ${elapsed}ms (status=${status}, abort=${isAbort})`);

      // Only retry early-failure cases. Don't retry timeouts — they blow the budget.
      if (attempt === 0 && isRetriable && elapsed < 10000) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      throw err;
    }
  }
  throw new Error('generateReport: exhausted retries');
}
