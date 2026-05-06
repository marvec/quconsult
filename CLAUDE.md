# CLAUDE.md — runtime contract pro Claude Code v tomto repu

> Tenhle dokument je psaný pro budoucí instance Claude Code (a další AI agenty),
> které budou tenhle repo upravovat. Vykání záměrné — chceme stejný registr,
> jaký používáme s klienty.

---

## 1. Co tento projekt je

Marketingový web **QuConsult** — české butikové AI poradenské firmy
(3–5 seniorních specialistů, B2B, výroba 50–300 zaměstnanců + profesionální
služby 5–30 lidí). Web je primární lead-gen kanál: vzbudit důvěru, získat
kontakt na bezplatnou 45minutovou konzultaci, demonstrovat hloubku
expertízy přes blog a Agentic OS proof-of-expertise. Brand je
**QuConsult** (camelCase, jedno slovo). Právní entita je **WellBe s.r.o.,
IČ 05830931, Nové sady 988/2, 602 00 Brno** — používá se ve faktuře
a v patičce, ne jinde.

---

## 2. Tech stack quick reference

- **Framework:** Astro 5+ (static-first SSG, content collections, MDX,
  View Transitions). `astro.config.mjs` je zdroj pravdy.
- **Styling:** Tailwind CSS **4** přes `@tailwindcss/vite`. Žádný
  `tailwind.config.js`/`tailwind.config.ts` — všechny tokeny jsou v
  `src/styles/global.css` přes `@theme` direktivu. Pokud potřebujete
  přidat token (barvu, spacing, font, motion), upravte `@theme` blok,
  ne JS config.
- **TypeScript:** `strict` mode (rozšíření `astro/tsconfigs/strict`).
  Žádný `any`. Žádný `// @ts-ignore` bez komentáře proč.
- **Content:** Markdown + MDX, Zod schémata v `src/content.config.ts`
  (po Fázi 2).
- **Forms backend:** Vercel serverless functions v `vercel-api/`
  (Node runtime, ne Edge — `nodemailer` Edge nepodporuje).
- **Analytics:** Google Analytics 4, opt-in přes vanilla-cookieconsent v3
  (orestbida). Default consent state denied; GA4 gtag.js se loaduje až
  po `analytics` consent. Měřítko ID v `PUBLIC_GA_MEASUREMENT_ID`.
- **Anti-spam:** Google reCAPTCHA v3, lazy-loaded na form submit.
- **Cookie banner:** Opt-in (NE jen informativní). Necessary kategorie
  always-on (cc_cookie + reCAPTCHA), Analytics opt-in. CZ texty v
  `src/lib/cookie-consent.ts`, override CSS v `src/styles/cookie-consent.css`.
- **Deploy:** GH Actions → GH Pages (`master` → `dist/`). API je
  deployovaný odděleně (Vercel projekt, Root Directory `vercel-api/`).
- **Node:** 22+. **Package manager:** pnpm.

---

## 3. NIKDY (hard rules)

- **Žádné anglicismy** z `plan.md` §7.3 blocklistu: *synergie*,
  *disruption*, *state-of-the-art*, *leverage*, *disruptivní*,
  *transformation*, *unlock potential*, *next-gen*. Pokud existuje
  český ekvivalent, použijte ho.
- **Žádný EN nav, EN CTA, EN microcopy** na CZ stránce. Web je
  v Phase 0–5 čistě český. Anglické titulky na YouTube řešíme až
  v `plan.md` §14.3 dlouhodobě.
- **Žádný "coming soon" placeholder** (per `plan.md` §11.1). Pokud
  něco není hotové, sekce se na webu prostě neobjeví.
- **Žádné stock photos** (DESIGN_BRIEF.md §"Ilustrace"). Tým = reálné
  fotky v přirozeném světle. Diagramy = ručně kreslené (Excalidraw),
  ne generic vector business illustrations.
- **Žádný čistý #FFF a žádný čistý #000.** Pozadí `#FAFAF8`, ink
  `#1A1A1A`. Tokeny: `bg-bg`, `text-ink`.
- **Amber max 5–10 % plochy.** `#D97706` je akcent, ne pozadí
  velkých sekcí. Hero sekce s amber background je zakázaná.
- **Žádné gradienty, glassmorphism, shadows pod `lg`,
  rounded-full (pill style), neon, fialová, modrá.** Viz
  `DESIGN_BRIEF.md` §"Co NEchceme".
- **Žádný `tailwind.config.ts`.** Pokud ho někdo přidal, smažte ho
  a tokeny přesuňte do `@theme` v `src/styles/global.css`.
- **Žádný `--no-verify` na commitech.** Pre-commit hook musí projít.
- **Žádné force-push na `master`.** Cokoli destruktivního jen po
  výslovné žádosti uživatele.

---

## 4. VŽDY (defaults)

- **Vykání** v B2B kontextu (web, nabídky, formuláře). Tykání jen
  v sociálních sítích a YouTube.
- **Krátké věty, aktivní slovesa, konkrétní čísla.** Ne *"měřitelné
  výsledky"* obecně, ale *"úspora 12 hodin týdně"* nebo
  *"návratnost za 4 měsíce"*.
- **Diakritika otestovaná.** Před commitem zkontrolujte větu
  *"Příliš žluťoučký kůň úpěl ďábelské ódy."* — ě, š, č, ř, ž, ý, á,
  í, é, ů, ú, ď, ť, ň musí všechny renderovat čistě.
- **Schema.org** — `Organization` v root layoutu, `BreadcrumbList`
  na podstránkách, `Article` v blogu, `Service` na detailech služeb,
  `FAQPage` kde jsou FAQ.
- **LCP < 2.5 s, CLS < 0.05** na 4G simulaci. Lighthouse perf > 95.
- **Page funguje s `JS off`** (kromě formulářů — ty degradují na
  `mailto:` link).
- **Reduced motion respect.** `@media (prefers-reduced-motion:
  reduce)` vypíná všechny entry/reveal animace v `global.css`.

---

## 5. File conventions

```
src/
├── pages/              — Astro routes (file = URL)
│   ├── index.astro     — /
│   ├── 404.astro       — error
│   ├── sluzby/         — /sluzby a /sluzby/[slug]
│   ├── blog/           — /blog a /blog/[slug]
│   └── ...
├── layouts/
│   ├── BaseLayout.astro       — html shell, head, header, footer
│   ├── BlogPostLayout.astro   — blog post wrapper (po Fázi 2)
│   └── LegalLayout.astro      — pravní stránky (po Fázi 3)
├── components/
│   ├── Header.astro
│   ├── Footer.astro
│   └── ... (PascalCase, jeden komponent na soubor)
├── content/            — Markdown/MDX (po Fázi 2)
├── content.config.ts   — Zod schémata pro collections
├── lib/
│   └── cookie-consent.ts — vanilla-cookieconsent config + GA4 gating
├── pages/
│   └── rss.xml.ts      — RSS feed (Astro endpoint)
├── styles/
│   ├── global.css      — Tailwind 4 @theme tokens (zdroj pravdy
│   │                     pro design system)
│   └── cookie-consent.css — orestbida brand override
└── env.d.ts            — typed import.meta.env

public/                 — statické assety, kopírují se 1:1
├── CNAME               — quconsult.cz (GH Pages)
├── favicon.svg
└── apple-touch-icon.png

vercel-api/             — separate Vercel project (Root Directory)
├── api/                — funkce, jeden soubor = jeden endpoint
├── package.json
├── tsconfig.json
└── vercel.json

.github/workflows/      — CI/CD
plan.md                 — strategy origin (read-only z pohledu webu)
DESIGN_BRIEF.md         — vizuální pravidla (read-only)
CLAUDE.md               — tento dokument
```

---

## 6. Jak přidat blog článek

1. Vytvořte `src/content/blog/{slug}.mdx` (slug v kebab-case, česky
   bez diakritiky — např. `gdpr-a-ai-v-cr.mdx`).
2. Frontmatter (povinné: `title`, `description`, `pubDate`, `author`):
   ```yaml
   ---
   title: "GDPR a AI v ČR: jak nemít průšvih"
   description: "Praktický průvodce kompliancí pro firmy, které začínají s AI."
   pubDate: 2026-05-15
   author: martin
   tags: [gdpr, compliance, ai-strategie]
   ---
   ```
3. Pište česky, vykání, krátké věty, konkrétní příklady. Žádné
   anglicismy z §7.3 blocklistu.
4. `pnpm dev` → ověřte na `http://localhost:4321/blog/{slug}`.
5. Před commitem: zkontrolujte diakritiku, LCP, OG image.
6. Commit message formát: `Add blog post: {title}`.

---

## 7. Jak přidat novou službu

**Krátká odpověď: nepřidávejte ji bez schválení strategie.**

`plan.md` §5 definuje 4 služby: AI Analýza a strategie, Automatizace
procesů, (Nejen) AI školení, AI Implementace a vývoj. Pátá služba
znamená změnu strategie — nejdřív upravte `plan.md`, projednejte
s Martinem, pak teprve sahejte na web.

Pokud přidáváte podstránku k existující službě, postupujte jako
u blog článku, ale do `src/content/sluzby/{slug}.mdx`.

---

## 8. Jak změnit copy stránky

1. Najděte stránku v `src/pages/` nebo její content collection
   v `src/content/`.
2. Pokud je copy v Astro souboru přímo (např. hero v `index.astro`),
   upravte ho tam.
3. Pokud je copy v `plan.md` §11 (Hero, CTAs, navigace), upravte
   i `plan.md` — strategy je zdroj pravdy a musí zůstat synchronizovaná.
4. Před commitem: ověřte diakritiku, ověřte že copy odpovídá
   `plan.md` §7 (tone of voice — vykání, žádné anglicismy,
   konkrétní čísla).
5. Commit: `Update copy on /{cesta}`.

---

## 9. Origin documents a implementační reference

### Strategy (read-only z pohledu webu)

Tyto soubory definují strategii, brand a vizuální identitu.
**Neměňte je z webu** — jsou kopiemi z parent `rewamp/` adresáře
a slouží jako reference pro Claude.

- `plan.md` — kompletní strategie, brand voice, web struktura,
  SEO, content plán. **Pravda o "co a proč" píšeme.**
- `DESIGN_BRIEF.md` — vizuální pravidla (barvy, typografie,
  layout, komponenty). **Pravda o "jak to vypadá".**

### Implementation reference (in-repo)

- `docs/plans/2026-04-30-001-feat-quconsult-website-launch-plan.md`
  — implementační plán: page-by-page blueprints (§3), tech architektura (§4),
  motion design (§4.7), CLAUDE.md scaffold (§5), fázovaný roadmap (§6),
  acceptance kritéria (§7). **Pravda o "jak to stavíme".**
- `docs/stitch-candidates/decisions.md` — vítězný Stitch screen pro každou
  z 12 page typů + per-page fix list pro implementaci.
  Začátek každé Phase 1+ úlohy: přečíst odpovídající sekci.
- `docs/stitch-candidates/{NN}-{name}-{id}.html` — 12 vítězných HTML
  + 7 referenčních (B-mixin) HTML stažených ze Stitch projektu.
  Tailwind CDN classes přímo namapovatelné na náš Tailwind 4 design system.
  **Reference, ne 1:1 implementace** — Astro projekt staví vlastní komponenty
  s responsivním designem, motion (§4.7), accessibility, content collections.
- `docs/stitch-candidates/{NN}-{name}-{id}.png` — screenshot thumbnaily
  pro vizuální orientaci.

Pokud má být strategie změněna, upravte `plan.md` v parent
adresáři `rewamp/`, projednejte s Martinem, pak resync sem.
Implementační plán (`docs/plans/`) můžete updatovat in-place — je to
working document, ne strategie.

---

## 10. Když si nejsi jistý

- **Tone of voice** — `plan.md` §7. Když ani potom, eskaluj na
  Martina (uživatele).
- **Vizuální detail** — `DESIGN_BRIEF.md` + Stitch winners v
  `docs/stitch-candidates/` (in-repo). HTML soubory mají přesné
  Tailwind classes pro spacing/typography. Když ani potom, eskaluj.
- **Strategie / produktová otázka** (přidat sekci, změnit službu,
  přidat formulář) — **eskaluj vždy.** Strategie se nemění
  v rámci implementační iterace.
- **Technická volba** (stack, library) — `plan.md` §4 je
  rozhodnutý stack. Cokoli mimo něj (např. přidat React, přidat
  Framer Motion, přidat Vercel Edge) je strategická změna a
  vyžaduje souhlas.

Když narazíte na rozpor mezi `plan.md` a kódem, **kód má bug**,
ne strategie.

---

*Last updated: 2026-05-05 — Phase 5: GA4 + cookieconsent opt-in.*
