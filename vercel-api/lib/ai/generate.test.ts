import { describe, it, expect, vi, beforeEach } from 'vitest';

const parseMock = vi.fn();
vi.mock('./client.js', () => ({
  getOpenAI: () => ({ responses: { parse: parseMock } }),
}));
vi.mock('./prompt.js', async () => ({
  loadSystemPrompt: async () => 'mocked system prompt',
}));

const { generateReport } = await import('./generate');

const validReport = {
  paragraphs: {
    data: 'Příliš žluťoučký kůň úpěl ďábelské ódy. '.repeat(20),
    lide: 'Příliš žluťoučký kůň úpěl ďábelské ódy. '.repeat(20),
    strategie: 'Příliš žluťoučký kůň úpěl ďábelské ódy. '.repeat(20),
    provoz: 'Příliš žluťoučký kůň úpěl ďábelské ódy. '.repeat(20),
  },
  nextSteps: [
    'Označte jeden konkrétní proces, kde vás roztříštěnost dat nejvíc bolí.',
    'Domluvte si interní 2hodinový workshop o postoji týmu k AI.',
    'Spočítejte úsporu hodin týdně, kterou očekáváte od pilotu.',
  ],
  oneLineSummary: 'Vaše firma je v pásmu KANDIDÁT — máte základ, ale je co dorovnat.',
};

describe('generateReport', () => {
  beforeEach(() => {
    parseMock.mockReset();
  });

  it('returns parsed report on success', async () => {
    parseMock.mockResolvedValue({ output_parsed: validReport });
    const r = await generateReport('user prompt');
    expect(r.paragraphs.data).toMatch(/Příliš žluťoučký/);
    expect(r.nextSteps).toHaveLength(3);
  });

  it('throws on null output_parsed', async () => {
    parseMock.mockResolvedValue({ output_parsed: null });
    await expect(generateReport('x')).rejects.toThrow(/unparseable/);
  });

  it('retries once on 429', async () => {
    const err: any = new Error('rate limited');
    err.status = 429;
    parseMock.mockRejectedValueOnce(err).mockResolvedValueOnce({ output_parsed: validReport });
    const r = await generateReport('x');
    expect(parseMock).toHaveBeenCalledTimes(2);
    expect(r.nextSteps).toHaveLength(3);
  });

  it('does not retry on 4xx (other than 429)', async () => {
    const err: any = new Error('bad request');
    err.status = 400;
    parseMock.mockRejectedValue(err);
    await expect(generateReport('x')).rejects.toThrow(/bad request/);
    expect(parseMock).toHaveBeenCalledTimes(1);
  });
});
