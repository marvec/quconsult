const DEFAULT_CAP_USD = 5;

let spentUsd = 0;
let dayKey: string = isoDay();

function isoDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function getCap(): number {
  const raw = process.env.OPENAI_DAILY_USD_CAP;
  if (!raw) return DEFAULT_CAP_USD;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CAP_USD;
}

function maybeRollover(): void {
  const today = isoDay();
  if (today !== dayKey) {
    spentUsd = 0;
    dayKey = today;
  }
}

export function canSpend(): boolean {
  maybeRollover();
  return spentUsd < getCap();
}

export function recordSpend(usd: number): void {
  maybeRollover();
  spentUsd += usd;
}

export function spentToday(): number {
  maybeRollover();
  return spentUsd;
}

/** For tests only. */
export function resetCostCap(): void {
  spentUsd = 0;
  dayKey = isoDay();
}
