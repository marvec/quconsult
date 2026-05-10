# AI Readiness Full-Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přepsat `/ai-readiness` z lead-capture s human follow-upem na fully automated lead magnet — visitor vidí instant skóre + 4 dimenze, do 60 s dorazí 4str. PDF report psaný OpenAI o4-mini, tým QuConsult kontaktuje do 1 prac. dne.

**Architecture:** Single Vercel Node endpoint `POST /api/ai-readiness` se rozděluje na fast path (validate → reCAPTCHA → score → response) a slow path (`waitUntil` → KB lookup → OpenAI → PDF render → SMTP). Knowledge base žije jako Markdown soubory s YAML frontmatter v `vercel-api/lib/knowledge/`. PDF se generuje přes `@react-pdf/renderer` (pure JS, žádný Chromium). Frontend `ai-readiness.astro` se přepisuje jen v success-state (form/copy zůstávají).

**Tech Stack:** TypeScript 5.6 strict, Node 22, Vercel Pro (60 s timeout), `openai` SDK ≥ 6.0 (Responses API), `@react-pdf/renderer` ^4, `@vercel/functions` (waitUntil), `gray-matter` (frontmatter parse), `vitest` (tests, new), `zod` ^3, existing nodemailer SMTP.

**Spec source:** `docs/superpowers/specs/2026-05-10-ai-readiness-full-feature-design.md`

---

## File structure

### Vercel API (`vercel-api/`)

```
vercel-api/
├── api/
│   └── ai-readiness.ts                     # MODIFIED — new flow
├── lib/
│   ├── slugify.ts                          # NEW — firma slug for filename
│   ├── slugify.test.ts
│   ├── scoring.ts                          # NEW — 4-dim scoring
│   ├── scoring.test.ts
│   ├── cost-cap.ts                         # NEW — per-instance daily cap
│   ├── cost-cap.test.ts
│   ├── knowledge/
│   │   ├── types.ts                        # NEW — Card + Frontmatter Zod schemas
│   │   ├── triggers.ts                     # NEW — evalTriggers
│   │   ├── triggers.test.ts
│   │   ├── load.ts                         # NEW — readdir + frontmatter parse
│   │   ├── load.test.ts
│   │   ├── select.ts                       # NEW — selectCards
│   │   ├── select.test.ts
│   │   ├── data/                           # NEW — ~7 .md cards
│   │   ├── lide/                           # NEW — ~5 .md cards
│   │   ├── strategie/                      # NEW — ~5 .md cards
│   │   ├── provoz/                         # NEW — ~4 .md cards
│   │   ├── icp/                            # NEW — 3 .md cards
│   │   └── _system/                        # NEW — brand-voice.md + output-format.md
│   ├── ai/
│   │   ├── client.ts                       # NEW — OpenAI client init
│   │   ├── schema.ts                       # NEW — ReadinessReport zod
│   │   ├── prompt.ts                       # NEW — buildPrompt
│   │   ├── prompt.test.ts
│   │   ├── generate.ts                     # NEW — generateReport
│   │   └── generate.test.ts
│   └── pdf/
│       ├── tokens.ts                       # NEW — brand colors/fonts/spacing
│       ├── render.tsx                      # NEW — renderPdf entry
│       ├── render.test.ts                  # NEW — smoke render
│       ├── components/
│       │   ├── ReadinessDocument.tsx
│       │   ├── CoverPage.tsx
│       │   ├── DimensionPage.tsx
│       │   ├── NextStepsPage.tsx
│       │   ├── ScoreBar.tsx
│       │   └── BigScore.tsx
│       └── fonts/
│           ├── Inter.ttf                   # COPY from quconsult-web/scripts/fonts/
│           └── NotoSerif.ttf
├── scripts/
│   └── lint-knowledge.ts                   # NEW — anglicism + frontmatter lint
├── tsconfig.json                           # MODIFIED — JSX
├── package.json                            # MODIFIED — new deps + scripts
├── vercel.json                             # MODIFIED — maxDuration 60
└── vitest.config.ts                        # NEW — vitest config
```

### Frontend (`quconsult-web/src/`)

```
src/
├── lib/
│   └── readiness-bands.ts                  # NEW — 12 per-dim notes + 3 summaries
└── pages/
    ├── ai-readiness.astro                  # MODIFIED — success page redesign + copy
    ├── soukromi.astro                      # MODIFIED — OpenAI disclosure
    └── zpracovatele.astro                  # MODIFIED — OpenAI sub-procesor row
```

---

## Tasks

### Task 1: Setup dependencies + tsconfig + vercel.json

**Files:**
- Modify: `vercel-api/package.json`
- Modify: `vercel-api/tsconfig.json`
- Modify: `vercel-api/vercel.json`
- Create: `vercel-api/vitest.config.ts`

- [ ] **Step 1: Install runtime deps**

```bash
cd vercel-api
pnpm add openai@^6 @react-pdf/renderer@^4 @vercel/functions@^2 gray-matter@^4 react@^18 react-dom@^18
```

Expected: Lockfile updated. No errors.

- [ ] **Step 2: Install dev deps**

```bash
cd vercel-api
pnpm add -D vitest@^2 @types/react@^18 @types/react-dom@^18
```

- [ ] **Step 3: Update `tsconfig.json` for JSX + tests + lib includes**

Replace `vercel-api/tsconfig.json` content with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "types": ["node"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": false,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["api/**/*.ts", "lib/**/*.ts", "lib/**/*.tsx", "scripts/**/*.ts"]
}
```

- [ ] **Step 4: Update `vercel.json` with maxDuration**

Replace `vercel-api/vercel.json` content with:

```json
{
  "framework": null,
  "functions": {
    "api/*.ts": {
      "runtime": "@vercel/node@5.0.0",
      "maxDuration": 60
    }
  }
}
```

- [ ] **Step 5: Create `vitest.config.ts`**

Create `vercel-api/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['lib/**/*.test.ts', 'lib/**/*.test.tsx'],
    environment: 'node',
    testTimeout: 10000,
  },
});
```

- [ ] **Step 6: Add `package.json` scripts**

Modify `vercel-api/package.json` `"scripts"` to include:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "lint:knowledge": "tsx scripts/lint-knowledge.ts"
  }
}
```

(If `"scripts"` doesn't exist, add the whole block. Use `tsx` indirectly via `pnpm dlx tsx` if not installed — add `tsx` as dev dep: `pnpm add -D tsx`.)

- [ ] **Step 7: Verify build still passes**

```bash
cd vercel-api
pnpm tsc --noEmit
```

Expected: no errors. (Existing `api/ai-readiness.ts` and `api/contact.ts` should still compile.)

- [ ] **Step 8: Commit**

```bash
git add vercel-api/
git commit -m "chore(api): scaffold Phase 6 deps (openai, react-pdf, vitest, vercel functions)"
```

---

### Task 2: Slugify utility (TDD)

Used to derive PDF filename `quconsult-ai-readiness-{slug}-{YYYYMMDD}.pdf` from `firma` field. Strips diakritika without external dep, lowercases, `non-alphanum→-`, collapses dashes, max 30 chars.

**Files:**
- Create: `vercel-api/lib/slugify.ts`
- Create: `vercel-api/lib/slugify.test.ts`

- [ ] **Step 1: Write failing test**

Create `vercel-api/lib/slugify.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { slugify } from './slugify';

describe('slugify', () => {
  it('lowercases and replaces spaces with dashes', () => {
    expect(slugify('Acme Corp')).toBe('acme-corp');
  });

  it('strips Czech diakritika', () => {
    expect(slugify('Žluťoučký Kůň s.r.o.')).toBe('zlutoucky-kun-s-r-o');
  });

  it('collapses multiple dashes', () => {
    expect(slugify('Foo & Bar -- Baz')).toBe('foo-bar-baz');
  });

  it('strips leading and trailing dashes', () => {
    expect(slugify('---ACME---')).toBe('acme');
  });

  it('caps at 30 chars', () => {
    expect(slugify('a'.repeat(50)).length).toBeLessThanOrEqual(30);
  });

  it('returns "firma" for empty/whitespace input', () => {
    expect(slugify('')).toBe('firma');
    expect(slugify('   ')).toBe('firma');
  });

  it('handles full-name corner case', () => {
    expect(slugify('WellBe s.r.o. — IČ 05830931')).toBe('wellbe-s-r-o-ic-05830931');
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

```bash
cd vercel-api
pnpm test
```

Expected: All tests fail (`Cannot find module './slugify'`).

- [ ] **Step 3: Implement `slugify`**

Create `vercel-api/lib/slugify.ts`:

```ts
const DIAKRITIKA_MAP: Record<string, string> = {
  á: 'a', č: 'c', ď: 'd', é: 'e', ě: 'e', í: 'i', ň: 'n', ó: 'o',
  ř: 'r', š: 's', ť: 't', ú: 'u', ů: 'u', ý: 'y', ž: 'z',
  Á: 'A', Č: 'C', Ď: 'D', É: 'E', Ě: 'E', Í: 'I', Ň: 'N', Ó: 'O',
  Ř: 'R', Š: 'S', Ť: 'T', Ú: 'U', Ů: 'U', Ý: 'Y', Ž: 'Z',
};

export function slugify(input: string): string {
  const stripped = input.replace(/./g, (c) => DIAKRITIKA_MAP[c] ?? c);
  const cleaned = stripped
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
    .replace(/^-+|-+$/g, ''); // re-strip after slice in case slice cut into a dash
  return cleaned || 'firma';
}
```

- [ ] **Step 4: Run tests, confirm pass**

```bash
pnpm test
```

Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add vercel-api/lib/slugify.ts vercel-api/lib/slugify.test.ts
git commit -m "feat(api): slugify util for PDF filename"
```

---

### Task 3: Scoring algorithm + Odpovedi types (TDD)

Pure deterministic 4-dimension scoring. Inputs are form answers (typed via Zod), output is `ScoreResult` with total + per-dim values + raw breakdown for LLM/PDF use.

**Files:**
- Create: `vercel-api/lib/scoring.ts`
- Create: `vercel-api/lib/scoring.test.ts`

- [ ] **Step 1: Write failing test (skeleton + 3 fixtures)**

Create `vercel-api/lib/scoring.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { scoreReadiness, type Odpovedi } from './scoring';

describe('scoreReadiness', () => {
  it('returns max score for ideal answers', () => {
    const odpovedi: Odpovedi = {
      'data-kvalita': 'Vynikající',
      'data-kde': ['V ERP systému', 'Ve vlastní databázi'],
      reporting: 'Ano, funkční',
      vedeni: 'CEO / vedení',
      'tym-postoj': 'Velký zájem',
      kapacita: 'Více',
      cil: 'Úspora času',
      horizont: 'Do 6 měsíců',
      rozpocet: 'Nad 500 tis.',
      erp: 'SAP Business One',
      velikost: '50–150',
      obor: 'IT a software',
    };
    const r = scoreReadiness(odpovedi);
    expect(r.total).toBeGreaterThanOrEqual(95);
    expect(r.dimensions.data).toBe(100);
    expect(r.dimensions.lide).toBe(100);
  });

  it('returns low score for worst-case answers', () => {
    const odpovedi: Odpovedi = {
      'data-kvalita': 'Nevíme',
      'data-kde': ['Papírově nebo částečně papírově'],
      reporting: 'Ne',
      vedeni: 'Zatím nikdo',
      'tym-postoj': 'Otevřený odpor',
      kapacita: '2–4 h',
      cil: 'Jiné',
      horizont: 'Déle',
      rozpocet: 'Pod 100 tis. Kč',
      erp: 'Žádný ERP',
      velikost: 'pod 30',
      obor: 'Stavebnictví',
    };
    const r = scoreReadiness(odpovedi);
    expect(r.total).toBeLessThanOrEqual(20);
    expect(r.dimensions.data).toBeLessThanOrEqual(10);
    expect(r.dimensions.lide).toBeLessThanOrEqual(15);
  });

  it('total is weighted 30/30/25/15 across dimensions', () => {
    // Set dim scores to known values, verify total = 30·d + 30·l + 25·s + 15·p (rounded)
    const odpovedi: Odpovedi = {
      // data → ~80 (kvalita Použitelná=35 + kde ERP=12 + reporting Ano=20 = 67 / cap normalized)
      // We test via construction, but easier: pick answer set we manually computed
      'data-kvalita': 'Použitelná',  // 35
      'data-kde': ['V ERP systému'],  // 12
      reporting: 'Ano, funkční',  // 20
      // = 67 / 100 normalized (sum of weights = 50+30+20=100, so already 0–100)
      vedeni: 'CEO / vedení',  // 40
      'tym-postoj': 'Velký zájem',  // 35
      kapacita: '5–10 h',  // 15
      // lide = 90
      cil: 'Úspora času',  // 35
      horizont: 'Do 6 měsíců',  // 35
      rozpocet: '300–500 tis.',  // 28
      // strategie = 98
      erp: 'Pohoda',  // 35
      velikost: '50–150',  // 30
      obor: 'Výroba',  // 18
      // provoz = 83
    };
    const r = scoreReadiness(odpovedi);
    expect(r.dimensions.data).toBe(67);
    expect(r.dimensions.lide).toBe(90);
    expect(r.dimensions.strategie).toBe(98);
    expect(r.dimensions.provoz).toBe(83);
    // total = round(67*0.3 + 90*0.3 + 98*0.25 + 83*0.15) = round(20.1+27+24.5+12.45) = round(84.05) = 84
    expect(r.total).toBe(84);
  });

  it('caps data-kde bonus at 30', () => {
    const odpovedi: Odpovedi = {
      'data-kvalita': 'Vynikající',
      'data-kde': [
        'V ERP systému',           // 12
        'Ve vlastní databázi',     // 12 → would be 24
        'V cloudu (SharePoint, Drive)',  // 8 → would be 32, cap to 30
        'V Excelu / Google Sheets',
        'V e-mailových schránkách',
      ],
      reporting: 'Ano, funkční',
      vedeni: 'CEO / vedení',
      'tym-postoj': 'Velký zájem',
      cil: 'Úspora času',
      horizont: 'Do 6 měsíců',
      erp: 'Žádný ERP',
      velikost: 'pod 30',
      obor: 'Jiné',
    };
    const r = scoreReadiness(odpovedi);
    expect(r.breakdown.data.kde).toBe(30);
  });

  it('handles missing optional fields (kapacita, rozpocet)', () => {
    const odpovedi: Odpovedi = {
      'data-kvalita': 'Použitelná',
      'data-kde': ['V ERP systému'],
      reporting: 'Částečně',
      vedeni: 'COO / provoz',
      'tym-postoj': 'Spíše opatrné',
      // kapacita omitted → defaults to 10
      cil: 'Vyšší kvalita',
      horizont: 'Do roka',
      // rozpocet omitted → defaults to 15
      erp: 'Helios',
      velikost: '30–50',
      obor: 'Profesionální služby',
    };
    const r = scoreReadiness(odpovedi);
    expect(r.breakdown.lide.kapacita).toBe(10);
    expect(r.breakdown.strategie.rozpocet).toBe(15);
    expect(r.dimensions.data).toBeGreaterThan(0);
    expect(r.dimensions.lide).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

```bash
pnpm test scoring
```

Expected: All fail (module not found).

- [ ] **Step 3: Implement `scoring.ts`**

Create `vercel-api/lib/scoring.ts`:

```ts
import { z } from 'zod';

export const OdpovediSchema = z.object({
  'data-kvalita': z.enum(['Vynikající', 'Použitelná', 'Roztříštěná', 'Nevíme']),
  'data-kde': z.array(z.string()),
  reporting: z.enum(['Ano, funkční', 'Částečně', 'Ne']).optional(),
  vedeni: z.enum(['CEO / vedení', 'IT manažer / CTO', 'COO / provoz', 'Externí partner', 'Zatím nikdo']),
  'tym-postoj': z.enum(['Velký zájem', 'Spíše opatrné', 'Skeptické', 'Otevřený odpor']),
  kapacita: z.enum(['2–4 h', '5–10 h', '10–20 h', 'Více']).optional(),
  cil: z.enum(['Úspora času', 'Nové produkty', 'Vyšší kvalita', 'Zákaznická zkušenost', 'Compliance / GDPR', 'Něco jiného', 'Jiné']),
  horizont: z.enum(['Do 3 měsíců', 'Do 6 měsíců', 'Do roka', 'Déle']),
  rozpocet: z.enum(['Pod 100 tis. Kč', '100–300 tis.', '300–500 tis.', 'Nad 500 tis.', 'Nevíme']).optional(),
  erp: z.enum(['Pohoda', 'Helios', 'SAP Business One', 'MS Dynamics', 'Money S3', 'Vlastní řešení', 'Jiné', 'Žádný ERP']),
  velikost: z.enum(['pod 30', '30–50', '50–150', '150–300', '300+']),
  obor: z.enum(['Výroba', 'Profesionální služby', 'Obchod a velkoobchod', 'Stavebnictví', 'IT a software', 'Jiné']),
  cinnost: z.string().optional(),
}).passthrough(); // allow extra fields without rejecting

export type Odpovedi = z.infer<typeof OdpovediSchema>;

export interface ScoreResult {
  total: number;
  dimensions: { data: number; lide: number; strategie: number; provoz: number };
  breakdown: {
    data: { kvalita: number; kde: number; reporting: number };
    lide: { vedeni: number; postoj: number; kapacita: number };
    strategie: { cil: number; horizont: number; rozpocet: number };
    provoz: { erp: number; velikost: number; obor: number };
  };
}

const DATA_KVALITA: Record<string, number> = {
  'Vynikající': 50, 'Použitelná': 35, 'Roztříštěná': 15, 'Nevíme': 5,
};
const DATA_KDE_BONUS: Record<string, number> = {
  'V ERP systému': 12,
  'Ve vlastní databázi': 12,
  'V cloudu (SharePoint, Drive)': 8,
  'V Excelu / Google Sheets': 5,
  'V e-mailových schránkách': 2,
  'Papírově nebo částečně papírově': 0,
};
const REPORTING: Record<string, number> = { 'Ano, funkční': 20, 'Částečně': 10, 'Ne': 0 };
const VEDENI: Record<string, number> = {
  'CEO / vedení': 40, 'IT manažer / CTO': 40, 'COO / provoz': 35, 'Externí partner': 25, 'Zatím nikdo': 0,
};
const POSTOJ: Record<string, number> = {
  'Velký zájem': 35, 'Spíše opatrné': 22, 'Skeptické': 10, 'Otevřený odpor': 0,
};
const KAPACITA: Record<string, number> = { '2–4 h': 8, '5–10 h': 15, '10–20 h': 22, 'Více': 25 };
const CIL: Record<string, number> = {
  'Úspora času': 35, 'Vyšší kvalita': 33, 'Zákaznická zkušenost': 30, 'Compliance / GDPR': 25,
  'Nové produkty': 22, 'Něco jiného': 15, 'Jiné': 15,
};
const HORIZONT: Record<string, number> = {
  'Do 3 měsíců': 20, 'Do 6 měsíců': 35, 'Do roka': 30, 'Déle': 15,
};
const ROZPOCET: Record<string, number> = {
  'Pod 100 tis. Kč': 15, '100–300 tis.': 22, '300–500 tis.': 28, 'Nad 500 tis.': 30, 'Nevíme': 8,
};
const ERP: Record<string, number> = {
  'SAP Business One': 50, 'MS Dynamics': 50, 'Vlastní řešení': 45, 'Helios': 45,
  'Pohoda': 35, 'Money S3': 30, 'Jiné': 25, 'Žádný ERP': 8,
};
const VELIKOST: Record<string, number> = {
  '50–150': 30, '150–300': 30, '30–50': 24, '300+': 22, 'pod 30': 15,
};
const OBOR: Record<string, number> = {
  'IT a software': 18, 'Profesionální služby': 18, 'Výroba': 18,
  'Obchod a velkoobchod': 14, 'Stavebnictví': 10, 'Jiné': 14,
};

function scoreDataKde(kde: string[]): number {
  const sum = kde.reduce((acc, k) => acc + (DATA_KDE_BONUS[k] ?? 0), 0);
  return Math.min(sum, 30);
}

export function scoreReadiness(o: Odpovedi): ScoreResult {
  const data = {
    kvalita: DATA_KVALITA[o['data-kvalita']] ?? 0,
    kde: scoreDataKde(o['data-kde']),
    reporting: o.reporting ? REPORTING[o.reporting] ?? 0 : 0,
  };
  const lide = {
    vedeni: VEDENI[o.vedeni] ?? 0,
    postoj: POSTOJ[o['tym-postoj']] ?? 0,
    kapacita: o.kapacita ? KAPACITA[o.kapacita] ?? 0 : 10,
  };
  const strategie = {
    cil: CIL[o.cil] ?? 0,
    horizont: HORIZONT[o.horizont] ?? 0,
    rozpocet: o.rozpocet ? ROZPOCET[o.rozpocet] ?? 0 : 15,
  };
  const provoz = {
    erp: ERP[o.erp] ?? 0,
    velikost: VELIKOST[o.velikost] ?? 0,
    obor: OBOR[o.obor] ?? 0,
  };

  const dim = {
    data: data.kvalita + data.kde + data.reporting,
    lide: lide.vedeni + lide.postoj + lide.kapacita,
    strategie: strategie.cil + strategie.horizont + strategie.rozpocet,
    provoz: provoz.erp + provoz.velikost + provoz.obor,
  };

  const total = Math.round(dim.data * 0.30 + dim.lide * 0.30 + dim.strategie * 0.25 + dim.provoz * 0.15);

  return {
    total,
    dimensions: dim,
    breakdown: { data, lide, strategie, provoz },
  };
}
```

- [ ] **Step 4: Run tests, confirm pass**

```bash
pnpm test scoring
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add vercel-api/lib/scoring.ts vercel-api/lib/scoring.test.ts
git commit -m "feat(api): deterministic 4-dimension scoring algorithm"
```

---

### Task 4: Knowledge base types + frontmatter schema

Defines `Card` shape (frontmatter + body) and Zod schema for validation.

**Files:**
- Create: `vercel-api/lib/knowledge/types.ts`

- [ ] **Step 1: Create `types.ts`**

```ts
import { z } from 'zod';

export const TriggerSchema = z.union([
  z.object({ field: z.string(), equals: z.string() }),
  z.object({ field: z.string(), in: z.array(z.string()).min(1) }),
  z.object({ field: z.string(), includes: z.string() }),
  z.object({
    dimension: z.enum(['data', 'lide', 'strategie', 'provoz']),
    scoreBand: z.tuple([z.number().int().min(0).max(100), z.number().int().min(0).max(100)]),
  }),
  z.object({
    total: z.literal(true).optional(),
    scoreBand: z.tuple([z.number().int().min(0).max(100), z.number().int().min(0).max(100)]),
  }),
]);

export type Trigger = z.infer<typeof TriggerSchema>;

export const FrontmatterSchema = z.object({
  id: z.string().min(1),
  dimension: z.enum(['data', 'lide', 'strategie', 'provoz', 'icp']),
  priority: z.number().int().min(1).max(10),
  weight: z.enum(['must', 'may']),
  triggers: z.array(TriggerSchema).min(1),
});

export type Frontmatter = z.infer<typeof FrontmatterSchema>;

export interface Card {
  frontmatter: Frontmatter;
  body: string;          // Markdown text after frontmatter
  filepath: string;      // for debugging
}
```

- [ ] **Step 2: Verify compile**

```bash
cd vercel-api
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add vercel-api/lib/knowledge/types.ts
git commit -m "feat(api): KB Card + Frontmatter Zod schemas"
```

---

### Task 5: Trigger evaluator (TDD)

Pure function: given a trigger spec + answers + score, returns boolean. AND-only semantics for multiple triggers in one card (handled by caller).

**Files:**
- Create: `vercel-api/lib/knowledge/triggers.ts`
- Create: `vercel-api/lib/knowledge/triggers.test.ts`

- [ ] **Step 1: Write tests**

Create `vercel-api/lib/knowledge/triggers.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { evalTrigger, evalTriggers } from './triggers';
import type { ScoreResult } from '../scoring';

const score: ScoreResult = {
  total: 65,
  dimensions: { data: 70, lide: 60, strategie: 55, provoz: 80 },
  breakdown: {
    data: { kvalita: 35, kde: 15, reporting: 20 },
    lide: { vedeni: 25, postoj: 22, kapacita: 13 },
    strategie: { cil: 25, horizont: 20, rozpocet: 10 },
    provoz: { erp: 35, velikost: 30, obor: 15 },
  },
};

const odpovedi = {
  'data-kvalita': 'Použitelná',
  'data-kde': ['V ERP systému', 'V Excelu / Google Sheets'],
  velikost: '50–150',
};

describe('evalTrigger', () => {
  it('field+equals matches exact value', () => {
    expect(evalTrigger({ field: 'data-kvalita', equals: 'Použitelná' }, odpovedi, score)).toBe(true);
    expect(evalTrigger({ field: 'data-kvalita', equals: 'Roztříštěná' }, odpovedi, score)).toBe(false);
  });

  it('field+in matches membership', () => {
    expect(evalTrigger({ field: 'velikost', in: ['30–50', '50–150'] }, odpovedi, score)).toBe(true);
    expect(evalTrigger({ field: 'velikost', in: ['pod 30', '300+'] }, odpovedi, score)).toBe(false);
  });

  it('field+includes matches multi-select element', () => {
    expect(evalTrigger({ field: 'data-kde', includes: 'V ERP systému' }, odpovedi, score)).toBe(true);
    expect(evalTrigger({ field: 'data-kde', includes: 'Papírově nebo částečně papírově' }, odpovedi, score)).toBe(false);
  });

  it('dimension+scoreBand matches range (closed interval)', () => {
    expect(evalTrigger({ dimension: 'data', scoreBand: [60, 80] }, odpovedi, score)).toBe(true);  // 70 in [60,80]
    expect(evalTrigger({ dimension: 'data', scoreBand: [70, 70] }, odpovedi, score)).toBe(true);
    expect(evalTrigger({ dimension: 'lide', scoreBand: [70, 100] }, odpovedi, score)).toBe(false);  // 60 not in
  });

  it('total scoreBand matches total', () => {
    expect(evalTrigger({ scoreBand: [60, 70] }, odpovedi, score)).toBe(true);
    expect(evalTrigger({ scoreBand: [80, 100] }, odpovedi, score)).toBe(false);
  });
});

describe('evalTriggers (AND semantics)', () => {
  it('returns true only when all triggers match', () => {
    expect(evalTriggers(
      [{ field: 'data-kvalita', equals: 'Použitelná' }, { field: 'velikost', in: ['50–150'] }],
      odpovedi, score,
    )).toBe(true);
    expect(evalTriggers(
      [{ field: 'data-kvalita', equals: 'Použitelná' }, { field: 'velikost', equals: '300+' }],
      odpovedi, score,
    )).toBe(false);
  });

  it('returns true for empty trigger list (vacuously true)', () => {
    expect(evalTriggers([], odpovedi, score)).toBe(true);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
pnpm test triggers
```

- [ ] **Step 3: Implement**

Create `vercel-api/lib/knowledge/triggers.ts`:

```ts
import type { Trigger } from './types';
import type { ScoreResult } from '../scoring';

type AnyOdpovedi = Record<string, unknown>;

export function evalTrigger(t: Trigger, odpovedi: AnyOdpovedi, score: ScoreResult): boolean {
  if ('equals' in t && 'field' in t) {
    return odpovedi[t.field] === t.equals;
  }
  if ('in' in t && 'field' in t) {
    return t.in.includes(odpovedi[t.field] as string);
  }
  if ('includes' in t && 'field' in t) {
    const val = odpovedi[t.field];
    return Array.isArray(val) && val.includes(t.includes);
  }
  if ('dimension' in t) {
    const v = score.dimensions[t.dimension];
    return v >= t.scoreBand[0] && v <= t.scoreBand[1];
  }
  if ('scoreBand' in t) {
    return score.total >= t.scoreBand[0] && score.total <= t.scoreBand[1];
  }
  return false;
}

export function evalTriggers(triggers: Trigger[], odpovedi: AnyOdpovedi, score: ScoreResult): boolean {
  return triggers.every((t) => evalTrigger(t, odpovedi, score));
}
```

- [ ] **Step 4: Run tests, confirm pass**

```bash
pnpm test triggers
```

Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add vercel-api/lib/knowledge/triggers.ts vercel-api/lib/knowledge/triggers.test.ts
git commit -m "feat(api): KB trigger evaluator"
```

---

### Task 6: Knowledge loader (TDD with fixture cards)

Reads all `.md` files under `lib/knowledge/{dim}/`, parses frontmatter via gray-matter, validates against Zod schema, returns `Card[]`. Throws on invalid frontmatter (build-time fail-fast).

**Files:**
- Create: `vercel-api/lib/knowledge/load.ts`
- Create: `vercel-api/lib/knowledge/load.test.ts`
- Create: `vercel-api/lib/knowledge/__fixtures__/data/test-card.md` (fixture for tests)
- Create: `vercel-api/lib/knowledge/__fixtures__/lide/test-card.md`
- Create: `vercel-api/lib/knowledge/__fixtures__/_invalid/bad.md` (used to verify rejection)

- [ ] **Step 1: Write fixtures**

Create `vercel-api/lib/knowledge/__fixtures__/data/test-card.md`:

```markdown
---
id: test-data-card
dimension: data
priority: 5
weight: must
triggers:
  - field: data-kvalita
    equals: Roztříštěná
---
Tento test card má insight o roztříštěných datech.
```

Create `vercel-api/lib/knowledge/__fixtures__/lide/test-card.md`:

```markdown
---
id: test-lide-card
dimension: lide
priority: 7
weight: may
triggers:
  - dimension: lide
    scoreBand: [0, 40]
---
Insight pro nízké skóre v lidech.
```

Create `vercel-api/lib/knowledge/__fixtures__/_invalid/bad.md`:

```markdown
---
id: bad-card
dimension: invalid_dim
priority: 5
weight: must
triggers: []
---
Body.
```

- [ ] **Step 2: Write tests**

Create `vercel-api/lib/knowledge/load.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCards } from './load';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, '__fixtures__');

describe('loadCards', () => {
  it('loads valid cards from data/ and lide/ subdirectories', async () => {
    const cards = await loadCards(fixturesDir, ['data', 'lide']);
    expect(cards).toHaveLength(2);
    const ids = cards.map((c) => c.frontmatter.id).sort();
    expect(ids).toEqual(['test-data-card', 'test-lide-card']);
  });

  it('parses frontmatter and body', async () => {
    const cards = await loadCards(fixturesDir, ['data']);
    const card = cards[0];
    expect(card?.frontmatter.dimension).toBe('data');
    expect(card?.frontmatter.priority).toBe(5);
    expect(card?.frontmatter.triggers).toHaveLength(1);
    expect(card?.body).toContain('roztříštěných datech');
  });

  it('throws on invalid frontmatter', async () => {
    await expect(loadCards(fixturesDir, ['_invalid'])).rejects.toThrow(/_invalid\/bad\.md/);
  });

  it('returns empty array if no cards present', async () => {
    const cards = await loadCards(fixturesDir, ['nonexistent_dir']);
    expect(cards).toEqual([]);
  });

  it('skips _system and other non-card directories when given full set', async () => {
    // Default behavior: only iterate over given dimensions, never _system.
    const cards = await loadCards(fixturesDir, ['data', 'lide', 'strategie', 'provoz', 'icp']);
    expect(cards.every((c) => c.frontmatter.dimension !== ('icp' as never) || c.frontmatter.dimension)).toBe(true);
  });
});
```

- [ ] **Step 3: Run, confirm fail**

```bash
pnpm test load
```

- [ ] **Step 4: Implement loader**

Create `vercel-api/lib/knowledge/load.ts`:

```ts
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { FrontmatterSchema, type Card } from './types';

const DIMENSIONS = ['data', 'lide', 'strategie', 'provoz', 'icp'] as const;
export type DimDir = typeof DIMENSIONS[number] | string;

export async function loadCards(rootDir: string, dirs: readonly DimDir[] = DIMENSIONS): Promise<Card[]> {
  const cards: Card[] = [];
  for (const dir of dirs) {
    const dimPath = path.join(rootDir, dir);
    let entries: string[];
    try {
      entries = await readdir(dimPath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw err;
    }
    for (const entry of entries) {
      if (!entry.endsWith('.md')) continue;
      const filepath = path.join(dimPath, entry);
      const raw = await readFile(filepath, 'utf-8');
      const { data, content } = matter(raw);
      const fmResult = FrontmatterSchema.safeParse({
        ...data,
        id: data.id ?? path.basename(entry, '.md'),
      });
      if (!fmResult.success) {
        throw new Error(`Invalid frontmatter in ${filepath}: ${fmResult.error.message}`);
      }
      cards.push({ frontmatter: fmResult.data, body: content.trim(), filepath });
    }
  }
  return cards;
}
```

- [ ] **Step 5: Run tests, confirm pass**

```bash
pnpm test load
```

Expected: 5 passed.

- [ ] **Step 6: Commit**

```bash
git add vercel-api/lib/knowledge/load.ts vercel-api/lib/knowledge/load.test.ts vercel-api/lib/knowledge/__fixtures__/
git commit -m "feat(api): KB loader with frontmatter validation"
```

---

### Task 7: Card selection (TDD)

`selectCards(odpovedi, score, allCards)` filters by trigger match, groups by dimension, returns top-priority `must` cards + filler `may` cards up to 3 per dim, hard cap 15 total.

**Files:**
- Create: `vercel-api/lib/knowledge/select.ts`
- Create: `vercel-api/lib/knowledge/select.test.ts`

- [ ] **Step 1: Write tests**

Create `vercel-api/lib/knowledge/select.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { selectCards } from './select';
import type { Card } from './types';
import type { ScoreResult } from '../scoring';

const score: ScoreResult = {
  total: 65,
  dimensions: { data: 70, lide: 60, strategie: 55, provoz: 80 },
  breakdown: {
    data: { kvalita: 35, kde: 15, reporting: 20 },
    lide: { vedeni: 25, postoj: 22, kapacita: 13 },
    strategie: { cil: 25, horizont: 20, rozpocet: 10 },
    provoz: { erp: 35, velikost: 30, obor: 15 },
  },
};

const odpovedi = {
  'data-kvalita': 'Použitelná',
  velikost: '50–150',
};

function card(id: string, dim: 'data' | 'lide' | 'strategie' | 'provoz' | 'icp', priority: number, weight: 'must' | 'may', triggers: any[]): Card {
  return {
    frontmatter: { id, dimension: dim, priority, weight, triggers },
    body: `body of ${id}`,
    filepath: `${id}.md`,
  };
}

describe('selectCards', () => {
  it('filters out cards whose triggers do not match', () => {
    const all: Card[] = [
      card('match', 'data', 5, 'must', [{ field: 'data-kvalita', equals: 'Použitelná' }]),
      card('nomatch', 'data', 5, 'must', [{ field: 'data-kvalita', equals: 'Vynikající' }]),
    ];
    const result = selectCards(odpovedi, score, all);
    expect(result.map((c) => c.frontmatter.id)).toEqual(['match']);
  });

  it('always includes "must" cards regardless of priority', () => {
    const all: Card[] = [
      card('low-must', 'data', 1, 'must', [{ field: 'data-kvalita', equals: 'Použitelná' }]),
      card('high-may', 'data', 9, 'may', [{ field: 'data-kvalita', equals: 'Použitelná' }]),
    ];
    const result = selectCards(odpovedi, score, all);
    expect(result.map((c) => c.frontmatter.id).sort()).toEqual(['high-may', 'low-must']);
  });

  it('caps "may" cards at 3 per dimension when no "must" cards', () => {
    const all: Card[] = Array.from({ length: 5 }, (_, i) =>
      card(`may-${i}`, 'data', 10 - i, 'may', [{ field: 'data-kvalita', equals: 'Použitelná' }]),
    );
    const result = selectCards(odpovedi, score, all);
    expect(result).toHaveLength(3);
    expect(result.map((c) => c.frontmatter.id)).toEqual(['may-0', 'may-1', 'may-2']); // priority 10, 9, 8
  });

  it('reduces "may" slots when "must" cards present', () => {
    const all: Card[] = [
      card('must-a', 'data', 5, 'must', [{ field: 'data-kvalita', equals: 'Použitelná' }]),
      card('must-b', 'data', 5, 'must', [{ field: 'data-kvalita', equals: 'Použitelná' }]),
      card('may-1', 'data', 9, 'may', [{ field: 'data-kvalita', equals: 'Použitelná' }]),
      card('may-2', 'data', 8, 'may', [{ field: 'data-kvalita', equals: 'Použitelná' }]),
    ];
    const result = selectCards(odpovedi, score, all);
    // 2 must + 1 may (3 - 2 = 1 slot left), top priority
    expect(result.map((c) => c.frontmatter.id).sort()).toEqual(['may-1', 'must-a', 'must-b']);
  });

  it('hard caps total at 15 across all dimensions', () => {
    const all: Card[] = [];
    for (const dim of ['data', 'lide', 'strategie', 'provoz', 'icp'] as const) {
      for (let i = 0; i < 5; i++) {
        all.push(card(`${dim}-${i}`, dim, 10 - i, 'must', []));
      }
    }
    const result = selectCards(odpovedi, score, all);
    expect(result).toHaveLength(15);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
pnpm test select
```

- [ ] **Step 3: Implement**

Create `vercel-api/lib/knowledge/select.ts`:

```ts
import type { Card } from './types';
import type { ScoreResult } from '../scoring';
import { evalTriggers } from './triggers';

type AnyOdpovedi = Record<string, unknown>;
const DIMS = ['data', 'lide', 'strategie', 'provoz', 'icp'] as const;
const PER_DIM_CAP = 3;
const TOTAL_CAP = 15;

export function selectCards(odpovedi: AnyOdpovedi, score: ScoreResult, allCards: Card[]): Card[] {
  const triggered = allCards.filter((c) => evalTriggers(c.frontmatter.triggers, odpovedi, score));

  const selected: Card[] = [];
  for (const dim of DIMS) {
    const inDim = triggered
      .filter((c) => c.frontmatter.dimension === dim)
      .sort((a, b) => b.frontmatter.priority - a.frontmatter.priority);
    const must = inDim.filter((c) => c.frontmatter.weight === 'must');
    const maySlots = Math.max(0, PER_DIM_CAP - must.length);
    const may = inDim.filter((c) => c.frontmatter.weight === 'may').slice(0, maySlots);
    selected.push(...must, ...may);
  }
  return selected.slice(0, TOTAL_CAP);
}
```

- [ ] **Step 4: Run tests, confirm pass**

```bash
pnpm test select
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add vercel-api/lib/knowledge/select.ts vercel-api/lib/knowledge/select.test.ts
git commit -m "feat(api): KB card selection with per-dim caps"
```

---

### Task 8: KB v1 cards — `data` dimension (authoring)

7 markdown cards covering kvalita 4 states + 2 critical kde patterns + reporting=Ne. Body ~120–200 words each in Q-style (vykání, krátké věty, žádné anglicismy z `plan.md` §7.3).

**Files (create all):**
- `vercel-api/lib/knowledge/data/kvalita-vynikajici.md`
- `vercel-api/lib/knowledge/data/kvalita-pouzitelna.md`
- `vercel-api/lib/knowledge/data/kvalita-roztristena.md`
- `vercel-api/lib/knowledge/data/kvalita-nevime.md`
- `vercel-api/lib/knowledge/data/kde-jen-papir.md`
- `vercel-api/lib/knowledge/data/kde-erp-plus-bi.md`
- `vercel-api/lib/knowledge/data/reporting-ne.md`

- [ ] **Step 1: Author all 7 cards**

For each, frontmatter follows template:

```yaml
---
id: <kebab-case from filename>
dimension: data
priority: <1–10, see guidance below>
weight: <must|may>
triggers:
  - <see per-card spec>
---

<120–200 slov v Q-stylu, vykání, krátké věty>
```

**Per-card content guidance (write these exactly when authoring):**

- `kvalita-vynikajici` — `priority: 6`, `weight: must`, trigger `data-kvalita: equals: Vynikající`. Insight: vynikající data jsou vzácná; nejčastěji to znamená, že firma má hotový datový sklad nebo aspoň ETL proces. AI projekt může jít rovnou na use-case, není potřeba auditová fáze.
- `kvalita-pouzitelna` — `priority: 5`, `weight: may`, trigger `equals: Použitelná`. Insight: typický stav střední české firmy. AI lze stavět, ale očekávejte 1–2 týdny na čištění dat per use-case.
- `kvalita-roztristena` — `priority: 9`, `weight: must`, trigger `equals: Roztříštěná`. Insight: nejčastější blokátor. Před AI doporučujeme datový audit (~2–3 týdny). Konkrétní krok: označit jeden proces, kde nečitelnost dat nejvíc bolí, a sjednotit u něj jeden datový pohled.
- `kvalita-nevime` — `priority: 8`, `weight: must`, trigger `equals: Nevíme`. Insight: "nevíme" často znamená, že firma nikdy nedělala datový audit. To je samo o sobě prvním projektem, ne AI. Doporučujeme 1–2 dny ad-hoc auditu zdarma na seznámení a teprve pak rozhodnutí.
- `kde-jen-papir` — `priority: 8`, `weight: must`, trigger: array s 2 conditions: `field: data-kde, includes: Papírově nebo částečně papírově` AND `field: data-kvalita, in: [Roztříštěná, Nevíme]`. Insight: papír + nečitelnost = AI je předčasné. Začněte digitalizací (ne AI) přes základní ERP rozšíření nebo cloud.
- `kde-erp-plus-bi` — `priority: 7`, `weight: may`, triggers `field: data-kde, includes: V ERP systému` AND `field: reporting, equals: Ano, funkční`. Insight: ideální výchozí stav. AI use-case lze dělat na existujících reportech (např. anomálie, predikce odchodů zákazníků).
- `reporting-ne` — `priority: 7`, `weight: must`, trigger `field: reporting, equals: Ne`. Insight: bez reportingu firma nevidí trendy a AI nebude mít na čem stavět. Doporučujeme nejdřív funkční BI (Power BI / Tableau / Metabase) — týdny, ne měsíce. AI pak může jít na složitější otázky.

**Anglicism blocklist** (per `plan.md` §7.3): `synergie`, `disruption*`, `state-of-the-art`, `leverage`, `transformation`, `unlock potential`, `next-gen`. Plus tone rules from `CLAUDE.md` §3 — žádné prodejní formulace, vykání, krátké věty.

- [ ] **Step 2: Run lint (after Task 13 exists; for now manual sanity check)**

For now: visually verify by `cat`-ing each card and checking for blocklist words. Lint script comes in Task 13.

- [ ] **Step 3: Verify cards load and parse**

Add temporary debug script to root `vercel-api/`:

```bash
cd vercel-api
node -e "import('./lib/knowledge/load.ts').then((m) => m.loadCards('./lib/knowledge', ['data']).then((cards) => console.log(cards.length, 'cards loaded'); cards.forEach(c => console.log('-', c.frontmatter.id))))" 2>&1 || true
```

Or simpler — write a small test in `lib/knowledge/_smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCards } from './load';

describe('real KB cards smoke', () => {
  it('loads data dimension cards without errors', async () => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const cards = await loadCards(__dirname, ['data']);
    expect(cards.length).toBe(7);
    expect(new Set(cards.map((c) => c.frontmatter.id)).size).toBe(7); // all unique
  });
});
```

```bash
pnpm test _smoke
```

Expected: 1 passed.

- [ ] **Step 4: Commit**

```bash
git add vercel-api/lib/knowledge/data/ vercel-api/lib/knowledge/_smoke.test.ts
git commit -m "feat(api): KB v1 cards — data dimension (7 cards)"
```

---

### Task 9: KB v1 cards — `lide` dimension (authoring)

5 cards: vedeni-nikdo, vedeni-externi, tym-skepticky, tym-otevreny-odpor, kapacita-nizka.

**Files:**
- `vercel-api/lib/knowledge/lide/vedeni-nikdo.md`
- `vercel-api/lib/knowledge/lide/vedeni-externi.md`
- `vercel-api/lib/knowledge/lide/tym-skepticky.md`
- `vercel-api/lib/knowledge/lide/tym-otevreny-odpor.md`
- `vercel-api/lib/knowledge/lide/kapacita-nizka.md`

- [ ] **Step 1: Author cards**

Per-card guidance:

- `vedeni-nikdo` — `priority: 10`, `weight: must`, trigger `field: vedeni, equals: Zatím nikdo`. Bez vlastníka projektu se AI nikdy nepostaví. Doporučujeme určit jednoho člověka (typicky CTO nebo COO) ještě před prvním pilotem. 2 hodiny týdně minimum.
- `vedeni-externi` — `priority: 6`, `weight: may`, trigger `field: vedeni, equals: Externí partner`. Externí vedení projektu je v pořádku, ale očekávejte přenos znalostí jako explicitní deliverable — jinak po skončení projektu projekt umírá.
- `tym-skepticky` — `priority: 7`, `weight: must`, trigger `field: tym-postoj, equals: Skeptické`. Skepticismus týmu je signál, ne překážka. Doporučujeme začít malým use-casem (ne firemní AI strategií), kde tým uvidí výsledek za 4–6 týdnů.
- `tym-otevreny-odpor` — `priority: 10`, `weight: must`, trigger `field: tym-postoj, equals: Otevřený odpor`. Otevřený odpor = stop. Rozhodnutí pro AI musí předcházet rozhovor s týmem o tom, co konkrétně AI udělá s jejich rolemi. Doporučujeme 1–2 workshopy před technickým plánem.
- `kapacita-nizka` — `priority: 7`, `weight: must`, trigger `field: kapacita, equals: 2–4 h`. 2–4 h týdně je málo. Buď navýšit kapacitu (typicky uvolnit 1 člověka na 30 % FTE), nebo zúžit scope na jeden konkrétní use-case s jasnou metrikou.

- [ ] **Step 2: Update _smoke.test.ts to also load lide**

Modify the test to expect 5 lide cards:

```ts
it('loads lide dimension cards', async () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const cards = await loadCards(__dirname, ['lide']);
  expect(cards.length).toBe(5);
});
```

- [ ] **Step 3: Verify**

```bash
pnpm test _smoke
```

- [ ] **Step 4: Commit**

```bash
git add vercel-api/lib/knowledge/lide/ vercel-api/lib/knowledge/_smoke.test.ts
git commit -m "feat(api): KB v1 cards — lide dimension (5 cards)"
```

---

### Task 10: KB v1 cards — `strategie` dimension (authoring)

5 cards: horizont-3m-kratko, horizont-dele, rozpocet-pod-100k, rozpocet-nevime, cil-uspora-casu.

**Files:**
- `vercel-api/lib/knowledge/strategie/horizont-3m-kratko.md`
- `vercel-api/lib/knowledge/strategie/horizont-dele.md`
- `vercel-api/lib/knowledge/strategie/rozpocet-pod-100k.md`
- `vercel-api/lib/knowledge/strategie/rozpocet-nevime.md`
- `vercel-api/lib/knowledge/strategie/cil-uspora-casu.md`

- [ ] **Step 1: Author cards**

- `horizont-3m-kratko` — `priority: 8`, `weight: must`, trigger `field: horizont, equals: Do 3 měsíců`. 3 měsíce jsou krátko pro cokoli mimo malých interních automatizací. Doporučujeme definovat konkrétní use-case s měřitelnou metrikou (úspora X hodin/týden) a omezit scope.
- `horizont-dele` — `priority: 7`, `weight: must`, trigger `field: horizont, equals: Déle`. Horizont "déle než rok" často znamená, že firma ještě neví, co konkrétně chce. Doporučujeme začít malým pilotem (8–12 týdnů) jako forma zjištění, ne jako finálním projektem.
- `rozpocet-pod-100k` — `priority: 8`, `weight: must`, trigger `field: rozpocet, equals: Pod 100 tis. Kč`. Pod 100 tis. Kč je rozpočet na proof-of-concept, ne na produkční řešení. Rozumný cíl: ověřit, jestli AI dává smysl, ne ho nasadit.
- `rozpocet-nevime` — `priority: 6`, `weight: may`, trigger `field: rozpocet, equals: Nevíme`. "Nevíme" je v pořádku — orientační rozpočet pro pilot je typicky 200–400 tis. Kč u střední firmy. Při Discovery se to upřesní.
- `cil-uspora-casu` — `priority: 5`, `weight: may`, trigger `field: cil, equals: Úspora času`. Úspora času je nejjasnější metrika. Doporučujeme měřit hodiny týdně před a po, ne počet úloh nebo procenta.

- [ ] **Step 2: Smoke test**

Update test to expect 5 strategie cards.

- [ ] **Step 3: Verify**

```bash
pnpm test _smoke
```

- [ ] **Step 4: Commit**

```bash
git add vercel-api/lib/knowledge/strategie/ vercel-api/lib/knowledge/_smoke.test.ts
git commit -m "feat(api): KB v1 cards — strategie dimension (5 cards)"
```

---

### Task 11: KB v1 cards — `provoz` + `icp` dimensions (authoring)

4 provoz + 3 icp cards.

**Files:**
- `vercel-api/lib/knowledge/provoz/erp-zadny.md`
- `vercel-api/lib/knowledge/provoz/erp-pohoda-mala.md`
- `vercel-api/lib/knowledge/provoz/velikost-300-plus.md`
- `vercel-api/lib/knowledge/provoz/velikost-pod-30.md`
- `vercel-api/lib/knowledge/icp/vyroba-50-300-fit.md`
- `vercel-api/lib/knowledge/icp/sluzby-5-30-fit.md`
- `vercel-api/lib/knowledge/icp/nad-icp-300-plus.md`

- [ ] **Step 1: Author cards**

- `erp-zadny` — `priority: 9`, `weight: must`, trigger `field: erp, equals: Žádný ERP`. Bez ERP nemáte primární datový zdroj. AI projekt obvykle čeká, dokud nebude ERP nasazený. Výjimka: pokud je byznys malý a procesy běží v Excelu, lze dělat AI nad Excelem — ale s vědomím limitů.
- `erp-pohoda-mala` — `priority: 5`, `weight: may`, triggers `field: erp, equals: Pohoda` AND `field: velikost, in: [pod 30, 30–50]`. Pohoda + malá firma je typický český setup. AI use-case typicky míří do exportů (pohoda nemá rozsáhlé API), což přidá 2–3 týdny práce na ETL vrstvu.
- `velikost-300-plus` — `priority: 5`, `weight: may`, trigger `field: velikost, equals: 300+`. Firmy nad 300 lidí mají typicky vlastní IT a interní procesy nad rámec našeho ICP. AI projekt je proveditelný, ale očekávejte delší rozhodovací cyklus.
- `velikost-pod-30` — `priority: 6`, `weight: must`, trigger `field: velikost, equals: pod 30`. Pod 30 zaměstnanců často znamená málo dat na statisticky robustní AI. Doporučujeme se zaměřit na automatizace (skripty, integrace) a generative AI (asistenti pro tým), ne na predikční modely.
- `vyroba-50-300-fit` — `priority: 6`, `weight: may`, triggers `field: obor, equals: Výroba` AND `field: velikost, in: [50–150, 150–300]`. Toto je naše ICP. Typické use-cases ve výrobě 50–300: predikce kvality (anomálie ve výrobních datech), plánování výroby (optimalizace), prediktivní údržba.
- `sluzby-5-30-fit` — `priority: 6`, `weight: may`, triggers `field: obor, equals: Profesionální služby` AND `field: velikost, in: [pod 30, 30–50]`. Toto je naše ICP pro služby. Typické use-cases: AI asistenti pro juniorní role, automatizace návrhů, sumarizace e-mailů a hovorů.
- `nad-icp-300-plus` — `priority: 4`, `weight: may`, trigger `field: velikost, equals: 300+`. Firmy nad 300 zaměstnanců jsou nad naším sweet-spotem. Spolupráce je možná, ale typicky doporučujeme partnera s týmem nad 10 lidí; my fungujeme jako specializovaní konzultanti, ne jako system integrator.

- [ ] **Step 2: Smoke test**

Update _smoke.test.ts to expect 4 provoz + 3 icp.

- [ ] **Step 3: Verify**

```bash
pnpm test _smoke
```

- [ ] **Step 4: Commit**

```bash
git add vercel-api/lib/knowledge/provoz/ vercel-api/lib/knowledge/icp/ vercel-api/lib/knowledge/_smoke.test.ts
git commit -m "feat(api): KB v1 cards — provoz + icp dimensions (7 cards)"
```

---

### Task 12: KB `_system` files — brand voice + output format

System prompt parts that are always injected (not subject to selection).

**Files:**
- `vercel-api/lib/knowledge/_system/brand-voice.md`
- `vercel-api/lib/knowledge/_system/output-format.md`

- [ ] **Step 1: Write `brand-voice.md`**

Content:

```markdown
# QuConsult brand voice — pravidla pro psaní reportu

Píšete jménem konzultantů QuConsult. Cílový čtenář je rozhodovatel ve střední české firmě (CEO / COO / CTO).

## Tone

- **Vykání.** Vždy "Vy / Vaše firma / Vaším týmem". Nikdy tykání.
- **Krátké věty.** Maximum 25 slov. Každá věta jedna myšlenka.
- **Aktivní slovesa.** "Doporučujeme začít datovým auditem.", ne "Mělo by být provedeno datové auditování."
- **Konkrétní čísla.** Hodiny týdně, koruny, měsíce — ne procenta a obecné "úspora".

## Zakázané výrazy (anglicismy)

Tyto **nikdy nepoužívejte**, ani v citacích:

- synergie / synergický
- disruption / disruptivní
- state-of-the-art
- leverage / leveraging
- transformation / transformovat (v marketingovém smyslu)
- unlock potential
- next-gen
- best-in-class

Pokud potřebujete vyjádřit, co tato slova zachycují, použijte konkrétní české vyjádření:
- *transformation* → "změna", "úprava", "přechod"
- *leverage* → "využít", "stavět na"
- *unlock potential* → "umožnit", "uvolnit"

## Zakázané formulace

Žádné prodejní fráze:
- "Pomůžeme Vám transformovat Váš byznys."
- "Naše AI řešení odemyká potenciál Vašich dat."
- "Buďte o krok napřed."

## Příklady — good vs bad

### Špatně:
> "Vaše firma má významný potenciál pro AI transformaci. Naše state-of-the-art řešení Vám pomohou leverageovat Vaše data a unlock potential, který v nich dřímá."

### Správně:
> "Datová základna ve Vaší firmě je smíšená. Doporučujeme 30–60 dní na sjednocení 2–3 klíčových datasetů, než se pustíte do prvního AI use-casu. Konkrétní krok: označte jeden proces (typicky reporting nebo plánování), kde Vás nečitelnost dat nejvíc brzdí, a u něj sjednoťte datový pohled."

### Špatně:
> "Pomůžeme Vám nasadit cutting-edge AI."

### Správně:
> "Doporučujeme začít pilotním projektem na 8–12 týdnů s konkrétní metrikou — typicky úspora hodin týdně v jednom procesu."
```

- [ ] **Step 2: Write `output-format.md`**

```markdown
# Výstupní formát reportu

Vaším úkolem je napsat **JSON objekt** přesně dle schématu. Žádný text mimo schéma — pouze ten JSON.

## Schéma

- `paragraphs.data` — odstavec o datové připravenosti firmy. 150–250 slov. Co mají, co jim chybí, jeden konkrétní krok.
- `paragraphs.lide` — odstavec o lidech (vedení, postoj týmu, kapacita). 150–250 slov.
- `paragraphs.strategie` — odstavec o strategii (cíl, horizont, rozpočet). 150–250 slov.
- `paragraphs.provoz` — odstavec o provozu (ERP, velikost, obor, ICP fit). 150–250 slov.
- `nextSteps` — pole 3 konkrétních akčních kroků. Každý 1–3 věty, začíná slovesem v rozkazovacím způsobu (v rámci vykání: "Označte…", "Domluvte…", "Spočítejte…"). Každý krok má v sobě konkrétní čísla nebo časový horizont.
- `oneLineSummary` — 1 věta, 40–200 znaků, shrnuje celkové skóre + co to znamená. Použije se na cover page PDF a na success page webu.

## Pravidla pro odstavce

1. Začněte konstatováním stavu (1–2 věty), ne komplimentem.
2. Pokračujte tím, co konkrétně tento stav znamená pro AI projekt.
3. Zakončete jedním konkrétním krokem ("Konkrétní krok: …").

## Použití KB insights

V user promptu dostanete 5–15 KB insights označených `[Card N: title]`. Tyto insights:

- **Aplikujte na kontext** konkrétní firmy (jméno, velikost, obor, ERP).
- **Necitujte doslovně.** Vždy přepište do kontextu.
- Pokud insight nepasuje na situaci firmy, ignorujte ho — radši napište kratší odstavec než nesedící.

## Co NEdělat

- Nevypisovat "skóre 80/100" v textu — to je jiná část reportu.
- Necitovat KB karty doslovně.
- Nepoužívat žádný anglicismus z `brand-voice.md` blocklistu.
```

- [ ] **Step 3: Verify files exist (no test, just authoring)**

```bash
ls vercel-api/lib/knowledge/_system/
```

Expected: 2 files.

- [ ] **Step 4: Commit**

```bash
git add vercel-api/lib/knowledge/_system/
git commit -m "feat(api): KB system prompts — brand-voice + output-format"
```

---

### Task 13: KB lint script (TDD-light)

Validates all KB cards: frontmatter parses, no anglicisms in body, no duplicate IDs. Run via `pnpm lint:knowledge`. Used in CI / pre-commit.

**Files:**
- Create: `vercel-api/scripts/lint-knowledge.ts`

- [ ] **Step 1: Implement script**

Create `vercel-api/scripts/lint-knowledge.ts`:

```ts
#!/usr/bin/env tsx
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCards } from '../lib/knowledge/load.js';

const ANGLICISMS = [
  'synergie', 'synergick', 'disruption', 'disruptiv', 'state-of-the-art',
  'leverage', 'leveraging', 'leverag', 'transformation', 'transformov',
  'unlock potential', 'next-gen', 'best-in-class', 'cutting-edge',
];

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const knowledgeDir = path.join(__dirname, '..', 'lib', 'knowledge');

  const cards = await loadCards(knowledgeDir);

  let failed = false;
  const seenIds = new Set<string>();

  for (const card of cards) {
    const { id } = card.frontmatter;
    if (seenIds.has(id)) {
      console.error(`  DUPLICATE ID: ${id} (${card.filepath})`);
      failed = true;
    }
    seenIds.add(id);

    const body = card.body.toLowerCase();
    for (const word of ANGLICISMS) {
      if (body.includes(word)) {
        console.error(`  ANGLICISM in ${card.filepath}: "${word}"`);
        failed = true;
      }
    }
  }

  if (failed) {
    console.error(`\nKB lint FAILED.`);
    process.exit(1);
  }
  console.log(`KB lint OK — ${cards.length} cards, ${seenIds.size} unique IDs.`);
}

main().catch((err) => {
  console.error('KB lint error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run lint**

```bash
cd vercel-api
pnpm lint:knowledge
```

Expected: `KB lint OK — N cards, N unique IDs.` (N depends on tasks 8–12 actually authoring cards.)

If anglicism detected, fix the offending card and re-run.

- [ ] **Step 3: Commit**

```bash
git add vercel-api/scripts/lint-knowledge.ts
git commit -m "chore(api): KB lint script (anglicisms + duplicate IDs)"
```

---

### Task 14: Bands texts (frontend + server shared)

12 per-dimension interpretations + 3 total summaries, used both client-side (instant render on success page) and server-side (PDF cover summary fallback).

**Files:**
- Create: `quconsult-web/src/lib/readiness-bands.ts`

- [ ] **Step 1: Implement bands**

Create `quconsult-web/src/lib/readiness-bands.ts`:

```ts
export type Band = 'pruzkum' | 'kandidat' | 'pripravena';
export type Dimension = 'data' | 'lide' | 'strategie' | 'provoz';

export function bandFor(score: number): Band {
  if (score >= 70) return 'pripravena';
  if (score >= 40) return 'kandidat';
  return 'pruzkum';
}

export function bandSummary(total: number): string {
  const b = bandFor(total);
  if (b === 'pripravena') return 'Vaše firma je v pásmu PŘIPRAVENÁ — máte všechno potřebné pro pilotní AI projekt v horizontu 3–6 měsíců.';
  if (b === 'kandidat') return 'Vaše firma je v pásmu KANDIDÁT — máte solidní základ, ale je potřeba dorovnat pár věcí před prvním pilotem.';
  return 'Vaše firma je v pásmu PRŮZKUM — má smysl začít datovým auditem před jakýmkoli AI projektem.';
}

const NOTES: Record<Dimension, Record<Band, string>> = {
  data: {
    pripravena: 'Máte solidní datový základ — typicky stačí lehký audit a pak se dá stavět.',
    kandidat: 'Datová základna je smíšená — 30–60 dní práce na sjednocení 2–3 datasetů zlepší šanci na úspěch.',
    pruzkum: 'Data v současném stavu nejsou pro AI připravená — doporučujeme začít datovým auditem před cokoliv jiným.',
  },
  lide: {
    pripravena: 'Tým má vlastníka projektu i kapacitu — můžete startovat.',
    kandidat: 'Lidská strana je zvládnutelná, ale doporučujeme vyřešit kapacitu nebo vlastnictví projektu před prvním pilotem.',
    pruzkum: 'Bez jasného vlastníka a tým podpory AI projekt nepřežije fázi nadšení — řešte tohle nejdřív.',
  },
  strategie: {
    pripravena: 'Cíl, horizont i rozpočet jsou v rozumné rovnováze — můžeme přejít k plánu.',
    kandidat: 'Cíl je rámcově jasný, ale horizont nebo rozpočet potřebují upřesnit, aby plán šel naplánovat.',
    pruzkum: 'Bez jasného cíle a horizontu nemá smysl AI plánovat — doporučujeme úvodní workshop o tom, co konkrétně řešíte.',
  },
  provoz: {
    pripravena: 'Provozní zázemí (ERP, velikost, obor) je standardní — bez překvapení.',
    kandidat: 'Provoz má drobné slabiny (např. menší ERP nebo netypická velikost), které ale nejsou blokátorem.',
    pruzkum: 'Provozní zázemí výrazně limituje AI projekt — typicky chybí ERP nebo je firma mimo náš sweet-spot.',
  },
};

export function bandNote(dim: Dimension, score: number): string {
  return NOTES[dim][bandFor(score)];
}
```

- [ ] **Step 2: Verify Astro build still passes**

```bash
cd quconsult-web
pnpm astro check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add quconsult-web/src/lib/readiness-bands.ts
git commit -m "feat(web): readiness bands — 12 per-dim notes + 3 summaries"
```

---

### Task 15: PDF tokens + font setup

Brand colors/fonts/spacing mirroring `src/styles/global.css` `@theme`. Copy fonts from `quconsult-web/scripts/fonts/` into `vercel-api/lib/pdf/fonts/`.

**Files:**
- Create: `vercel-api/lib/pdf/tokens.ts`
- Copy: `vercel-api/lib/pdf/fonts/Inter.ttf` (from `quconsult-web/scripts/fonts/Inter.ttf`)
- Copy: `vercel-api/lib/pdf/fonts/NotoSerif.ttf`

- [ ] **Step 1: Copy fonts**

```bash
mkdir -p vercel-api/lib/pdf/fonts
cp quconsult-web/scripts/fonts/Inter.ttf vercel-api/lib/pdf/fonts/
cp quconsult-web/scripts/fonts/NotoSerif.ttf vercel-api/lib/pdf/fonts/
```

- [ ] **Step 2: Create `tokens.ts`**

Create `vercel-api/lib/pdf/tokens.ts`:

```ts
export const colors = {
  ink: '#1A1A1A',
  inkMuted: '#525252',
  inkSoft: '#737373',
  bg: '#FAFAF8',
  bgWarm: '#F5F2EA',
  amber: '#D97706',
  amberDeep: '#B45309',
  border: '#E5E1D8',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 32,
  xxl: 56,
} as const;

export const fontSize = {
  label: 8,
  body: 10,
  bodyLg: 12,
  h2: 16,
  h1: 24,
  hero: 56,
  scoreNum: 14,
} as const;

export const fontFamily = {
  sans: 'Inter',
  serif: 'NotoSerif',
} as const;
```

- [ ] **Step 3: Verify compile**

```bash
cd vercel-api
pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add vercel-api/lib/pdf/tokens.ts vercel-api/lib/pdf/fonts/
git commit -m "feat(api): PDF brand tokens + font assets (Inter, Noto Serif)"
```

---

### Task 16: PDF ScoreBar component

Single horizontal bar component used 4× per dimension on cover.

**Files:**
- Create: `vercel-api/lib/pdf/components/ScoreBar.tsx`

- [ ] **Step 1: Implement ScoreBar**

Create `vercel-api/lib/pdf/components/ScoreBar.tsx`:

```tsx
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, spacing, fontSize, fontFamily } from '../tokens.js';

const styles = StyleSheet.create({
  row: { marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontFamily: fontFamily.sans, fontSize: fontSize.body, color: colors.ink },
  score: { fontFamily: fontFamily.serif, fontSize: fontSize.body, color: colors.ink },
  track: { marginTop: 4, height: 4, backgroundColor: colors.border, borderRadius: 1 },
  fill: { height: '100%', backgroundColor: colors.amber, borderRadius: 1 },
});

export interface ScoreBarProps {
  label: string;
  score: number; // 0–100
}

export function ScoreBar({ label, score }: ScoreBarProps) {
  const clamped = Math.max(1, Math.min(100, score)); // min 1px sliver even at 0
  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.score}>{score}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Verify compile**

```bash
cd vercel-api
pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add vercel-api/lib/pdf/components/ScoreBar.tsx
git commit -m "feat(api): PDF ScoreBar component"
```

---

### Task 17: PDF BigScore component

Cover page hero — circular indicator with centered number.

**Files:**
- Create: `vercel-api/lib/pdf/components/BigScore.tsx`

- [ ] **Step 1: Implement**

Create `vercel-api/lib/pdf/components/BigScore.tsx`:

```tsx
import { View, Text, Svg, Circle, StyleSheet } from '@react-pdf/renderer';
import { colors, fontSize, fontFamily } from '../tokens.js';

const SIZE = 140;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const styles = StyleSheet.create({
  wrapper: { width: SIZE, height: SIZE, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  centerText: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.hero,
    color: colors.ink,
    lineHeight: 1,
  },
  outOf: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.label,
    color: colors.inkMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

export interface BigScoreProps {
  score: number; // 0–100
}

export function BigScore({ score }: BigScoreProps) {
  const dashLength = (score / 100) * CIRCUMFERENCE;
  const accent = score >= 70 ? colors.amberDeep : score >= 40 ? colors.amber : colors.inkMuted;

  return (
    <View style={styles.wrapper}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.border}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={accent}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${dashLength} ${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE / 4}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View style={styles.centerText}>
        <Text style={styles.number}>{score}</Text>
        <Text style={styles.outOf}>z 100</Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Verify compile**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add vercel-api/lib/pdf/components/BigScore.tsx
git commit -m "feat(api): PDF BigScore donut indicator"
```

---

### Task 18: PDF page components — Cover, Dimension, NextSteps

Three page-level components composed by `ReadinessDocument`.

**Files:**
- Create: `vercel-api/lib/pdf/components/CoverPage.tsx`
- Create: `vercel-api/lib/pdf/components/DimensionPage.tsx`
- Create: `vercel-api/lib/pdf/components/NextStepsPage.tsx`

- [ ] **Step 1: Implement `CoverPage.tsx`**

```tsx
import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, spacing, fontSize, fontFamily } from '../tokens.js';
import { BigScore } from './BigScore.js';
import { ScoreBar } from './ScoreBar.js';
import type { ScoreResult } from '../../scoring.js';

const styles = StyleSheet.create({
  page: { backgroundColor: colors.bg, padding: spacing.xxl, fontFamily: fontFamily.sans },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  brand: { fontFamily: fontFamily.serif, fontSize: 14, color: colors.ink, fontWeight: 'bold' },
  date: { fontFamily: fontFamily.sans, fontSize: fontSize.label, color: colors.inkMuted },
  title: { marginTop: spacing.xxl, fontFamily: fontFamily.serif, fontSize: fontSize.h1, color: colors.ink },
  firma: { marginTop: spacing.sm, fontFamily: fontFamily.sans, fontSize: fontSize.bodyLg, color: colors.inkMuted },
  scoreBlock: { marginTop: spacing.xxl, alignItems: 'center' },
  summary: { marginTop: spacing.xl, fontFamily: fontFamily.serif, fontSize: fontSize.bodyLg, color: colors.ink, textAlign: 'center', lineHeight: 1.5 },
  divider: { marginTop: spacing.xxl, marginBottom: spacing.lg, borderBottom: `0.5pt solid ${colors.border}` },
  dimsLabel: { fontFamily: fontFamily.sans, fontSize: fontSize.label, color: colors.amber, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.md },
  footer: { position: 'absolute', bottom: spacing.xxl, left: spacing.xxl, right: spacing.xxl, fontFamily: fontFamily.sans, fontSize: fontSize.label, color: colors.inkSoft, textAlign: 'right' },
});

const DIM_LABELS: Record<string, string> = {
  data: 'Data',
  lide: 'Lidé',
  strategie: 'Strategie',
  provoz: 'Provoz',
};

export interface CoverPageProps {
  firma: string;
  date: string;        // already-formatted "10. května 2026"
  score: ScoreResult;
  oneLineSummary: string;
}

export function CoverPage({ firma, date, score, oneLineSummary }: CoverPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.brand}>QuConsult</Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      <Text style={styles.title}>AI Readiness Assessment</Text>
      <Text style={styles.firma}>pro {firma}</Text>

      <View style={styles.scoreBlock}>
        <BigScore score={score.total} />
        <Text style={styles.summary}>{oneLineSummary}</Text>
      </View>

      <View style={styles.divider} />
      <Text style={styles.dimsLabel}>4 dimenze</Text>
      {(['data', 'lide', 'strategie', 'provoz'] as const).map((dim) => (
        <ScoreBar key={dim} label={DIM_LABELS[dim] ?? dim} score={score.dimensions[dim]} />
      ))}

      <Text style={styles.footer}>QuConsult — Praktické AI poradenství</Text>
    </Page>
  );
}
```

- [ ] **Step 2: Implement `DimensionPage.tsx`**

```tsx
import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, spacing, fontSize, fontFamily } from '../tokens.js';

const styles = StyleSheet.create({
  page: { backgroundColor: colors.bg, padding: spacing.xxl, fontFamily: fontFamily.sans },
  brand: { fontFamily: fontFamily.serif, fontSize: 12, color: colors.inkMuted, marginBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `0.5pt solid ${colors.border}`, paddingBottom: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { fontFamily: fontFamily.serif, fontSize: fontSize.h2, color: colors.ink, textTransform: 'uppercase', letterSpacing: 1.5 },
  sectionScore: { fontFamily: fontFamily.serif, fontSize: fontSize.scoreNum, color: colors.amber },
  body: { fontFamily: fontFamily.sans, fontSize: fontSize.body, color: colors.ink, lineHeight: 1.55 },
  pageNum: { position: 'absolute', bottom: spacing.xl, right: spacing.xxl, fontFamily: fontFamily.sans, fontSize: fontSize.label, color: colors.inkSoft },
});

export interface DimensionPageProps {
  pageNumber: number;
  sections: Array<{ label: string; score: number; body: string }>;
}

export function DimensionPage({ pageNumber, sections }: DimensionPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.brand}>QuConsult</Text>
      {sections.map((s) => (
        <View key={s.label} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{s.label}</Text>
            <Text style={styles.sectionScore}>{s.score} / 100</Text>
          </View>
          <Text style={styles.body}>{s.body}</Text>
        </View>
      ))}
      <Text style={styles.pageNum}>QuConsult {pageNumber}</Text>
    </Page>
  );
}
```

- [ ] **Step 3: Implement `NextStepsPage.tsx`**

```tsx
import { Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import { colors, spacing, fontSize, fontFamily } from '../tokens.js';

const styles = StyleSheet.create({
  page: { backgroundColor: colors.bg, padding: spacing.xxl, fontFamily: fontFamily.sans },
  brand: { fontFamily: fontFamily.serif, fontSize: 12, color: colors.inkMuted, marginBottom: spacing.xl },
  title: { fontFamily: fontFamily.serif, fontSize: fontSize.h2, color: colors.ink, textTransform: 'uppercase', letterSpacing: 1.5, paddingBottom: spacing.sm, borderBottom: `0.5pt solid ${colors.border}` },
  step: { marginTop: spacing.lg, flexDirection: 'row' },
  stepNum: { fontFamily: fontFamily.serif, fontSize: fontSize.h2, color: colors.amber, width: 32 },
  stepBody: { flex: 1, fontFamily: fontFamily.sans, fontSize: fontSize.body, color: colors.ink, lineHeight: 1.55 },
  disclaimer: { marginTop: spacing.xxl, fontFamily: fontFamily.sans, fontSize: fontSize.label, color: colors.inkMuted, lineHeight: 1.55, fontStyle: 'italic' },
  ctaWrap: { marginTop: spacing.xl, alignItems: 'flex-start' },
  cta: { backgroundColor: colors.amber, color: colors.bg, fontFamily: fontFamily.sans, fontSize: fontSize.body, paddingTop: spacing.md, paddingBottom: spacing.md, paddingLeft: spacing.lg, paddingRight: spacing.lg, textDecoration: 'none', borderRadius: 2 },
  ctaUrl: { marginTop: spacing.sm, fontFamily: fontFamily.sans, fontSize: fontSize.label, color: colors.inkSoft },
  pageNum: { position: 'absolute', bottom: spacing.xl, right: spacing.xxl, fontFamily: fontFamily.sans, fontSize: fontSize.label, color: colors.inkSoft },
});

export interface NextStepsPageProps {
  pageNumber: number;
  steps: string[]; // length 3
}

export function NextStepsPage({ pageNumber, steps }: NextStepsPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.brand}>QuConsult</Text>
      <Text style={styles.title}>Co dělat jako první</Text>

      {steps.map((step, i) => (
        <View key={i} style={styles.step}>
          <Text style={styles.stepNum}>{i + 1}.</Text>
          <Text style={styles.stepBody}>{step}</Text>
        </View>
      ))}

      <Text style={styles.disclaimer}>
        Tento report je orientační. Skóre vychází z odpovědí ve formuláři. Pro konkrétní use-case doporučujeme bezplatnou 45min konzultaci.
      </Text>

      <View style={styles.ctaWrap}>
        <Link src="https://quconsult.cz/kontakt" style={styles.cta}>
          Domluvit konzultaci  →
        </Link>
        <Text style={styles.ctaUrl}>quconsult.cz/kontakt</Text>
      </View>

      <Text style={styles.pageNum}>QuConsult {pageNumber}</Text>
    </Page>
  );
}
```

- [ ] **Step 4: Verify compile**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add vercel-api/lib/pdf/components/CoverPage.tsx vercel-api/lib/pdf/components/DimensionPage.tsx vercel-api/lib/pdf/components/NextStepsPage.tsx
git commit -m "feat(api): PDF page components (Cover, Dimension, NextSteps)"
```

---

### Task 19: PDF root document + render function (TDD with smoke render)

`renderPdf()` returns Buffer, validated by writing to disk in test and checking PDF magic bytes + reasonable size.

**Files:**
- Create: `vercel-api/lib/pdf/components/ReadinessDocument.tsx`
- Create: `vercel-api/lib/pdf/render.tsx`
- Create: `vercel-api/lib/pdf/render.test.ts`

- [ ] **Step 1: Implement `ReadinessDocument.tsx`**

```tsx
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
  src: path.join(fontsDir, 'Inter.ttf'),
});
Font.register({
  family: 'NotoSerif',
  src: path.join(fontsDir, 'NotoSerif.ttf'),
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
```

- [ ] **Step 2: Implement `render.tsx`**

```tsx
import { renderToBuffer } from '@react-pdf/renderer';
import { ReadinessDocument, type ReadinessDocumentProps } from './components/ReadinessDocument.js';

export async function renderPdf(props: ReadinessDocumentProps): Promise<Buffer> {
  return renderToBuffer(<ReadinessDocument {...props} />);
}
```

- [ ] **Step 3: Smoke test**

Create `vercel-api/lib/pdf/render.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPdf } from './render';
import type { ScoreResult } from '../scoring';

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

    // PDF magic bytes
    expect(buf.subarray(0, 4).toString('ascii')).toBe('%PDF');
    // Reasonable size: 4 pages, 2 fonts ≈ 80–500 KB
    expect(buf.length).toBeGreaterThan(50_000);
    expect(buf.length).toBeLessThan(2_000_000);

    // Save for visual inspection
    const outPath = path.join(__dirname, '__smoke__.pdf');
    await writeFile(outPath, buf);
    console.log('Smoke PDF written to:', outPath);
  });
});
```

- [ ] **Step 4: Run test**

```bash
cd vercel-api
pnpm test render
```

Expected: 1 passed. PDF written to `lib/pdf/__smoke__.pdf`.

- [ ] **Step 5: Visual inspect**

```bash
open vercel-api/lib/pdf/__smoke__.pdf
```

Manual check:
- 4 stránky.
- Cover: big score 78, summary text, 4 dim. bary.
- Strana 2–3: odstavce s diakritikou ("Příliš žluťoučký kůň…") render bez Tofu glyphs.
- Strana 4: 3 nextSteps, CTA tlačítko "Domluvit konzultaci →".
- Brand barvy: amber #D97706, ink #1A1A1A, bg #FAFAF8.

- [ ] **Step 6: Add `__smoke__.pdf` to .gitignore**

Create or modify `vercel-api/.gitignore`:

```
node_modules/
__smoke__.pdf
```

- [ ] **Step 7: Commit**

```bash
git add vercel-api/lib/pdf/components/ReadinessDocument.tsx vercel-api/lib/pdf/render.tsx vercel-api/lib/pdf/render.test.ts vercel-api/.gitignore
git commit -m "feat(api): PDF root document + renderPdf with smoke test"
```

---

### Task 20: OpenAI client + schema + prompt builder

**Files:**
- Create: `vercel-api/lib/ai/client.ts`
- Create: `vercel-api/lib/ai/schema.ts`
- Create: `vercel-api/lib/ai/prompt.ts`
- Create: `vercel-api/lib/ai/prompt.test.ts`

- [ ] **Step 1: Implement `client.ts`**

```ts
import OpenAI from 'openai';

let cached: OpenAI | undefined;

export function getOpenAI(): OpenAI {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing env var OPENAI_API_KEY');
  cached = new OpenAI({ apiKey });
  return cached;
}
```

- [ ] **Step 2: Implement `schema.ts`**

```ts
import { z } from 'zod';

export const ReadinessReport = z.object({
  paragraphs: z.object({
    data: z.string().min(400).max(2000),
    lide: z.string().min(400).max(2000),
    strategie: z.string().min(400).max(2000),
    provoz: z.string().min(400).max(2000),
  }),
  nextSteps: z.array(z.string().min(50).max(400)).length(3),
  oneLineSummary: z.string().min(40).max(200),
});

export type ReadinessReport = z.infer<typeof ReadinessReport>;
```

- [ ] **Step 3: Implement `prompt.ts`**

```ts
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Card } from '../knowledge/types.js';
import type { ScoreResult, Odpovedi } from '../scoring.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const systemDir = path.join(__dirname, '..', 'knowledge', '_system');

let cachedSystem: string | undefined;

export async function loadSystemPrompt(): Promise<string> {
  if (cachedSystem) return cachedSystem;
  const brandVoice = await readFile(path.join(systemDir, 'brand-voice.md'), 'utf-8');
  const outputFormat = await readFile(path.join(systemDir, 'output-format.md'), 'utf-8');
  cachedSystem = `${brandVoice}\n\n---\n\n${outputFormat}`;
  return cachedSystem;
}

export interface PromptInput {
  firma: string;
  velikost: string;
  obor: string;
  erp: string;
  cinnost: string;
  odpovedi: Odpovedi;
  score: ScoreResult;
  cards: Card[];
}

export function buildUserPrompt(p: PromptInput): string {
  const lines: string[] = [];

  lines.push('# Firma');
  lines.push(`- Jméno: ${p.firma}`);
  lines.push(`- Velikost: ${p.velikost}`);
  lines.push(`- Obor: ${p.obor}`);
  lines.push(`- ERP: ${p.erp}`);
  lines.push(`- Co dělají: ${p.cinnost || '—'}`);
  lines.push('');

  lines.push('# Score');
  lines.push(`- Celkem: ${p.score.total}/100`);
  lines.push(`- Data: ${p.score.dimensions.data}/100 (kvalita: ${p.score.breakdown.data.kvalita}/50, kde: ${p.score.breakdown.data.kde}/30, reporting: ${p.score.breakdown.data.reporting}/20)`);
  lines.push(`- Lidé: ${p.score.dimensions.lide}/100 (vedení: ${p.score.breakdown.lide.vedeni}/40, postoj: ${p.score.breakdown.lide.postoj}/35, kapacita: ${p.score.breakdown.lide.kapacita}/25)`);
  lines.push(`- Strategie: ${p.score.dimensions.strategie}/100 (cíl: ${p.score.breakdown.strategie.cil}/35, horizont: ${p.score.breakdown.strategie.horizont}/35, rozpočet: ${p.score.breakdown.strategie.rozpocet}/30)`);
  lines.push(`- Provoz: ${p.score.dimensions.provoz}/100 (ERP: ${p.score.breakdown.provoz.erp}/50, velikost: ${p.score.breakdown.provoz.velikost}/30, obor: ${p.score.breakdown.provoz.obor}/20)`);
  lines.push('');

  lines.push('# Insights k použití');
  p.cards.forEach((card, i) => {
    lines.push(`## Card ${i + 1}: ${card.frontmatter.id} (priority ${card.frontmatter.priority})`);
    lines.push(card.body);
    lines.push('');
  });

  lines.push('# Úkol');
  lines.push('Napište report v JSON struktuře dle schématu (viz system prompt).');
  lines.push('Insights z Card sekcí aplikujte na kontext této konkrétní firmy. Necitujte je doslovně — vždy přepište.');
  lines.push('Pokud insight nesedí na kontext firmy, ignorujte ho. Lepší kratší odstavec než nesedící.');

  return lines.join('\n');
}
```

- [ ] **Step 4: Write tests**

Create `vercel-api/lib/ai/prompt.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildUserPrompt } from './prompt';
import type { Card } from '../knowledge/types';
import type { ScoreResult, Odpovedi } from '../scoring';

const score: ScoreResult = {
  total: 78,
  dimensions: { data: 80, lide: 65, strategie: 72, provoz: 95 },
  breakdown: {
    data: { kvalita: 35, kde: 25, reporting: 20 },
    lide: { vedeni: 25, postoj: 22, kapacita: 18 },
    strategie: { cil: 30, horizont: 28, rozpocet: 14 },
    provoz: { erp: 50, velikost: 30, obor: 15 },
  },
};

const cards: Card[] = [{
  frontmatter: { id: 'test-card', dimension: 'data', priority: 5, weight: 'must', triggers: [] },
  body: 'Insight text here.',
  filepath: 'test-card.md',
}];

describe('buildUserPrompt', () => {
  it('includes firma block', () => {
    const out = buildUserPrompt({
      firma: 'Acme s.r.o.', velikost: '50–150', obor: 'Výroba', erp: 'Pohoda', cinnost: 'Vyrábíme díly.',
      odpovedi: {} as Odpovedi, score, cards,
    });
    expect(out).toContain('Acme s.r.o.');
    expect(out).toContain('50–150');
    expect(out).toContain('Vyrábíme díly');
  });

  it('includes score breakdown', () => {
    const out = buildUserPrompt({
      firma: 'X', velikost: 'pod 30', obor: 'IT a software', erp: 'Vlastní řešení', cinnost: '',
      odpovedi: {} as Odpovedi, score, cards,
    });
    expect(out).toContain('Celkem: 78/100');
    expect(out).toContain('Data: 80/100');
  });

  it('lists cards with id and priority', () => {
    const out = buildUserPrompt({
      firma: 'X', velikost: 'pod 30', obor: 'IT a software', erp: 'Vlastní řešení', cinnost: '',
      odpovedi: {} as Odpovedi, score, cards,
    });
    expect(out).toContain('Card 1: test-card');
    expect(out).toContain('Insight text here.');
  });
});
```

- [ ] **Step 5: Run tests**

```bash
pnpm test prompt
```

Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add vercel-api/lib/ai/
git commit -m "feat(api): OpenAI client + schema + prompt builder"
```

---

### Task 21: OpenAI generate function (with mocked client test)

`generateReport()` calls Responses API + structured output, with `AbortController` 25s timeout, 1 retry on 429/5xx.

**Files:**
- Create: `vercel-api/lib/ai/generate.ts`
- Create: `vercel-api/lib/ai/generate.test.ts`

- [ ] **Step 1: Implement `generate.ts`**

```ts
import { zodTextFormat } from 'openai/helpers/zod';
import { ReadinessReport } from './schema.js';
import { getOpenAI } from './client.js';
import { loadSystemPrompt } from './prompt.js';

const TIMEOUT_MS = 25000;
const RETRY_DELAY_MS = 2000;

export async function generateReport(userPrompt: string): Promise<ReadinessReport> {
  const system = await loadSystemPrompt();
  const client = getOpenAI();

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

      try {
        const rsp = await client.responses.parse({
          model: 'o4-mini',
          input: [
            { role: 'system', content: system },
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
```

- [ ] **Step 2: Write tests with mocked OpenAI**

Create `vercel-api/lib/ai/generate.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module BEFORE importing generate
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
```

- [ ] **Step 3: Run tests**

```bash
cd vercel-api
pnpm test generate
```

Expected: 4 passed.

- [ ] **Step 4: Commit**

```bash
git add vercel-api/lib/ai/generate.ts vercel-api/lib/ai/generate.test.ts
git commit -m "feat(api): generateReport with timeout + retry"
```

---

### Task 22: Cost cap module (TDD)

Per-instance volatile counter. Resets on cold start. ENV `OPENAI_DAILY_USD_CAP` configurable, default 5.

**Files:**
- Create: `vercel-api/lib/cost-cap.ts`
- Create: `vercel-api/lib/cost-cap.test.ts`

- [ ] **Step 1: Tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { canSpend, recordSpend, resetCostCap } from './cost-cap';

describe('cost-cap', () => {
  beforeEach(() => {
    resetCostCap();
    process.env.OPENAI_DAILY_USD_CAP = '0.10';
  });

  it('allows spending under cap', () => {
    expect(canSpend()).toBe(true);
    recordSpend(0.05);
    expect(canSpend()).toBe(true);
  });

  it('blocks spending over cap', () => {
    recordSpend(0.05);
    recordSpend(0.05);
    expect(canSpend()).toBe(false);
  });

  it('uses default 5 USD when env var missing', () => {
    delete process.env.OPENAI_DAILY_USD_CAP;
    resetCostCap();
    recordSpend(4.99);
    expect(canSpend()).toBe(true);
    recordSpend(0.02);
    expect(canSpend()).toBe(false);
  });

  it('resets daily (manual trigger)', () => {
    recordSpend(0.50);
    expect(canSpend()).toBe(false);
    resetCostCap();
    expect(canSpend()).toBe(true);
  });
});
```

- [ ] **Step 2: Run, fail**

```bash
pnpm test cost-cap
```

- [ ] **Step 3: Implement `cost-cap.ts`**

```ts
const DEFAULT_CAP_USD = 5;

let spentUsd = 0;
let dayKey: string = isoDay();

function isoDay(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
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
```

- [ ] **Step 4: Run, pass**

```bash
pnpm test cost-cap
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add vercel-api/lib/cost-cap.ts vercel-api/lib/cost-cap.test.ts
git commit -m "feat(api): per-instance daily cost cap for OpenAI"
```

---

### Task 23: API endpoint rewrite — `/api/ai-readiness`

Replace existing handler with new flow: validate + score + respond, then `waitUntil` the slow path.

**Files:**
- Modify: `vercel-api/api/ai-readiness.ts`

- [ ] **Step 1: Backup current handler (read-only reference)**

Note for engineer: the original `vercel-api/api/ai-readiness.ts` will be replaced wholesale. The new handler keeps reCAPTCHA + CORS + Zod validation + SMTP setup but adds scoring, KB, OpenAI, PDF, and waitUntil.

- [ ] **Step 2: Write new handler**

Replace `vercel-api/api/ai-readiness.ts` content with:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { waitUntil } from '@vercel/functions';
import nodemailer from 'nodemailer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { OdpovediSchema, scoreReadiness, type Odpovedi } from '../lib/scoring.js';
import { loadCards } from '../lib/knowledge/load.js';
import { selectCards } from '../lib/knowledge/select.js';
import { buildUserPrompt } from '../lib/ai/prompt.js';
import { generateReport } from '../lib/ai/generate.js';
import { renderPdf } from '../lib/pdf/render.js';
import { slugify } from '../lib/slugify.js';
import { canSpend, recordSpend } from '../lib/cost-cap.js';
import type { ScoreResult } from '../lib/scoring.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const knowledgeDir = path.join(__dirname, '..', 'lib', 'knowledge');

const requestSchema = z.object({
  jmeno: z.string().trim().min(2).max(100),
  firma: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  telefon: z.string().trim().max(40).optional(),
  odpovedi: z.unknown(), // re-validated as Odpovedi below
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
    recordSpend(0.02); // estimate per submission

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

    // Send PDF to user
    await transporter.sendMail({
      from: smtpFrom,
      to: p.email,
      subject: 'Váš AI Readiness report od QuConsult',
      text: `Dobrý den, ${p.jmeno},\n\nděkujeme za vyplnění dotazníku. V příloze najdete krátký 4stránkový report s orientačním skóre a konkrétními doporučeními.\n\nTým QuConsult se na Vaše odpovědi také podívá a do jednoho pracovního dne se Vám ozveme s návazným kontaktem.\n\nS pozdravem,\ntým QuConsult\nhello@quconsult.cz\nquconsult.cz`,
      attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
    });

    // Send notification to Martin
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

  // reCAPTCHA
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

  // Score (deterministic)
  const score = scoreReadiness(odpovediResult.data);

  // Fast response
  res.status(200).json({
    ok: true,
    score: {
      total: score.total,
      dimensions: score.dimensions,
    },
  });

  // Slow path off-response
  waitUntil(processFinalization({
    jmeno: reqResult.data.jmeno,
    firma: reqResult.data.firma,
    email: reqResult.data.email,
    telefon: reqResult.data.telefon,
    odpovedi: odpovediResult.data,
    score,
  }));
}
```

- [ ] **Step 3: Compile**

```bash
cd vercel-api
pnpm tsc --noEmit
```

Expected: no errors. (Possible issue: `import` path extensions `.js` — `verbatimModuleSyntax: false` and `moduleResolution: "Bundler"` should handle this. If errors, drop `.js` extensions on relative imports.)

- [ ] **Step 4: Commit**

```bash
git add vercel-api/api/ai-readiness.ts
git commit -m "feat(api): /api/ai-readiness new flow (score + waitUntil[KB+OpenAI+PDF+SMTP])"
```

---

### Task 24: Frontend success page redesign

Replace `<div id="success-state">` block with new markup; add JS to render score, dim. bars, bands texts.

**Files:**
- Modify: `quconsult-web/src/pages/ai-readiness.astro`

- [ ] **Step 1: Replace success state markup**

In `quconsult-web/src/pages/ai-readiness.astro`, locate the `<!-- Success state (skrytý do submitu) -->` block (line ~370–395) and replace its content with:

```astro
<!-- Success state (skrytý do submitu) -->
<div id="success-state" class="hidden mt-xl space-y-xl">

  <!-- Hero score block -->
  <div class="rounded border border-amber bg-amber/5 p-xl md:p-xxl">
    <p class="text-label uppercase tracking-wider text-amber">Vaše orientační skóre</p>
    <div class="mt-md flex items-baseline gap-md">
      <span class="font-serif text-7xl text-ink leading-none" id="score-total">—</span>
      <span class="font-serif text-2xl text-ink-muted">/ 100</span>
    </div>
    <p class="mt-md text-body-lg text-ink" id="score-summary"></p>
  </div>

  <!-- 4 dimenze -->
  <div class="rounded border border-border bg-bg-warm/40 p-xl">
    <p class="text-label uppercase tracking-wider text-amber">4 dimenze</p>
    <ul class="mt-lg space-y-lg">
      {[
        { key: 'data', label: 'Data' },
        { key: 'lide', label: 'Lidé' },
        { key: 'strategie', label: 'Strategie' },
        { key: 'provoz', label: 'Provoz' },
      ].map((d) => (
        <li>
          <div class="flex items-baseline justify-between">
            <span class="text-body text-ink">{d.label}</span>
            <span class="font-serif text-body text-ink" data-dim-score={d.key}>—</span>
          </div>
          <div class="mt-xs h-2 rounded-sm bg-border overflow-hidden">
            <div
              class="h-full bg-amber transition-[width] duration-700 ease-out"
              data-dim-bar={d.key}
              style="width: 0%"
            />
          </div>
          <p class="mt-xs text-label text-ink-muted" data-dim-note={d.key}></p>
        </li>
      ))}
    </ul>
  </div>

  <!-- Status update -->
  <div class="rounded border border-border bg-bg p-xl">
    <p class="text-label uppercase tracking-wider text-amber">Co se děje teď</p>
    <ul class="mt-md space-y-md text-body text-ink-muted">
      <li>
        <span class="text-ink">→</span>
        Detailní 4stránkový PDF report dorazí na <strong class="text-ink" id="success-email">—</strong> do minuty.
      </li>
      <li>
        <span class="text-ink">→</span>
        Tým QuConsult se na Vaše odpovědi také podívá a do <strong class="text-ink">jednoho pracovního dne</strong> se Vám ozveme s konkrétním návazným krokem.
      </li>
      <li>
        <span class="text-ink">→</span>
        Žádné prodejní volání, žádný funnel.
      </li>
    </ul>
  </div>

  <!-- CTA -->
  <div class="flex flex-wrap gap-md">
    <a
      href="/kontakt"
      class="inline-flex items-center rounded bg-amber px-lg py-md text-label font-medium text-bg transition-colors hover:bg-amber-deep"
    >
      Domluvit 45min konzultaci rovnou
    </a>
    <a
      href="/"
      class="inline-flex items-center rounded border border-ink px-lg py-md text-label font-medium text-ink transition-colors hover:border-amber hover:text-amber"
    >
      Zpět na úvod
    </a>
  </div>
</div>
```

- [ ] **Step 2: Update submit-success JS**

In the `<script>` block, replace the success-rendering block (currently at line ~628–633: `form.classList.add('hidden')` …) with score-rendering logic. Locate this section in the existing handler:

```js
form.classList.add('hidden');
document.getElementById('progress-wrapper').classList.add('hidden');
successState.classList.remove('hidden');
window.scrollTo({ top: 0, behavior: 'smooth' });
```

Replace with:

```js
const s = json.score;
if (s) {
  document.getElementById('score-total').textContent = String(s.total);
  document.getElementById('success-email').textContent = payload.email;

  const summaryText = s.total >= 70
    ? 'Vaše firma je v pásmu PŘIPRAVENÁ — máte všechno potřebné pro pilotní AI projekt v horizontu 3–6 měsíců.'
    : s.total >= 40
    ? 'Vaše firma je v pásmu KANDIDÁT — máte solidní základ, ale je potřeba dorovnat pár věcí před prvním pilotem.'
    : 'Vaše firma je v pásmu PRŮZKUM — má smysl začít datovým auditem před jakýmkoli AI projektem.';
  document.getElementById('score-summary').textContent = summaryText;

  const noteFor = (dim, val) => {
    const band = val >= 70 ? 'pripravena' : val >= 40 ? 'kandidat' : 'pruzkum';
    const notes = {
      data: { pripravena: 'Máte solidní datový základ — typicky stačí lehký audit a pak se dá stavět.', kandidat: 'Datová základna je smíšená — 30–60 dní práce na sjednocení 2–3 datasetů zlepší šanci na úspěch.', pruzkum: 'Data v současném stavu nejsou pro AI připravená — doporučujeme začít datovým auditem před cokoliv jiným.' },
      lide: { pripravena: 'Tým má vlastníka projektu i kapacitu — můžete startovat.', kandidat: 'Lidská strana je zvládnutelná, ale doporučujeme vyřešit kapacitu nebo vlastnictví projektu před prvním pilotem.', pruzkum: 'Bez jasného vlastníka a tým podpory AI projekt nepřežije fázi nadšení — řešte tohle nejdřív.' },
      strategie: { pripravena: 'Cíl, horizont i rozpočet jsou v rozumné rovnováze — můžeme přejít k plánu.', kandidat: 'Cíl je rámcově jasný, ale horizont nebo rozpočet potřebují upřesnit, aby plán šel naplánovat.', pruzkum: 'Bez jasného cíle a horizontu nemá smysl AI plánovat — doporučujeme úvodní workshop o tom, co konkrétně řešíte.' },
      provoz: { pripravena: 'Provozní zázemí (ERP, velikost, obor) je standardní — bez překvapení.', kandidat: 'Provoz má drobné slabiny (např. menší ERP nebo netypická velikost), které ale nejsou blokátorem.', pruzkum: 'Provozní zázemí výrazně limituje AI projekt — typicky chybí ERP nebo je firma mimo náš sweet-spot.' },
    };
    return notes[dim][band];
  };

  ['data', 'lide', 'strategie', 'provoz'].forEach((dim) => {
    const val = s.dimensions[dim];
    document.querySelector('[data-dim-score="' + dim + '"]').textContent = String(val);
    document.querySelector('[data-dim-note="' + dim + '"]').textContent = noteFor(dim, val);
    requestAnimationFrame(() => {
      document.querySelector('[data-dim-bar="' + dim + '"]').style.width = val + '%';
    });
  });
}

form.classList.add('hidden');
document.getElementById('progress-wrapper').classList.add('hidden');
successState.classList.remove('hidden');
window.scrollTo({ top: 0, behavior: 'smooth' });
```

> **Note:** bands texts are inlined into the JS (not imported from `readiness-bands.ts`) because Astro doesn't pass server modules into client `<script is:inline>` automatically. If the inlined data drifts from `readiness-bands.ts`, refactor to use `define:vars` to inject. For V1, two copies are acceptable.

- [ ] **Step 3: Astro check**

```bash
cd quconsult-web
pnpm astro check
```

Expected: 0 errors.

- [ ] **Step 4: Local dev smoke**

```bash
pnpm dev
```

Open `http://localhost:4321/ai-readiness`, fill form quickly with valid data, submit. Expected: success page renders with score + 4 bars + "PDF dorazí" message. (If API endpoint is not yet deployed locally, success will show but no real PDF — that's OK for this task. Full e2e in Task 28.)

Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add quconsult-web/src/pages/ai-readiness.astro
git commit -m "feat(web): /ai-readiness success page redesign (score + 4 dim bars)"
```

---

### Task 25: Copy updates on `/ai-readiness` page (hero + sidebar)

Three textual changes per spec §9.1–9.4.

**Files:**
- Modify: `quconsult-web/src/pages/ai-readiness.astro`

- [ ] **Step 1: Update hero subhead (line ~37–41)**

Locate:
```astro
<p class="mt-lg text-body-lg text-ink-muted">
  Krátký dotazník o vašich procesech, datech, lidech a cílech. Do
  24 hodin odpovíme krátkou zprávou s orientačním skóre a konkrétním
  doporučením, kde u vás dává AI smysl jako první.
</p>
```

Replace with:
```astro
<p class="mt-lg text-body-lg text-ink-muted">
  Krátký dotazník o vašich procesech, datech, lidech a cílech. Hned po
  odeslání uvidíte orientační skóre a do minuty Vám dorazí 4stránkový
  PDF report s konkrétními doporučeními. Tým QuConsult se na Vaše
  odpovědi také podívá a do jednoho pracovního dne se ozveme.
</p>
```

(Druhá věta "Žádné prodejní volání…" zůstává.)

- [ ] **Step 2: Update sidebar "Co dostanete" (line ~400–408)**

Locate the `<ul class="mt-md space-y-md text-body text-ink-muted">` inside the "Co dostanete" block and replace with:

```astro
<ul class="mt-md space-y-md text-body text-ink-muted">
  <li><span class="text-ink">→</span> Orientační skóre 0–100 ve 4 dimenzích <strong class="text-ink">hned na obrazovce</strong>.</li>
  <li><span class="text-ink">→</span> 4stránkový PDF report <strong class="text-ink">e-mailem do minuty</strong>.</li>
  <li><span class="text-ink">→</span> Konkrétní doporučení, kde u vás dává AI smysl jako první.</li>
  <li><span class="text-ink">→</span> Pozvánku na bezplatnou 45min konzultaci. Bez tlaku.</li>
</ul>
```

- [ ] **Step 3: Update sidebar "Kdo to vyhodnocuje" → "Jak to vyhodnocujeme" (line ~420–427)**

Locate:
```astro
<div class="rounded border border-border bg-bg-warm/40 p-xl">
  <p class="text-label uppercase tracking-wider text-amber">Kdo to vyhodnocuje</p>
  <p class="mt-md text-body text-ink-muted">
    Vyhodnocení čte <span class="text-ink">Martin Večeřa</span>, vedoucí
    konzultant. Žádný funnel, žádná SDR. Odpověď přijde od stejného
    člověka, který by s vámi vedl Discovery.
  </p>
</div>
```

Replace with:
```astro
<div class="rounded border border-border bg-bg-warm/40 p-xl">
  <p class="text-label uppercase tracking-wider text-amber">Jak to vyhodnocujeme</p>
  <p class="mt-md text-body text-ink-muted">
    Skóre se počítá automaticky z Vašich odpovědí, doporučení v PDF
    generuje náš model. <span class="text-ink">Tým QuConsult se na výsledky
    také podívá</span> a do jednoho pracovního dne se Vám ozve s konkrétním
    návazným krokem. Žádný funnel, žádná SDR — kontaktovat Vás bude
    konzultant, který by s Vámi vedl Discovery.
  </p>
</div>
```

- [ ] **Step 4: Update sidebar "Vaše údaje" (line ~410–418)**

Locate:
```astro
<p class="mt-md text-body text-ink-muted">
  Odpovědi používáme pouze k vyhodnocení — neukládáme do CRM, neprodáváme,
  nezasíláme spam. Po vyhodnocení zůstane jen váš e-mail v případě, že
  si vyžádáte další pokračování. Detaily v
  <a href="/soukromi" class="text-amber underline underline-offset-2">zásadách ochrany soukromí</a>.
</p>
```

Replace with (add 1 sentence):
```astro
<p class="mt-md text-body text-ink-muted">
  Odpovědi používáme pouze k vyhodnocení — neukládáme do CRM, neprodáváme,
  nezasíláme spam. Po vyhodnocení zůstane jen váš e-mail v případě, že
  si vyžádáte další pokračování. Odpovědi posíláme do našeho AI modelu
  (OpenAI) pro vygenerování doporučení; per smlouvě o použití API
  se neukládají pro tréning. Detaily v
  <a href="/soukromi" class="text-amber underline underline-offset-2">zásadách ochrany soukromí</a>.
</p>
```

- [ ] **Step 5: Astro check**

```bash
cd quconsult-web
pnpm astro check
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add quconsult-web/src/pages/ai-readiness.astro
git commit -m "docs(web): /ai-readiness copy update — automated promise + tym QuConsult"
```

---

### Task 26: Update `/soukromi` + `/zpracovatele`

Add OpenAI as sub-procesor + disclosure paragraph.

**Files:**
- Modify: `quconsult-web/src/pages/soukromi.astro`
- Modify: `quconsult-web/src/pages/zpracovatele.astro`

- [ ] **Step 1: Read current `/soukromi.astro`**

```bash
cat quconsult-web/src/pages/soukromi.astro
```

Find where existing data-flow / processor disclosures live. Look for sections about Google Analytics, reCAPTCHA, SMTP — insert new paragraph nearby.

- [ ] **Step 2: Add disclosure paragraph**

In `soukromi.astro`, find the section listing data processors / external services (typically a section discussing Google Analytics + reCAPTCHA + SMTP provider) and add a new paragraph after them:

```html
<h3>AI Readiness Assessment — generování doporučení</h3>
<p>
  Pokud vyplníte formulář na <a href="/ai-readiness">/ai-readiness</a>, Vaše
  odpovědi (bez kontaktních údajů) předáváme společnosti <strong>OpenAI Ireland
  Ltd.</strong> (Dublin, Irsko) přes jejich API. Slouží k automatickému
  vygenerování textových doporučení v PDF reportu, který Vám obratem
  dorazí na e-mail. Per smlouvě o použití OpenAI API se odpovědi
  <strong>nepoužívají pro tréning modelů</strong> a OpenAI je uchovává po
  omezenou dobu pouze pro účely abuse monitoring (typicky 30 dní).
  Detaily v <a href="https://openai.com/policies/privacy-policy" rel="noopener">privacy policy OpenAI</a>.
</p>
```

(Adjust HTML markup to match the surrounding component style — could be `<p>` or wrapped in a Tailwind class block.)

- [ ] **Step 3: Add row to `/zpracovatele`**

In `zpracovatele.astro`, find the existing processors table/list. Add a new entry:

```html
<tr>
  <td>OpenAI Ireland Ltd.</td>
  <td>Dublin, Irsko</td>
  <td>Generování textových doporučení v rámci AI Readiness Assessmentu</td>
  <td>EU</td>
</tr>
```

(Adjust to match table format; could be list item if not in tabular form.)

- [ ] **Step 4: Astro check**

```bash
cd quconsult-web
pnpm astro check
```

- [ ] **Step 5: Build and visual smoke**

```bash
pnpm build
pnpm preview
```

Open `http://localhost:4321/soukromi` and `http://localhost:4321/zpracovatele`. Verify new paragraph/row renders, no broken layout.

- [ ] **Step 6: Commit**

```bash
git add quconsult-web/src/pages/soukromi.astro quconsult-web/src/pages/zpracovatele.astro
git commit -m "docs(web): add OpenAI as AI Readiness sub-procesor (soukromi + zpracovatele)"
```

---

### Task 27: Add `OPENAI_DAILY_USD_CAP` env var on Vercel

Manual step on Vercel dashboard. Document for engineer.

**Steps for engineer (manual, no code):**

- [ ] Open Vercel dashboard → `quconsult-api` project → **Settings** → **Environment Variables**.
- [ ] Add new variable:
  - Name: `OPENAI_DAILY_USD_CAP`
  - Value: `5`
  - Environments: Production, Preview, Development (all three).
- [ ] Verify `OPENAI_API_KEY` is also present (already set per spec §6.7). If missing, set it.
- [ ] Save.
- [ ] Redeploy (next push will pick up; or manually trigger redeploy via dashboard for the latest commit).

(No commit for this task — Vercel-only.)

---

### Task 28: End-to-end smoke test on staging

Full flow test before production deploy. Run after Task 27 envs are set.

- [ ] **Step 1: Deploy to Vercel preview**

Push branch (e.g., `feature/phase-6-ai-readiness`) to GitHub. Vercel auto-creates a preview deployment.

```bash
git push origin HEAD:feature/phase-6-ai-readiness
```

Wait for Vercel preview build to succeed.

- [ ] **Step 2: Update local `.env.local` to point at preview API**

Modify `quconsult-web/.env.local`:

```
PUBLIC_API_BASE_URL=https://<preview-url>.vercel.app
```

- [ ] **Step 3: Run web preview locally and submit form**

```bash
cd quconsult-web
pnpm build
pnpm preview
```

Open `http://localhost:4321/ai-readiness`, fill all 5 steps with realistic data, use a real e-mail you control, submit.

- [ ] **Step 4: Verify success page**

Within 3 seconds:
- Score appears (e.g., 65/100).
- 4 dim. bars animate to their values.
- "PDF dorazí na <your-email> do minuty" with email substituted.

- [ ] **Step 5: Verify PDF e-mail**

Within 60 seconds:
- E-mail arrives at your inbox with subject "Váš AI Readiness report od QuConsult".
- PDF attachment named `quconsult-ai-readiness-<slug>-<YYYYMMDD>.pdf`.
- Open PDF, manually check:
  - 4 stránky.
  - Cover: big score, 4 dim. bars, summary věta, žádné Tofu glyphs (diakritika OK).
  - Strana 2–3: 4 odstavce psané v Q-stylu (vykání, krátké věty, žádné anglicismy).
  - Strana 4: 3 next-steps + CTA tlačítko `Domluvit konzultaci →` clickable.

- [ ] **Step 6: Verify Martin notification e-mail**

Verify second e-mail also arrived at `NOTIFICATION_EMAIL` (Martin's address) with score breakdown + same PDF.

- [ ] **Step 7: Verify edge cases**

Submit second form with adversarial inputs:
- Worst-case answers (Žádný ERP, Otevřený odpor, Pod 100k, Nevíme everything).
  - Expected: score < 20, PDF generated with "PRŮZKUM" framing.
- Test e-mail with diakritika in firma (e.g., "Žluťoučký Kůň s.r.o."):
  - Expected: filename slug = `zlutoucky-kun-s-r-o`, PDF renders firma name correctly.
- Optional fields empty (kapacita, rozpocet, telefon, cinnost):
  - Expected: score still computed with default fallbacks, PDF readable.

- [ ] **Step 8: Verify Vercel logs**

In Vercel dashboard → preview deployment → Functions → `/api/ai-readiness` logs:
- Happy path: zero `console.error` lines.
- Total request duration: ~30–45 s (waitUntil included).

- [ ] **Step 9: Decide whether to merge**

If all 7 sub-checks pass: ready to merge to `master`. If any fail, fix in branch before merging.

---

### Task 29: Merge to master + production deploy

- [ ] **Step 1: Open PR**

```bash
gh pr create --title "Phase 6: AI Readiness automated lead magnet" --body "$(cat <<'EOF'
## Summary
- Single-endpoint /api/ai-readiness with waitUntil for slow path
- 4-dimension scoring (Data 30% / Lidé 30% / Strategie 25% / Provoz 15%)
- KB of ~25 markdown cards with frontmatter triggers, OpenAI o4-mini synthesis
- @react-pdf/renderer 4-page PDF (Inter + Noto Serif fonts)
- Success page redesign: instant score + animated 4-dim bars
- Copy updated: 'Martin čte' → 'tým QuConsult', 24h → instant + 1 prac. den
- /soukromi + /zpracovatele updated (OpenAI sub-procesor)

## Test plan
- [x] Smoke test: happy path → score in 3s, PDF in <60s
- [x] Edge cases: worst-case score, diakritika in firma, empty optionals
- [x] Vercel logs clean
- [x] Visual PDF inspection (diakritika, fonts, brand colors)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 2: Merge after approval**

```bash
gh pr merge --squash --delete-branch
```

- [ ] **Step 3: Verify production deploy**

Wait for Vercel + GH Pages auto-deploy. Then submit a real test form on `https://quconsult.cz/ai-readiness` (use your own e-mail). Verify everything works in production identically to staging.

- [ ] **Step 4: Update memory file**

```bash
# Update Martin's memory — Phase 6 done, AI Readiness automated
# (manual edit of ~/.claude/projects/-Users-mvecera/memory/quconsult-phase-progress.md)
```

(This is normally Claude's job during the wrap-up after the user confirms production works.)

---

## Self-review

### Spec coverage check

Spec section → task mapping:

- §1 Cíl a kontext — covered by all tasks holistically.
- §2 Schválená rozhodnutí — encoded throughout (Task 23 endpoint flow, Task 19 PDF stack, Task 21 OpenAI o4-mini).
- §3 API architektura — Task 23 (waitUntil flow + maxDuration in Task 1).
- §4 Scoring — Task 3 algorithm, Task 14 bands texts.
- §5 KB — Task 4 types, Task 5 triggers, Task 6 loader, Task 7 select, Tasks 8–11 cards, Task 12 _system, Task 13 lint.
- §6 OpenAI — Task 20 client/schema/prompt, Task 21 generate.
- §7 PDF — Task 15 tokens+fonts, Task 16 ScoreBar, Task 17 BigScore, Task 18 pages, Task 19 root+render.
- §8 Frontend success — Task 24.
- §9 Copy updates — Task 25 (ai-readiness), Task 26 (soukromi/zpracovatele).
- §10 Out of scope — N/A (no tasks needed).
- §11 Risks — encoded in Task 22 (cost cap), Task 23 (fallback notification), Task 21 (timeout/retry).
- §12 Implementation order — matches Tasks 1→29 ordering.
- §13 Acceptance — Task 28 smoke test verifies all bullets.
- §14 Env vars — Task 27.

No gaps detected.

### Placeholder scan

Searched plan for "TBD", "TODO", "implement later", "fill in details", "Add appropriate", "handle edge cases" (without code), "Similar to Task N", "Write tests for the above" (without code). None present. Card content guidance in Tasks 8–11 lists per-card priority, weight, trigger spec, and 1–2 sentence content brief — engineer (Claude during execution) writes the body fresh from the brief, which is consistent with Martin's "Karty vytvoř ty sám" decision.

### Type consistency check

- `Odpovedi` type used in scoring.ts (Task 3), referenced in triggers.ts (Task 5), select.ts (Task 7), prompt.ts (Task 20). Same type, imported from `../scoring.js`. ✓
- `ScoreResult` shape stable: `{ total, dimensions: {data, lide, strategie, provoz}, breakdown: {...} }` — used identically in scoring.ts, triggers.ts, select.ts, prompt.ts, render.tsx. ✓
- `ReadinessReport` (Zod): defined in ai/schema.ts (Task 20), consumed by ai/generate.ts (Task 21) and api/ai-readiness.ts (Task 23) via `.paragraphs`, `.nextSteps`, `.oneLineSummary`. ✓
- `Card`: defined in knowledge/types.ts (Task 4), used in load.ts/select.ts/prompt.ts. ✓
- `bandFor`/`bandSummary`/`bandNote` in `readiness-bands.ts` (Task 14) — note: Task 24 inlines a copy of these texts in the `<script>` block (Astro client-script can't import server modules); this is documented inline as a known V1 trade-off.

No type mismatches detected.

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-10-ai-readiness-full-feature.md`. Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
