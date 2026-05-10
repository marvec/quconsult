# AI Readiness Assessment — full-feature design

**Status:** Approved (brainstorming phase, 2026-05-10)
**Phase:** 6 (post-launch)
**Origin:** `docs/plans/2026-04-30-001-feat-quconsult-website-launch-plan.md` §6 — *"AI Readiness Assessment full-feature (PDF generování, scoring algorithm)."*

---

## 1. Cíl a kontext

Phase 4 dodal multi-step formulář na `/ai-readiness` (5 kroků, ~13 polí), který odesílá JSON na Vercel funkci `/api/ai-readiness`. Současný handler payload zvaliduje, ověří reCAPTCHA v3 a pošle textové shrnutí Martinovi e-mailem. Žádné scoring, žádný PDF, žádná zpětná vazba pro visitora kromě "děkujeme, do 24 h se ozveme".

Phase 6 mění `/ai-readiness` z **lead-capture s lidským followupem** na **fully automated lead magnet**:

- Visitor po submitu **okamžitě** vidí orientační skóre 0–100 + 4 dimenze vizualizované na success page.
- Do **60 sekund** dorazí 4stránkový PDF report na zadaný e-mail s konkrétními doporučeními psanými v Q-stylu (vykání, krátké věty, žádné anglicismy z `plan.md` §7.3 blocklistu).
- Tým QuConsult (ne explicitně Martin) se na odpovědi podívá také a do **jednoho pracovního dne** se ozve s konkrétním návazným kontaktem.

Změny brand promise:
- `Vyhodnocení čte Martin Večeřa` → `Tým QuConsult`
- `Do 24 hodin` (e-mail) → `Hned` (skóre na obrazovce) + `do minuty` (PDF) + `do jednoho pracovního dne` (kontakt od týmu)

---

## 2. Schválená rozhodnutí (sumář)

| # | Rozhodnutí | Volba |
|---|---|---|
| 1 | Model evaluace | Plně automatizovaný self-serve, copy odkazuje na "tým QuConsult" obecně |
| 2 | Generování doporučení | OpenAI API + deterministická knowledge base mini-šablon injektovaná do promptu |
| 3 | OpenAI model | `o4-mini` (reasoning, Responses API, structured output) |
| 4 | Success page UX | Celé skóre + 4 dimenze vizualizované |
| 5 | Knowledge base storage | Markdown soubory v repo s YAML frontmatter |
| 6 | KB authoring V1 | ~25 karet napíše Claude v rámci implementace, Martin doplní postupně |
| 7 | Vercel plán | Pro (60 s timeout) |
| 8 | API architektura | Single endpoint `/api/ai-readiness` s `waitUntil` pro slow path |
| 9 | PDF technologie | `@react-pdf/renderer` (pure JS, žádný Chromium) |

---

## 3. API architektura

**Single endpoint `POST /api/ai-readiness`** s rozdělením fast/slow přes `waitUntil` z `@vercel/functions`:

```
POST /api/ai-readiness                                  (response ≤ 2 s)
  ├─ Zod validate
  ├─ reCAPTCHA siteverify (score < 0.3 → reject)
  ├─ Deterministický scoring (4 dimenze, total = vážený průměr)
  ├─ res.status(200).json({ ok: true, score: { total, dimensions } })
  │
  └─ waitUntil(processFinalization(...))                (≤ 60 s budget, off-response)
        ├─ KB load + selectCards(odpovedi, score)
        ├─ buildPrompt(odpovedi, score, cards)
        ├─ OpenAI o4-mini Responses API + zodTextFormat (~5–15 s)
        ├─ renderPdf(odpovedi, score, report) → Buffer  (~1–3 s)
        ├─ SMTP → user (PDF attachment) + Martin (notification)
        └─ Při error: log + fallback notification s payloadem
```

`vercel.json` doplnit `"functions": { "api/*.ts": { "maxDuration": 60 } }`.

**Klient flow:**
1. Form submit → ~2 s loading na tlačítku.
2. Response 200 + score → success page render se score + 4 dim. bary + interpretační text per pásmo.
3. Klient nečeká na PDF — visitor ví "PDF dorazí do minuty".

**Trade-off `waitUntil` vs split endpoints:** Při selhání slow path (OpenAI 5xx, SMTP rate limit) user vidí success ale PDF nedorazí. Mitigace: fallback e-mail Martinovi s payloadem + flag `PDF generation failed for $email`. Akceptováno pro V1; pokud failure rate > 5 %, splitneme na dvojí endpoint.

---

## 4. Scoring algoritmus

**4 dimenze, každá 0–100. Celkové skóre = vážený průměr (Data 30 % + Lidé 30 % + Strategie 25 % + Provoz 15 %).**

| # | Dimenze | Vstupy z formuláře |
|---|---|---|
| 1 | Data | `data-kde` + `data-kvalita` + `reporting` |
| 2 | Lidé | `vedeni` + `tym-postoj` + `kapacita` |
| 3 | Strategie | `cil` + `horizont` + `rozpocet` |
| 4 | Provoz | `erp` + `velikost` + `obor` |

Volné pole `cinnost` (free text) se nescore, slouží jen jako kontext do LLM promptu.

### 4.1 Body per pole

**Data** (3 otázky, váhy 50 / 30 / 20):

| Pole | Mapping |
|---|---|
| `data-kvalita` (50) | Vynikající=50, Použitelná=35, Roztříštěná=15, Nevíme=5 |
| `data-kde` (30, multi-select) | Bonus per zdroj: ERP/Vlastní DB=12, Cloud=8, Excel/Sheets=5, E-mail=2, Papír=0. Cap 30. |
| `reporting` (20) | Ano funkční=20, Částečně=10, Ne=0 |

**Lidé** (3 otázky, váhy 40 / 35 / 25):

| Pole | Mapping |
|---|---|
| `vedeni` (40) | CEO=40, CTO=40, COO=35, Externí=25, Nikdo=0 |
| `tym-postoj` (35) | Velký zájem=35, Spíše opatrné=22, Skeptické=10, Otevřený odpor=0 |
| `kapacita` (25, optional) | Více=25, 10–20 h=22, 5–10 h=15, 2–4 h=8, neuvedeno=10 |

**Strategie** (3 otázky, váhy 35 / 35 / 30):

| Pole | Mapping |
|---|---|
| `cil` (35) | Úspora času=35, Vyšší kvalita=33, Zákazník=30, Compliance=25, Nové produkty=22, Jiné=15 |
| `horizont` (35) | 6 měs=35, do roka=30, do 3 měs=20, déle=15 |
| `rozpocet` (30, optional) | >500k=30, 300–500k=28, 100–300k=22, <100k=15, Nevíme=8, neuvedeno=15 |

**Provoz** (3 otázky, váhy 50 / 30 / 20):

| Pole | Mapping |
|---|---|
| `erp` (50) | SAP B1=50, MS Dynamics=50, Vlastní=45, Helios=45, Pohoda=35, Money S3=30, Jiné=25, Žádný=8 |
| `velikost` (30) | 50–150=30, 150–300=30, 30–50=24, 300+=22, pod 30=15 |
| `obor` (20) | IT=18, Služby=18, Výroba=18, Obchod=14, Stavebnictví=10, Jiné=14 |

### 4.2 API a struktura

Čistá funkce v `vercel-api/lib/scoring.ts`:

```ts
export interface ScoreResult {
  total: number;            // 0–100, vážený průměr
  dimensions: {
    data: number;
    lide: number;
    strategie: number;
    provoz: number;
  };
  breakdown: {              // pro PDF/debugging i LLM kontext
    data: { kvalita: number; kde: number; reporting: number };
    lide: { vedeni: number; postoj: number; kapacita: number };
    strategie: { cil: number; horizont: number; rozpocet: number };
    provoz: { erp: number; velikost: number; obor: number };
  };
}

export function scoreReadiness(odpovedi: Odpovedi): ScoreResult { ... }
```

### 4.3 Pásma celkového skóre

| Pásmo | Range | Interpretace (1 věta na success page + cover PDF) |
|---|---|---|
| **PRŮZKUM** | 0–39 | "Vaše firma je v pásmu PRŮZKUM — má smysl začít datovým auditem před jakýmkoli AI projektem." |
| **KANDIDÁT** | 40–69 | "Vaše firma je v pásmu KANDIDÁT — máte solidní základ, ale je potřeba dorovnat pár věcí před prvním pilotem." |
| **PŘIPRAVENÝ** | 70–100 | "Vaše firma je v pásmu PŘIPRAVENÝ — máte všechno potřebné pro pilotní AI projekt v horizontu 3–6 měsíců." |

Texty žijí v `src/lib/readiness-bands.ts`, sdílené mezi success page JS (deterministic instant render) a server-side scoring (cover page PDF).

Per-dimenze 3 pásma × 4 dimenze = 12 krátkých interpretací (~1 věta každá), též v `readiness-bands.ts`.

---

## 5. Knowledge base struktura

Žije v `vercel-api/lib/knowledge/` (kolokovaná s API, žádné build coupling s Astro).

```
vercel-api/lib/knowledge/
├── data/
│   ├── kvalita-roztristena.md
│   ├── kvalita-vynikajici.md
│   ├── kde-jen-papir.md
│   ├── kde-erp-plus-bi.md
│   ├── score-low.md             # generic per pásmo
│   ├── score-mid.md
│   └── score-high.md
├── lide/
├── strategie/
├── provoz/
├── icp/                          # cross-cutting fit signály
│   ├── vyroba-50-300-fit.md
│   ├── sluzby-5-30-fit.md
│   └── nad-icp-300-plus.md
└── _system/
    ├── brand-voice.md            # vykání, anglicismy blocklist, krátké věty
    └── output-format.md          # 4 odstavce + 3 next-steps + 1 summary
```

**v1 cíl: ~25 karet** napíše Claude v rámci implementace; Martin doplní postupně po prvních real submissionech.

### 5.1 Frontmatter schéma (Zod-validovaný)

```yaml
---
id: data-kvalita-roztristena                     # auto z filename
dimension: data                                   # data | lide | strategie | provoz | icp
priority: 9                                       # 1–10, vyšší = víc relevantní
weight: must                                      # must = vždy injektovat když trigger sedí | may = jen pokud je místo
triggers:
  - field: data-kvalita
    equals: Roztříštěná
---
[Markdown text karty: 100–250 slov insight v Q-stylu, vykání. Není to finální copy
do PDF — je to insight, který LLM přepíše v kontextu konkrétní firmy.]
```

### 5.2 Trigger DSL

| Syntax | Význam |
|---|---|
| `field: X, equals: Y` | hodnota pole X je přesně Y |
| `field: X, in: [Y, Z]` | hodnota pole X je v seznamu |
| `field: X, includes: Y` | u multi-select polí (`data-kde`) — Y je mezi vybranými |
| `dimension: D, scoreBand: [lo, hi]` | score dimenze D je v `[lo, hi]` |
| `total: scoreBand: [lo, hi]` | celkové score v intervalu |

Více triggers v jednom souboru = AND. Žádné OR, žádný NOT — pro OR založte druhou kartu.

### 5.3 Selection logic

```ts
function selectCards(odpovedi, score, allCards): Card[] {
  const triggered = allCards.filter(c => evalTriggers(c.triggers, odpovedi, score));
  const byDim = groupBy(triggered, c => c.dimension);
  const selected: Card[] = [];
  for (const dim of ['data', 'lide', 'strategie', 'provoz', 'icp']) {
    const cards = (byDim[dim] ?? []).sort((a, b) => b.priority - a.priority);
    const must = cards.filter(c => c.weight === 'must');
    const may = cards.filter(c => c.weight === 'may').slice(0, Math.max(0, 3 - must.length));
    selected.push(...must, ...may);
  }
  return selected.slice(0, 15);   // hard cap pro prompt size
}
```

15 karet × ~150 slov = ~3 000 tokenů KB do user promptu. V budgetu.

### 5.4 Authoring flow

1. Otevřít `vercel-api/lib/knowledge/{dimenze}/`, založit nový `.md` soubor.
2. Vyplnit frontmatter (autocomplete přes Zod-derived JSON Schema v `.vscode/settings.json`).
3. Napsat 100–250 slov insight v Q-stylu.
4. `pnpm test:knowledge` (nový script v `vercel-api/`) — validuje frontmatter, lintuje text na anglicismy z `plan.md` §7.3 blocklistu, ověří, že triggery odkazují na existující field/answer.
5. PR + commit. Vercel deploy automaticky podchytí.

---

## 6. OpenAI integrace

**Stack:** `openai` SDK ≥ 6.0, Responses API (`client.responses.parse`), structured output přes `zodTextFormat`, `reasoning.effort: 'medium'`, žádný `temperature` (reasoning models ho nepodporují).

### 6.1 Soubory

```
vercel-api/lib/ai/
├── client.ts                # OpenAI client init z env
├── prompt.ts                # buildPrompt(odpovedi, score, cards) → input string
├── schema.ts                # Zod ReadinessReport schema
└── generate.ts              # generateReport(input) → ReadinessReport
```

### 6.2 Output schéma

```ts
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
```

### 6.3 Prompt struktura

**System prompt** (statický, ~1 200 slov, sestavený ze `_system/brand-voice.md` + `_system/output-format.md`):
- Vykání, krátké věty (max 25 slov), aktivní slovesa
- Konkrétní čísla v Kč/hodinách/měsících, ne v %
- Žádné anglicismy z blocklistu (`synergie`, `leverage`, `transformation`, `disrupt*`, `next-gen`, `state-of-the-art`, `unlock potential`)
- Žádné prodejní formulace
- 5–8 "good vs bad" few-shot příkladů

**User prompt** (dynamický, ~3 000 tokenů):
- Firma: jméno, velikost, obor, ERP, free-text "co děláte"
- Score breakdown: total + 4 dimenze + body per pole
- 15 selected KB karet
- Pokyn: "napište report v JSON struktuře dle schématu, KB insights aplikujte na kontext této konkrétní firmy, necitujte je doslovně"

### 6.4 Generate

```ts
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { ReadinessReport } from './schema';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateReport(input: string): Promise<ReadinessReport> {
  const rsp = await client.responses.parse({
    model: 'o4-mini',
    input,
    reasoning: { effort: 'medium' },
    max_output_tokens: 4000,
    text: { format: zodTextFormat(ReadinessReport, 'readiness_report') },
  });
  if (!rsp.output_parsed) throw new Error('OpenAI returned unparseable response');
  return rsp.output_parsed;
}
```

### 6.5 Cost & latency

| Metrika | Per submission | Per 500/rok |
|---|---|---|
| Input tokeny | ~4 000 | 2 M |
| Output tokeny (vč. reasoning) | ~3 000 | 1,5 M |
| Cost (`$1.10/M in, $4.40/M out`) | ~$0.018 | ~$9/rok |
| Latence | 5–15 s | n/a |

### 6.6 Cost cap & error handling

- ENV `OPENAI_DAILY_USD_CAP` (default 5 USD/den).
- Per-instance counter (volatile, restart = reset). V2 přesun na Vercel KV pokud potřeba.
- Nad cap → `processFinalization` přeskočí OpenAI a pošle Martinovi e-mail "submit od $email — denní AI cap dosažen".
- OpenAI 429 → 1× retry po 2 s.
- OpenAI 5xx → 1× retry, pak fail s notifikací.
- `output_parsed === null` → fail s notifikací (rare s structured outputs).
- `AbortController` 25 s timeout.

### 6.7 Setup pro Martina (Vercel env vars)

- `OPENAI_API_KEY` — Production + Preview (✓ již nastaven)
- `OPENAI_DAILY_USD_CAP` — `5` (Production + Preview, lze upravit)

---

## 7. PDF rendering

**Knihovna `@react-pdf/renderer ^4`** — pure JS, ~5 MB bundle, ~500 ms cold start, render 1–3 s, custom fonty z lokálních TTF, streaming Buffer output do nodemailer attachmentu.

### 7.1 Soubory

```
vercel-api/lib/pdf/
├── render.ts                    # renderPdf(odpovedi, score, report) → Buffer
├── components/
│   ├── ReadinessDocument.tsx    # root <Document>
│   ├── CoverPage.tsx
│   ├── DimensionPage.tsx
│   ├── NextStepsPage.tsx
│   ├── ScoreBar.tsx
│   └── BigScore.tsx
├── fonts/                       # symlink na quconsult-web/scripts/fonts/
└── tokens.ts                    # mirror src/styles/global.css @theme
```

### 7.2 Layout (4 strany A4)

- **Cover**: logo, "AI Readiness Assessment pro {firma}", datum, big score donut chart, oneLineSummary, 4 dim. bary, footer "QuConsult — Praktické AI poradenství."
- **Strana 2**: Data odstavec + skóre header, Lidé odstavec + skóre header.
- **Strana 3**: Strategie + Provoz (stejný pattern).
- **Strana 4**: 3 next-steps bullety, "tento report je orientační" disclaimer, CTA tlačítko `Domluvit konzultaci →` (clickable link na `quconsult.cz/kontakt`).

### 7.3 Typografie

- Headlines: Noto Serif 24 pt (cover) / 16 pt (sekce)
- Body: Inter 10 pt, line-height 1.55
- Labels (uppercase): Inter 8 pt, letter-spacing 1.5
- Score numerals: Noto Serif 56 pt (cover), 14 pt (per dimenze)

Žádné gradienty, žádné drop shadows, žádné rounded-full pill — same brand rules jako web (CLAUDE.md §3).

### 7.4 Tokens

`tokens.ts` mirroruje `src/styles/global.css @theme` — single source of truth pro brand barvy a fonty:

```ts
export const tokens = {
  color: {
    ink: '#1A1A1A', inkMuted: '#525252', inkSoft: '#737373',
    bg: '#FAFAF8', bgWarm: '#F5F2EA',
    amber: '#D97706', amberDeep: '#B45309',
    border: '#E5E1D8',
  },
  font: { sans: 'Inter', serif: 'NotoSerif' },
  spacing: { xs: 4, sm: 8, md: 12, lg: 20, xl: 32, xxl: 56 },
};
```

### 7.5 Filename a delivery

- Filename: `quconsult-ai-readiness-{firma-slug}-{YYYYMMDD}.pdf`
  - `firma-slug` = lowercased + diakritika-stripped + non-alphanum→`-`, max 30 znaků.
- Velikost: 80–150 KB (4 strany, bez raster obrázků).
- Doručení: SMTP attachment přes existující nodemailer transporter, `contentType: 'application/pdf'`.

### 7.6 E-mail tělo

Plain text (ne HTML — lepší doručitelnost, žádný Outlook quirks):

```
Subject: Váš AI Readiness report od QuConsult

Dobrý den, {jmeno},

děkujeme za vyplnění dotazníku. V příloze najdete krátký 4stránkový
report s orientačním skóre a konkrétními doporučeními.

Tým QuConsult se na Vaše odpovědi také podívá a do jednoho pracovního
dne se Vám ozveme s návazným kontaktem.

S pozdravem,
tým QuConsult
hello@quconsult.cz
quconsult.cz
```

---

## 8. Frontend success page

Kompletní redesign success state v `src/pages/ai-readiness.astro`. Z minimálního textu na **score + 4 dimenze + status update**.

### 8.1 Markup struktura (high level)

1. **Hero score block** (amber-tinted) — `Vaše orientační skóre`, big number `78 / 100`, 1-věta interpretace per pásmo z `readiness-bands.ts`.
2. **4 dimenze bary** — label + skóre + animovaný `<div class="bg-amber" style="width: {val}%">` + krátká interpretace per pásmo.
3. **Status update** — "PDF dorazí na {email} do minuty", "tým se ozve do 1 pracovního dne", "žádné prodejní volání".
4. **CTA** — `Domluvit 45min konzultaci rovnou` (primary) + `Zpět na úvod` (outline).

### 8.2 JS po `r.json()`

```js
// json = { ok: true, score: { total, dimensions: { data, lide, strategie, provoz } } }
const s = json.score;
document.getElementById('score-total').textContent = String(s.total);
document.getElementById('success-email').textContent = data.email;
document.getElementById('score-summary').textContent = bandSummary(s.total);

['data', 'lide', 'strategie', 'provoz'].forEach((dim) => {
  const val = s.dimensions[dim];
  document.querySelector(`[data-dim-score="${dim}"]`).textContent = String(val);
  document.querySelector(`[data-dim-note="${dim}"]`).textContent = bandNote(dim, val);
  requestAnimationFrame(() => {
    document.querySelector(`[data-dim-bar="${dim}"]`).style.width = `${val}%`;
  });
});

form.classList.add('hidden');
document.getElementById('progress-wrapper').classList.add('hidden');
successState.classList.remove('hidden');
window.scrollTo({ top: 0, behavior: 'smooth' });
```

`bandSummary` a `bandNote` importované z `src/lib/readiness-bands.ts`.

---

## 9. Copy updates

### 9.1 Hero subhead (`/ai-readiness.astro` line 37–41)

**Před:** *"Krátký dotazník o vašich procesech, datech, lidech a cílech. Do 24 hodin odpovíme krátkou zprávou s orientačním skóre a konkrétním doporučením, kde u vás dává AI smysl jako první."*

**Po:** *"Krátký dotazník o vašich procesech, datech, lidech a cílech. Hned po odeslání uvidíte orientační skóre a do minuty Vám dorazí 4stránkový PDF report s konkrétními doporučeními. Tým QuConsult se na Vaše odpovědi také podívá a do jednoho pracovního dne se ozveme."*

(Druhá věta "Žádné prodejní volání…" zůstává.)

### 9.2 Sidebar "Co dostanete" (line 400–408)

- → Orientační skóre 0–100 ve 4 dimenzích **hned na obrazovce**.
- → 4stránkový PDF report **e-mailem do minuty**.
- → Konkrétní doporučení, kde u vás dává AI smysl jako první.
- → Pozvánku na bezplatnou 45min konzultaci. Bez tlaku.

### 9.3 Sidebar "Jak to vyhodnocujeme" (line 420–427) — přejmenovaný + přepsaný

**Před nadpis:** "Kdo to vyhodnocuje" → **Po:** "Jak to vyhodnocujeme"

**Před:** *"Vyhodnocení čte Martin Večeřa, vedoucí konzultant. Žádný funnel, žádná SDR. Odpověď přijde od stejného člověka, který by s vámi vedl Discovery."*

**Po:** *"Score se počítá automaticky z Vašich odpovědí, doporučení v PDF generuje náš model. **Tým QuConsult se na výsledky také podívá** a do jednoho pracovního dne se Vám ozve s konkrétním návazným krokem. Žádný funnel, žádná SDR — kontaktovat Vás bude konzultant, který by s Vámi vedl Discovery."*

### 9.4 Sidebar "Vaše údaje" (line 410–418) — přidaná věta

Na konec doplnit: *"Odpovědi posíláme do našeho AI modelu pro vygenerování doporučení; OpenAI je per smlouvě o použití API neukládá pro tréning."*

### 9.5 `/soukromi` a `/zpracovatele`

- **`/soukromi`**: doplnit odstavec o tom, že odpovědi z `/ai-readiness` formuláře jsou předávány OpenAI Ireland Ltd. pro generování textových doporučení. Per OpenAI API Data Usage Policy se nepoužívají pro tréning modelů.
- **`/zpracovatele`**: přidat řádek do tabulky processorů — *"OpenAI Ireland Ltd., Dublin, Irsko — generování textových doporučení v rámci AI Readiness Assessmentu. Datová oblast: EU."*

---

## 10. Out of scope (Phase 6 V1)

| Položka | Důvod odsunutí |
|---|---|
| Anglická verze PDF | EN web odsunutý dle `plan.md` §14.3 ("po 12 měsících"). |
| Branded HTML email | Plain text má lepší doručitelnost; HTML přidává inline-CSS hell + Outlook quirks. |
| Public sharable report URL (`quconsult.cz/r/{token}`) | Hostingová infra navíc + bezpečnostní surface. PDF přílohou stačí. |
| Persistentní storage submissions v DB | V1 jediný "záznam" je odeslaný e-mail. Vercel KV/Postgres přidávat až s konkrétním use-casem. |
| ICP fit conditional scoring (obor × velikost cross-rules) | Score Provoz je generic; ICP fit signalizujeme přes KB karty `icp/`. |
| A/B test hero copy | Jiný Phase 6 track, vyžaduje GA4 events + traffic split + ≥ 200 návštěv. |
| Stripe / paid deeper assessment | Lead magnet má zůstat free. |
| Scoring tuning na real data | V2 — ladění vah po prvních ~20 real submissionech. V1 vahy jsou educated heuristics. |

---

## 11. Risks & mitigation

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|---|---|---|---|
| `waitUntil` selže (OpenAI 5xx, SMTP rate limit, render error) | medium | high | Fallback notification Martinovi s celým payloadem + flag. Logováno v Vercel logs. Pokud failure rate > 5 %, splitneme na sync /finalize. |
| OpenAI cost runaway (spam attack přes valid reCAPTCHA) | low | medium | reCAPTCHA score < 0.3 reject. ENV `OPENAI_DAILY_USD_CAP=5`. Per-instance counter. |
| OpenAI latence P99 > 30 s | low | medium | `AbortController` 25 s timeout. Při timeout: fallback notification, manual followup. |
| LLM porušuje brand-voice (anglicismy, tykání) | medium | low | Few-shot v `_system/brand-voice.md`. Dev review prvních 10 generací. Linter na blocklist v PR. |
| Diakritika rendering issue v PDF | very low | high | Inter + Noto Serif TTF mají plnou českou sadu. Smoke test "Příliš žluťoučký kůň úpěl ďábelské ódy". |
| SMTP block kvůli attachmentu (Seznam.cz spam filter) | low | medium | DKIM/SPF/DMARC nastavené. Smoke test odeslání na Seznam + Centrum účet. |
| Score weights subjektivní → user feels misjudged | medium | low | "Orientační" framing + transparentní breakdown v PDF. Tuning po 20–30 real submissionech. |
| GDPR — payload jde do OpenAI | low | low | Disclosure v `/soukromi` + `/zpracovatele`. OpenAI per API contract neukládá pro tréning. |

---

## 12. Implementation order

Logické pořadí, každý krok testovatelný samostatně:

1. **KB framework** — `triggers.ts`, `select.ts`, `load.ts` + Zod schema + 5 testovacích karet → unit tests pass.
2. **KB cards V1** — ~25 karet napsaných (Claude), pokrývajících typické patterns napříč 4 dimenzemi + ICP. Lint test (žádné anglicismy).
3. **Scoring algoritmus** — `scoring.ts` čistá funkce + unit tests s 10 fixture submissionů.
4. **Bands texty** — `src/lib/readiness-bands.ts` (12 per-dim notes + 3 summary), sdílené client/server.
5. **PDF rendering** — `vercel-api/lib/pdf/` komponenty + tokens + smoke render s mock daty → vizuální kontrola PDF.
6. **OpenAI integrace** — `ai/client.ts`, `ai/prompt.ts`, `ai/generate.ts`, `ai/schema.ts` + 1–2 dev calls s real data → output review.
7. **API update** — `/api/ai-readiness` přepsaný na nový flow (validate → score → response → `waitUntil`[KB+OpenAI+PDF+SMTP]) + error handling + cost cap.
8. **Frontend success page** — markup změny v `/ai-readiness.astro` + JS pro animované bary + bands texts.
9. **Copy updates** — sidebar + hero subhead + `/soukromi` + `/zpracovatele`.
10. **Manual smoke** — happy path + edge cases (extreme low/high score, dlouhý cinnost text, prázdné optional pole).
11. **Deploy** + smoke test prod.

**Předpokládaný total effort:** 3–5 vývojářských dní, z toho ~1 den authoring KB cards + bands + brand-voice prompt.

---

## 13. Acceptance criteria

Phase 6 je hotovo, když:

- [ ] Submit happy path → score na success page render do 3 s.
- [ ] PDF dorazí na user e-mail do 60 s s validní diakritikou, fonty, barvami.
- [ ] Recommendation text v PDF prochází blocklist anglicismů ručně review 5 generací.
- [ ] Cost per submission ≤ $0.02 (Vercel logs + OpenAI usage dashboard).
- [ ] Fallback path: simulovaný OpenAI 500 → Martin dostane notification e-mail s celým payloadem.
- [ ] `/soukromi` + `/zpracovatele` updated o OpenAI sub-procesor.
- [ ] Vercel function logs neobsahují žádný `console.error` při happy path.
- [ ] Lighthouse na `/ai-readiness` zůstává 95+ (žádný visual regression).

---

## 14. Vercel env vars (souhrn k nastavení)

| ENV | Hodnota | Stav |
|---|---|---|
| `OPENAI_API_KEY` | `sk-…` | ✓ Nastaveno (Production + Preview) |
| `OPENAI_DAILY_USD_CAP` | `5` | Doplnit při deployi |

(Existující env vars `RECAPTCHA_SECRET_KEY`, `SMTP_*`, `NOTIFICATION_EMAIL`, `ALLOWED_ORIGIN` zůstávají.)
