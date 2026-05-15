# Service Detail Pages — Stitch Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Doplnit chybějící sekce na `/sluzby/[slug]` (bento grid "Co konkrétně děláme", per-service spotlight card, "Typické výsledky", "Co neděláme", hero media placeholder), opravit šířku FAQ — vše dle Stitch winneru `03-service-detail-A-larger-920634b5.html` a `plan.md §1.3` (9-sekční šablona).

**Architecture:** Strukturovaná data jdou do `src/content.config.ts` jako optional Zod schemata + frontmatter 4 MDX souborů. Long-form prose (Discovery, retainer, GDPR…) zůstává v MDX těle, vykresluje se mezi "Jak spolupracujeme" a "Cena". `Hero.astro` dostane `media` named slot pro pravý sloupec (placeholder Q-mark v `aspect-square` boxu). `[slug].astro` se přepíše tak, aby konzumoval nové fieldy a renderoval sekce pouze když data existují.

**Tech Stack:** Astro 5 (content collections + Zod), Tailwind 4 (`@theme` tokeny v `src/styles/global.css`), MDX. Žádný `tailwind.config.ts`, žádný JS framework.

**Out of scope (defer):**
- Anchor menu na 4 podformy pro `/sluzby/skoleni` (plan §3.5) — bude samostatný PR.
- Agentic OS dedikovaný blok pro `/sluzby/implementace-a-vyvoj` (plan §3.6) — samostatný PR.
- Reálné fotografie / Excalidraw diagramy — `DESIGN_BRIEF` říká "ne stock". Tady jen rezervujeme layout placeholderem s Q-markem, fotky se nahrají po team photoshootu.

---

## File Structure

**Modify:**
- `src/content.config.ts` — rozšířit `sluzby` schema o 4 optional fieldy.
- `src/components/Hero.astro` — přidat `media` named slot + grid layout když je slot present.
- `src/pages/sluzby/[slug].astro` — kompletní restrukturace render bloku.
- `src/content/sluzby/analyza-a-strategie.mdx` — doplnit frontmatter, zachovat long-form prose body.
- `src/content/sluzby/automatizace-procesu.mdx` — doplnit frontmatter, zachovat long-form prose body.
- `src/content/sluzby/skoleni.mdx` — doplnit frontmatter, zachovat long-form prose body.
- `src/content/sluzby/implementace-a-vyvoj.mdx` — doplnit frontmatter, zachovat long-form prose body.

**Create:**
- `src/components/ServiceBentoGrid.astro` — render `whatWeDo` array jako 3-col bento (2 cards span 2, jedna dark).
- `src/components/ServiceSpotlight.astro` — render `spotlight` objekt jako split card s placeholder ilustrací vpravo.
- `src/components/ServiceOutcomes.astro` — render `outcomes` array jako stat grid.
- `src/components/ServiceWeDontDo.astro` — render `weDontDo` array jako tmavá sekce.
- `src/components/MediaPlaceholder.astro` — sdílený placeholder block s Q-mark logem (pro hero + spotlight).

**No tests:** Astro static site, validation = `pnpm build` (Zod schema validation) + `pnpm dev` visual check. Žádný unit test framework v repu.

---

## Task 1: Vytvořit `MediaPlaceholder.astro` (sdílený placeholder)

**Files:**
- Create: `src/components/MediaPlaceholder.astro`

**Důvod:** Hero + Spotlight oba potřebují placeholder block s Q-mark logem. DRY → jedna komponenta.

- [ ] **Step 1: Vytvořit komponentu**

```astro
---
// MediaPlaceholder.astro — layout-stable placeholder block for future imagery
// (team photos, Excalidraw diagrams). DESIGN_BRIEF zakazuje stock photos,
// takže rezervujeme jen prostor s Q-mark monogramem.
//
// Props:
// - aspect: 'square' | 'video' | '4-3' (default 'square')
// - label: optional caption shown under glyph (e.g., "Foto: Tým u tabule")
// - tint: 'warm' (default) | 'cool' — background variant

interface Props {
  aspect?: 'square' | 'video' | '4-3';
  label?: string;
  tint?: 'warm' | 'cool';
}

const { aspect = 'square', label, tint = 'warm' } = Astro.props;

const aspectClass = {
  square: 'aspect-square',
  video: 'aspect-video',
  '4-3': 'aspect-[4/3]',
}[aspect];

const bgClass = tint === 'warm' ? 'bg-bg-warm' : 'bg-bg-cool';
---
<figure class={`${aspectClass} ${bgClass} relative overflow-hidden rounded border border-border`}>
  <div class="absolute inset-0 flex items-center justify-center">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      class="h-1/3 w-1/3 text-amber/40"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" stroke-width="3" />
      <line x1="44" y1="44" x2="58" y2="58" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
  </div>
  {label && (
    <figcaption class="absolute bottom-0 left-0 right-0 bg-bg/80 px-md py-sm text-label uppercase tracking-wider text-ink-soft backdrop-blur-sm">
      {label}
    </figcaption>
  )}
</figure>
```

- [ ] **Step 2: Verify Tailwind tokens existují**

Run: `grep -n "color-ink-soft\|bg-cool\|color-border" src/styles/global.css`

Expected: `--color-ink-soft`, `--color-border` existují. Pokud `--color-bg-cool` neexistuje, použít `bg-bg` (default page background).

- [ ] **Step 3: Quick visual check — vytvořit dočasnou test stránku**

Edit: vytvořit `src/pages/_test-placeholder.astro` jen pro lokální verifikaci:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import MediaPlaceholder from '../components/MediaPlaceholder.astro';
---
<BaseLayout title="placeholder test" description="dev only">
  <div class="container-quc py-xxl grid gap-lg md:grid-cols-3">
    <MediaPlaceholder />
    <MediaPlaceholder aspect="video" label="Foto: Tým u tabule" />
    <MediaPlaceholder aspect="4-3" />
  </div>
</BaseLayout>
```

- [ ] **Step 4: Spustit dev server, ověřit render**

Run: `pnpm dev` (v separátním terminálu), otevřít `http://localhost:4321/_test-placeholder`.
Expected: 3 boxy s Q-glyphem uvnitř, layout-stable, žádný error v konzoli.

- [ ] **Step 5: Smazat test stránku, commit**

```bash
rm src/pages/_test-placeholder.astro
git add src/components/MediaPlaceholder.astro
git commit -m "Add MediaPlaceholder component for layout-stable image slots"
```

---

## Task 2: Rozšířit Zod schema o nové fieldy

**Files:**
- Modify: `src/content.config.ts:29-63`

**Důvod:** Bez schema změny MDX frontmatter selže build. Všechny nové fieldy jsou **optional**, aby existující MDX nepřestaly stavět.

- [ ] **Step 1: Přidat 4 nové fieldy do `sluzby` collection schema**

Edit `src/content.config.ts`, mezi `faq` a uzavírací `}),` (kolem řádku 61):

```typescript
    // Bento grid cards pro sekci "Co konkrétně děláme" (plan §1.3 step 3).
    // 4 items typicky: 2 půlí 3-col grid (span 2), 2 stojí samostatně. Poslední
    // card s accent='dark' renderuje na tmavém pozadí (Stitch A line 206).
    whatWeDo: z
      .array(
        z.object({
          title: z.string(),
          body: z.string(),
          tags: z.array(z.string()).default([]),
          span: z.enum(['1', '2']).default('1'),
          accent: z.enum(['default', 'dark']).default('default'),
        }),
      )
      .default([]),
    // Per-service spotlight (Datová připravenost pro analyzu, GDPR pro automatizaci, …).
    // Pokud chybí, sekce se vůbec nezobrazí.
    spotlight: z
      .object({
        eyebrow: z.string().optional(),
        headline: z.string(),
        body: z.string(),
        ctaLabel: z.string().optional(),
        ctaHref: z.string().optional(),
        mediaLabel: z.string().optional(),
      })
      .optional(),
    // Typické výsledky (plan §1.3 step 5) — krátký stat grid.
    outcomes: z
      .array(
        z.object({
          metric: z.string(), // "20–50 %"
          label: z.string(),  // "úspora času na opakovaných úkonech"
        }),
      )
      .default([]),
    // Co neděláme (plan §1.3 step 8 + origin §5.6).
    weDontDo: z
      .array(
        z.object({
          title: z.string(),
          body: z.string(),
        }),
      )
      .default([]),
```

- [ ] **Step 2: Type check**

Run: `cd quconsult-web && pnpm astro check`
Expected: PASS — žádné nové errors. (Existující MDX nemají tyto fieldy, ale jsou optional/default([]), takže projdou.)

- [ ] **Step 3: Build check**

Run: `pnpm build`
Expected: PASS — všechny 4 existující MDX se buildnou.

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts
git commit -m "Extend sluzby schema with bento/spotlight/outcomes/weDontDo fields"
```

---

## Task 3: Vytvořit `ServiceBentoGrid.astro`

**Files:**
- Create: `src/components/ServiceBentoGrid.astro`

**Reference:** Stitch winner `03-service-detail-A-larger-920634b5.html:177-215` (sekce "Co konkrétně děláme — Bento Grid").

- [ ] **Step 1: Vytvořit komponentu**

```astro
---
// ServiceBentoGrid.astro — render "Co konkrétně děláme" jako 3-sloupcový bento grid.
// Items s span='2' zaberou 2 sloupce, items s accent='dark' renderují na tmavém
// pozadí (per Stitch A line 206-212). Žádné material-symbols ikony (CLAUDE.md
// §3 "no glassmorphism/neon") — jen číslo + typografie.

interface BentoItem {
  title: string;
  body: string;
  tags: string[];
  span: '1' | '2';
  accent: 'default' | 'dark';
}

interface Props {
  eyebrow?: string;
  heading: string;
  items: BentoItem[];
}

const { eyebrow, heading, items } = Astro.props;
---
<section class="container-quc py-xxl">
  <div class="max-w-3xl">
    {eyebrow && (
      <p class="text-label uppercase tracking-wider text-amber">{eyebrow}</p>
    )}
    <h2 class="mt-sm font-serif text-3xl text-ink md:text-h2-desktop">
      {heading}
    </h2>
  </div>
  <div class="mt-xl grid gap-md md:grid-cols-3">
    {items.map((item, i) => {
      const isDark = item.accent === 'dark';
      const spanClass = item.span === '2' ? 'md:col-span-2' : '';
      const cardClasses = isDark
        ? 'rounded border border-ink bg-ink p-xl text-bg'
        : 'rounded border border-border bg-bg-warm/40 p-xl';
      const bodyClasses = isDark ? 'text-bg/70' : 'text-ink-muted';
      const numberClasses = isDark ? 'text-amber-light' : 'text-amber';
      return (
        <article class={`${cardClasses} ${spanClass} flex flex-col`}>
          <span
            class={`font-serif text-4xl ${numberClasses}`}
            aria-hidden="true"
          >0{i + 1}</span>
          <h3 class={`mt-md font-serif text-xl md:text-2xl ${isDark ? 'text-bg' : 'text-ink'}`}>
            {item.title}
          </h3>
          <p class={`mt-md text-body ${bodyClasses}`}>{item.body}</p>
          {item.tags.length > 0 && (
            <ul class="mt-xl flex flex-wrap gap-sm">
              {item.tags.map((tag) => (
                <li class={`rounded border px-md py-sm text-label ${
                  isDark
                    ? 'border-bg/30 text-bg/80'
                    : 'border-border text-ink-soft'
                }`}>{tag}</li>
              ))}
            </ul>
          )}
        </article>
      );
    })}
  </div>
</section>
```

- [ ] **Step 2: Verify tokens**

Run: `grep -n "color-amber-light\|color-ink-soft\|--spacing-sm" src/styles/global.css`
Expected: všechny tokeny existují. Pokud `amber-light` neexistuje, použít `text-amber`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ServiceBentoGrid.astro
git commit -m "Add ServiceBentoGrid component for 'Co konkrétně děláme' section"
```

---

## Task 4: Vytvořit `ServiceSpotlight.astro`

**Files:**
- Create: `src/components/ServiceSpotlight.astro`

**Reference:** Stitch winner line 252-268 (Datová připravenost split card s amber-tinted background).

- [ ] **Step 1: Vytvořit komponentu**

```astro
---
// ServiceSpotlight.astro — per-service "feature spotlight" split card.
// Levý sloupec: eyebrow + H2 + body + optional CTA.
// Pravý sloupec: MediaPlaceholder (4-3 aspect, ne čtverec — Stitch má 1/3 width).
//
// Pro /sluzby/analyza-a-strategie = "Datová připravenost" (56 % hook).
// Pro ostatní = volitelný per-service hook.

import MediaPlaceholder from './MediaPlaceholder.astro';

interface Props {
  eyebrow?: string;
  headline: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  mediaLabel?: string;
}

const { eyebrow, headline, body, ctaLabel, ctaHref, mediaLabel } = Astro.props;
---
<section class="container-quc py-xxl">
  <div class="overflow-hidden rounded border border-border bg-bg-warm">
    <div class="grid items-stretch md:grid-cols-[2fr_1fr]">
      <div class="p-xl md:p-xxl">
        {eyebrow && (
          <p class="text-label uppercase tracking-wider text-amber">{eyebrow}</p>
        )}
        <h2 class="mt-sm font-serif text-3xl text-ink md:text-h2-desktop">
          {headline}
        </h2>
        <p class="mt-md text-body-lg text-ink-muted">{body}</p>
        {ctaLabel && ctaHref && (
          <a
            href={ctaHref}
            class="mt-xl inline-flex items-center rounded bg-amber px-lg py-md text-label font-medium text-bg transition-colors hover:bg-amber-deep"
          >
            {ctaLabel}
          </a>
        )}
      </div>
      <div class="border-t border-border md:border-l md:border-t-0">
        <MediaPlaceholder aspect="4-3" label={mediaLabel} />
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ServiceSpotlight.astro
git commit -m "Add ServiceSpotlight component for per-service feature card"
```

---

## Task 5: Vytvořit `ServiceOutcomes.astro`

**Files:**
- Create: `src/components/ServiceOutcomes.astro`

**Reference:** plan §1.3 step 5 ("Typické výsledky — úspora času v %, ROI, doba první value").

- [ ] **Step 1: Vytvořit komponentu**

```astro
---
// ServiceOutcomes.astro — krátký stat grid s typickými výsledky.
// 2–4 položky, velké serif metriky + label.

interface Outcome {
  metric: string;
  label: string;
}

interface Props {
  heading?: string;
  eyebrow?: string;
  items: Outcome[];
}

const {
  heading = 'Typické výsledky',
  eyebrow = 'Co reálně vychází',
  items,
} = Astro.props;

const cols = items.length === 2 ? 'md:grid-cols-2' :
             items.length === 3 ? 'md:grid-cols-3' :
             'md:grid-cols-2 lg:grid-cols-4';
---
<section class="container-quc py-xxl">
  <div class="max-w-3xl">
    <p class="text-label uppercase tracking-wider text-amber">{eyebrow}</p>
    <h2 class="mt-sm font-serif text-3xl text-ink md:text-h2-desktop">
      {heading}
    </h2>
    <p class="mt-md text-body text-ink-muted">
      Konkrétní čísla z reálných projektů. Vaše výsledky se budou lišit podle
      odvětví, dat a rozsahu pilotu.
    </p>
  </div>
  <dl class={`mt-xl grid gap-xl ${cols}`}>
    {items.map((o) => (
      <div class="border-l-2 border-amber pl-lg">
        <dt class="font-serif text-4xl text-ink md:text-5xl">{o.metric}</dt>
        <dd class="mt-sm text-body text-ink-muted">{o.label}</dd>
      </div>
    ))}
  </dl>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ServiceOutcomes.astro
git commit -m "Add ServiceOutcomes component for typical results stat grid"
```

---

## Task 6: Vytvořit `ServiceWeDontDo.astro`

**Files:**
- Create: `src/components/ServiceWeDontDo.astro`

**Reference:** Stitch winner line 301-333 ("Co neděláme" tmavá sekce) + plan §1.3 step 8 (link na origin §5.6).

- [ ] **Step 1: Vytvořit komponentu**

```astro
---
// ServiceWeDontDo.astro — tmavá sekce s 3-5 položkami "co tato služba není".
// Buduje důvěru transparentností. Stitch A line 301-333 jako vizuální referenc.
// Bez material-symbols — jen "—" jako amber prefix.

interface Item {
  title: string;
  body: string;
}

interface Props {
  heading?: string;
  intro?: string;
  items: Item[];
}

const {
  heading = 'Co neděláme',
  intro = 'Stavíme na důvěře — proto rovnou říkáme, kde naše kompetence končí nebo co považujeme za špatnou cestu.',
  items,
} = Astro.props;
---
<section class="bg-ink text-bg">
  <div class="container-quc py-xxl">
    <div class="grid gap-xl md:grid-cols-2 md:items-start">
      <div>
        <p class="text-label uppercase tracking-wider text-amber">Upřímně</p>
        <h2 class="mt-sm font-serif text-3xl md:text-h2-desktop">{heading}</h2>
        <p class="mt-md text-body-lg text-bg/70">{intro}</p>
      </div>
      <ul class="space-y-lg">
        {items.map((item) => (
          <li class="flex gap-md">
            <span class="mt-1 flex-shrink-0 font-serif text-2xl text-amber" aria-hidden="true">—</span>
            <div>
              <h3 class="font-serif text-xl">{item.title}</h3>
              <p class="mt-sm text-body text-bg/70">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ServiceWeDontDo.astro
git commit -m "Add ServiceWeDontDo component for trust-building 'non-goals' section"
```

---

## Task 7: Přidat `media` named slot do `Hero.astro`

**Files:**
- Modify: `src/components/Hero.astro`

**Důvod:** Service detail hero potřebuje obrázkový sloupec vpravo (Stitch A line 142-149). Hero se používá i jinde (homepage, /o-nas, /jak-pracujeme) — proto opt-in přes named slot, ne breaking change.

- [ ] **Step 1: Přepsat Hero.astro tak, aby detekoval `media` slot**

Replace celý soubor obsah s tímto:

```astro
---
// Hero.astro — page hero block. Used on homepage, service detail pages,
// /o-nas, /jak-pracujeme. Title is the default slot; optional `media` named
// slot puts content (typically MediaPlaceholder) into right column on md+.
//
// Props:
// - eyebrow / subtitle / primaryCta / secondaryCta / align / tight (existující)
// Slots:
// - default: H1 obsah (povinný)
// - media: pravý sloupec — když je vyplněn, hero přepne na 8/4 grid layout

interface Cta { label: string; href: string; }

interface Props {
  eyebrow?: string;
  subtitle?: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  align?: 'left' | 'center';
  tight?: boolean;
}

const {
  eyebrow,
  subtitle,
  primaryCta,
  secondaryCta,
  align = 'left',
  tight = false,
} = Astro.props;

const hasMedia = Astro.slots.has('media');
const alignClass = align === 'center' ? 'text-center mx-auto' : '';
const padClass = tight ? 'py-xl' : 'py-xxl';

// S media slotem ignorujeme `align` (vždy 8/4 grid); bez něj zachováme původní layout.
const textColClass = hasMedia
  ? 'md:col-span-8'
  : `max-w-3xl ${alignClass}`;
---
<section class={`container-quc ${padClass}`}>
  {hasMedia ? (
    <div class="grid items-center gap-xl md:grid-cols-12">
      <div class={textColClass}>
        {eyebrow && (
          <p class="text-label uppercase tracking-wider text-amber">{eyebrow}</p>
        )}
        <h1 class="mt-md font-serif text-h1-mobile leading-[1.1] tracking-tight md:text-h1-desktop">
          <slot />
        </h1>
        {subtitle && (
          <p class="mt-lg text-body-lg text-ink-muted max-w-2xl">{subtitle}</p>
        )}
        {(primaryCta || secondaryCta) && (
          <div class="mt-xl flex flex-wrap gap-md">
            {primaryCta && (
              <a
                href={primaryCta.href}
                class="inline-flex items-center rounded bg-amber px-lg py-md text-label font-medium text-bg transition-colors hover:bg-amber-deep"
              >
                {primaryCta.label}
              </a>
            )}
            {secondaryCta && (
              <a
                href={secondaryCta.href}
                class="inline-flex items-center rounded border border-ink px-lg py-md text-label font-medium text-ink transition-colors hover:border-amber hover:text-amber"
              >
                {secondaryCta.label}
              </a>
            )}
          </div>
        )}
      </div>
      <div class="md:col-span-4">
        <slot name="media" />
      </div>
    </div>
  ) : (
    <div class={textColClass}>
      {eyebrow && (
        <p class="text-label uppercase tracking-wider text-amber">{eyebrow}</p>
      )}
      <h1 class="mt-md font-serif text-h1-mobile leading-[1.1] tracking-tight md:text-h1-desktop">
        <slot />
      </h1>
      {subtitle && (
        <p class="mt-lg text-body-lg text-ink-muted">{subtitle}</p>
      )}
      {(primaryCta || secondaryCta) && (
        <div class={`mt-xl flex flex-wrap gap-md ${align === 'center' ? 'justify-center' : ''}`}>
          {primaryCta && (
            <a
              href={primaryCta.href}
              class="inline-flex items-center rounded bg-amber px-lg py-md text-label font-medium text-bg transition-colors hover:bg-amber-deep"
            >
              {primaryCta.label}
            </a>
          )}
          {secondaryCta && (
            <a
              href={secondaryCta.href}
              class="inline-flex items-center rounded border border-ink px-lg py-md text-label font-medium text-ink transition-colors hover:border-amber hover:text-amber"
            >
              {secondaryCta.label}
            </a>
          )}
        </div>
      )}
    </div>
  )}
</section>
```

- [ ] **Step 2: Ověřit, že existující stránky bez media slotu se nerozbily**

Run: `pnpm dev`
Open: `http://localhost:4321/` (homepage), `http://localhost:4321/o-nas`, `http://localhost:4321/jak-pracujeme`.
Expected: hero vypadá identicky jako před změnou (jednosloupcový layout, žádný regres).

- [ ] **Step 3: Commit**

```bash
git add src/components/Hero.astro
git commit -m "Add 'media' named slot to Hero for service detail right column"
```

---

## Task 8: Doplnit frontmatter v `analyza-a-strategie.mdx`

**Files:**
- Modify: `src/content/sluzby/analyza-a-strategie.mdx`

- [ ] **Step 1: Vložit nové frontmatter fieldy před uzavírací `---`**

V souboru `src/content/sluzby/analyza-a-strategie.mdx`, mezi existující `faq:` blok (řádek 30-40) a uzavírací `---` na řádku 41, vložit:

```yaml
whatWeDo:
  - title: "Audit procesů a mapování"
    body: "Identifikujeme high-impact místa, kde u vás konkrétně AI přinese nejrychlejší návratnost. Neřešíme teorii, ale konkrétní úzká místa, kde tým ztrácí čas."
    tags: ["Quick wins", "Procesní mapa"]
    span: "2"
    accent: "default"
  - title: "Datová připravenost"
    body: "Posouzení kvality, dostupnosti a bezpečnosti vašich dat. Bez čistých dat neexistuje funkční AI."
    tags: []
    span: "1"
    accent: "default"
  - title: "Business case v Kč"
    body: "Přesný propočet ROI. Kolik implementace stojí, kdy a kolik začne reálně šetřit nebo vydělávat."
    tags: []
    span: "1"
    accent: "default"
  - title: "Technická architektura"
    body: "Navrhneme stack (LLMs, RAG, custom modely), který je bezpečný a škálovatelný. Žádný vendor lock-in, vždy s exit strategií."
    tags: ["Bezpečnost", "Bez vendor lock-inu"]
    span: "2"
    accent: "dark"
spotlight:
  eyebrow: "Nejčastější blokátor"
  headline: "56 % českých firem naráží při zavádění AI na kvalitu dat"
  body: "Většina projektů selže nikoli kvůli špatné technologii, ale kvůli roztříštěným nebo neexistujícím datům. Posouzení datové připravenosti je standardní součást Discovery — řekneme rovnou, co je třeba dorovnat dřív, než cokoli postavíme."
  ctaLabel: "Vyzkoušet AI Readiness Assessment"
  ctaHref: "/ai-readiness"
  mediaLabel: "Schéma: posouzení datové připravenosti"
outcomes:
  - metric: "2 týdny"
    label: "Discovery fáze s fixním rozpočtem a konkrétním výstupem"
  - metric: "10×"
    label: "Méně utracených peněz, když začnete mapou místo experimentu"
  - metric: "4 měsíce"
    label: "Typický čas od konce Discovery k první měřitelné hodnotě v Kč"
weDontDo:
  - title: "Věštění budoucnosti"
    body: "Neprodáváme vize, jak AI změní svět za 5 let. Řešíme bolesti, které máte dnes."
  - title: "18měsíční transformace"
    body: "Nenavrhujeme nekonečné projekty bez jasného konce. Pracujeme v cyklech po 2 týdnech."
  - title: "Nahrazování vašeho IT"
    body: "Nepřišli jsme bojovat s vaším IT. Dáváme jim nástroje a know-how, které jim chybí."
```

Long-form prose body (řádky 43+) zůstává **beze změny** — vyřkne se mezi "Jak spolupracujeme" a "Typické výsledky" v [slug].astro.

- [ ] **Step 2: Build check**

Run: `pnpm build`
Expected: PASS. Žádné Zod validation errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/sluzby/analyza-a-strategie.mdx
git commit -m "Add bento/spotlight/outcomes/weDontDo content to AI Analýza service"
```

---

## Task 9: Doplnit frontmatter v `automatizace-procesu.mdx`

**Files:**
- Modify: `src/content/sluzby/automatizace-procesu.mdx`

- [ ] **Step 1: Vložit nové frontmatter fieldy před uzavírací `---`**

V souboru `src/content/sluzby/automatizace-procesu.mdx`, před `---` na řádku 43, vložit:

```yaml
whatWeDo:
  - title: "Zpracování objednávek a dokumentů"
    body: "PDF a Excel z e-mailu rozparsuje workflow, zvaliduje proti ceníku a založí návrh v ERP. Lidé pak jen schvalují, nepřepisují."
    tags: ["Pohoda", "Helios", "SAP B1"]
    span: "2"
    accent: "default"
  - title: "Měsíční reporty"
    body: "Reporty běží v noci. Ráno čekají v inboxu místo 4–8 hodin manuální agregace."
    tags: []
    span: "1"
    accent: "default"
  - title: "Reklamace a kvalita"
    body: "Jednotná evidence místo Excelů, automatická kategorizace, audit trail pro ISO a IATF."
    tags: []
    span: "1"
    accent: "default"
  - title: "Self-hosted, GDPR-friendly"
    body: "n8n běží na vaší infrastruktuře. Žádné per-execution poplatky, žádný vendor lock-in. CrewAI pro multi-agentní toky. Ollama tam, kde data nesmí opustit firmu."
    tags: ["n8n", "CrewAI", "Ollama"]
    span: "2"
    accent: "dark"
spotlight:
  eyebrow: "Bezpečnost a GDPR"
  headline: "Firemní data zůstávají u vás, ne v cizím cloudu"
  body: "Self-hosted je výchozí volba. Citlivá data (zákazníci, mzdy, zdravotka) řešíme on-premise modely. GDPR audit je součást implementace, ne dodatek na konci — retence, logy přístupů, právo být zapomenut řešíme v návrhu."
  ctaLabel: "Probrat váš případ"
  ctaHref: "/kontakt"
  mediaLabel: "Diagram: self-hosted architektura"
outcomes:
  - metric: "20–50 %"
    label: "Úspora času na opakovaných úkonech v administrativě"
  - metric: "4–8 týdnů"
    label: "Pilotní implementace prvního procesu za fixní cenu"
  - metric: "6 měsíců"
    label: "Typická návratnost pilotu u zpracování objednávek"
weDontDo:
  - title: "Cloud-only Make / Zapier"
    body: "Rychlé na start, dlouhodobě drahé a se silným vendor lock-inem. Začínáme self-hosted."
  - title: "Velký bang nasazení"
    body: "Nerozjíždíme 5 workflow naráz. Vždy jeden proces, naučíte se na něm, pak rozšiřujeme."
  - title: "Skryté licenční pasti"
    body: "Předáváme zdrojový kód workflow a školení vašeho IT. Pokud chcete pokračovat sami, můžete."
```

- [ ] **Step 2: Build check**

Run: `pnpm build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/content/sluzby/automatizace-procesu.mdx
git commit -m "Add bento/spotlight/outcomes/weDontDo content to Automatizace service"
```

---

## Task 10: Doplnit frontmatter v `skoleni.mdx`

**Files:**
- Modify: `src/content/sluzby/skoleni.mdx`

- [ ] **Step 1: Přečíst současný stav, zachovat existující fieldy**

Run: `cat src/content/sluzby/skoleni.mdx | head -45`

- [ ] **Step 2: Vložit nové frontmatter fieldy před uzavírací `---`**

Vložit (po `faq:` bloku):

```yaml
whatWeDo:
  - title: "Pro vedení"
    body: "Půldenní workshop pro CEO a board: kde AI dnes reálně funguje, kde je hype, jak číst nabídku od dodavatele. Strategický rámec, ne klikání."
    tags: ["1 den", "Strategie"]
    span: "2"
    accent: "default"
  - title: "Pro odborné týmy"
    body: "Hands-on s LLM, RAG, integracemi. 2–3 dny s konkrétní úlohou z vaší firmy."
    tags: ["2–3 dny"]
    span: "1"
    accent: "default"
  - title: "Pro IT"
    body: "Self-hosting, bezpečnost, audit. Co provozovat sami, co nakupovat, na co si dát pozor."
    tags: ["2 dny", "Bezpečnost"]
    span: "1"
    accent: "default"
  - title: "Pro celou firmu"
    body: "Krátký vstupní formát (2–3 h) pro 30–80 lidí — co AI je, co AI není, jak ji denně používat bezpečně a kde jsou hranice."
    tags: ["2–3 h", "Awareness"]
    span: "2"
    accent: "dark"
spotlight:
  eyebrow: "Formát na míru"
  headline: "Školení vždy s vaší úlohou, ne s ukázkovými cvičeními"
  body: "Týden před workshopem si vyžádáme reálné dokumenty, procesy a otázky z vaší firmy. Lidé odcházejí s něčím, co můžou používat v pondělí ráno — ne s odlitkem od jiné firmy."
  mediaLabel: "Foto: Workshop na klientské straně"
outcomes:
  - metric: "2–3 dny"
    label: "Standardní délka technického workshopu pro odborný tým"
  - metric: "8–25"
    label: "Optimální velikost skupiny pro hands-on formát"
  - metric: "100 %"
    label: "Materiály a nahrávky zůstávají vám pro interní opakování"
weDontDo:
  - title: "Generická e-learning videa"
    body: "Žádné pre-recorded kurzy z polic. Každé školení vychází z vaší aktuální agendy a otázek."
  - title: "Certifikace bez obsahu"
    body: "Neprodáváme razítka. Lepší je odejít s funkčním promptem než s diplomem na zdi."
  - title: "1 den a hotovo"
    body: "Po jednodenním kurzu si nikdo nic nezapamatuje. Pracujeme s návazností a follow-up sessions."
```

- [ ] **Step 3: Build check**

Run: `pnpm build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/content/sluzby/skoleni.mdx
git commit -m "Add bento/spotlight/outcomes/weDontDo content to Školení service"
```

---

## Task 11: Doplnit frontmatter v `implementace-a-vyvoj.mdx`

**Files:**
- Modify: `src/content/sluzby/implementace-a-vyvoj.mdx`

- [ ] **Step 1: Vložit nové frontmatter fieldy před uzavírací `---`**

```yaml
whatWeDo:
  - title: "AI features do vašich aplikací"
    body: "Inteligentní vyhledávání, generování dokumentů, klasifikace, doporučování — integrované přímo do toho, co používáte denně, ne jako externí nástroj vedle."
    tags: ["RAG", "LLM API", "Integrace"]
    span: "2"
    accent: "default"
  - title: "Custom modely"
    body: "Tam, kde standardní LLM nestačí — fine-tuning, klasické ML, hybridní pipeline."
    tags: []
    span: "1"
    accent: "default"
  - title: "On-premise nasazení"
    body: "Ollama, vLLM, llama.cpp na vaší infrastruktuře. Pro citlivá data, kde cloud nepřichází v úvahu."
    tags: []
    span: "1"
    accent: "default"
  - title: "Code-first, žádné drag-and-drop"
    body: "Implementujeme v Pythonu / TypeScriptu, ne v ‚AI buildery‘ co skončí v zásuvce. Zdrojový kód patří vám, infrastruktura taky."
    tags: ["Python", "TypeScript", "Kubernetes"]
    span: "2"
    accent: "dark"
spotlight:
  eyebrow: "Agentic OS"
  headline: "Implementujeme to, co denně používáme uvnitř QuConsult"
  body: "Náš vlastní operační systém běží na agentických workflow — od fakturace po výzkum trhu. Není to SaaS produkt. Je to demonstrace, jak přemýšlíme o implementaci a kde už máme zajeté postupy."
  ctaLabel: "Podívat se, jak řídíme vlastní firmu"
  ctaHref: "/jak-pracujeme"
  mediaLabel: "Screenshot: Agentic OS dashboard"
outcomes:
  - metric: "6–12 týdnů"
    label: "Typický rozsah první implementační iterace s pevnou cenou"
  - metric: "100 %"
    label: "Zdrojový kód a infrastruktura předány vám, žádný vendor lock-in"
  - metric: "2–3 měsíce"
    label: "Provozní stabilizace s naším retainerem nebo s předáním IT"
weDontDo:
  - title: "AI buildery a no-code"
    body: "Drag-and-drop nástroje skončí v zásuvce. Stavíme v kódu, který se dá udržovat a auditovat."
  - title: "Cizí cloud pro citlivá data"
    body: "Na zákaznická a mzdová data jdeme on-premise modelem. Cloud LLM jen tam, kde data nejsou citlivá."
  - title: "Resold SaaS pod naší značkou"
    body: "Neprodáváme cizí produkty s naší přirážkou. Když je hotové řešení lepší, řekneme to a doporučíme ho přímo."
```

- [ ] **Step 2: Build check**

Run: `pnpm build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/content/sluzby/implementace-a-vyvoj.mdx
git commit -m "Add bento/spotlight/outcomes/weDontDo content to Implementace service"
```

---

## Task 12: Restrukturalizovat `[slug].astro` (hlavní změna)

**Files:**
- Modify: `src/pages/sluzby/[slug].astro`

**Důvod:** Zařadit 4 nové sekce, opravit FAQ šířku, předat hero `media` slot.

- [ ] **Step 1: Přepsat horní část souboru s importy + Hero**

V `src/pages/sluzby/[slug].astro` najít blok importů (řádky 9-12) a nahradit:

```astro
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import Hero from '../../components/Hero.astro';
import CTASection from '../../components/CTASection.astro';
import MediaPlaceholder from '../../components/MediaPlaceholder.astro';
import ServiceBentoGrid from '../../components/ServiceBentoGrid.astro';
import ServiceSpotlight from '../../components/ServiceSpotlight.astro';
import ServiceOutcomes from '../../components/ServiceOutcomes.astro';
import ServiceWeDontDo from '../../components/ServiceWeDontDo.astro';
```

- [ ] **Step 2: Přidat `media` slot do Hero invocation**

Najít blok `<Hero ... >` (řádek 73-82). Nahradit:

```astro
  <Hero
    eyebrow={data.eyebrow ?? 'Služba'}
    subtitle={data.heroSubtitle}
    primaryCta={{ label: 'Domluvit bezplatnou konzultaci', href: '/kontakt' }}
    secondaryCta={isPrimary
      ? { label: 'AI Readiness Assessment', href: '/ai-readiness' }
      : { label: 'Všechny služby', href: '/sluzby' }}
  >
    {data.title}
    <MediaPlaceholder slot="media" aspect="square" />
  </Hero>
```

- [ ] **Step 3: Vložit `ServiceBentoGrid` mezi "Pro koho" a current MDX block**

Najít konec "Pro koho" section (kolem řádku 102 `</section>`). Mezi to a `<!-- Tělo z MDX -->` (řádek 104) vložit:

```astro
  {data.whatWeDo.length > 0 && (
    <ServiceBentoGrid
      eyebrow="Rozsah spolupráce"
      heading="Co konkrétně děláme"
      items={data.whatWeDo}
    />
  )}

  {data.spotlight && (
    <ServiceSpotlight
      eyebrow={data.spotlight.eyebrow}
      headline={data.spotlight.headline}
      body={data.spotlight.body}
      ctaLabel={data.spotlight.ctaLabel}
      ctaHref={data.spotlight.ctaHref}
      mediaLabel={data.spotlight.mediaLabel}
    />
  )}
```

- [ ] **Step 4: MDX tělo přesunout za "Jak spolupracujeme"**

Najít sekci `<!-- Tělo z MDX -->` (řádek 104-109) a **smazat** ji z aktuální pozice. Najít konec "Jak spolupracujeme" sekce (kolem řádku 139 `</section>`) a vložit **za ni**:

```astro
  <!-- Long-form prose body (Discovery details, retainer, GDPR, …) -->
  <section class="container-quc py-xxl">
    <div class="prose-quc max-w-3xl">
      <Content />
    </div>
  </section>

  {data.outcomes.length > 0 && (
    <ServiceOutcomes items={data.outcomes} />
  )}
```

- [ ] **Step 5: Vložit `ServiceWeDontDo` mezi "Cena" a FAQ**

Najít konec "Cena" sekce (kolem řádku 170) a vložit za ni:

```astro
  {data.weDontDo.length > 0 && (
    <ServiceWeDontDo items={data.weDontDo} />
  )}
```

- [ ] **Step 6: Opravit FAQ width**

Najít blok FAQ `<ul class="mt-xl max-w-3xl space-y-md">` (kolem řádku 182). Nahradit `max-w-3xl` zarovnáním na `max-w-[800px] mx-auto` (centered, per Stitch line 336). Také odebrat `max-w-3xl` z heading bloku a místo toho centrovat:

Replace:

```astro
        <div class="max-w-3xl">
          <p class="text-label uppercase tracking-wider text-amber">Otázky</p>
          <h2 class="mt-sm font-serif text-3xl text-ink md:text-h2-desktop">
            Časté dotazy
          </h2>
        </div>
        <ul class="mt-xl max-w-3xl space-y-md">
```

With:

```astro
        <div class="mx-auto max-w-[800px] text-center">
          <p class="text-label uppercase tracking-wider text-amber">Otázky</p>
          <h2 class="mt-sm font-serif text-3xl text-ink md:text-h2-desktop">
            Časté dotazy
          </h2>
        </div>
        <ul class="mx-auto mt-xl max-w-[800px] space-y-md">
```

- [ ] **Step 7: Build + dev check**

Run: `pnpm build`
Expected: PASS — všechny 4 stránky se buildnou.

Run: `pnpm dev`
Open: `http://localhost:4321/sluzby/analyza-a-strategie`
Expected: Hero má vpravo placeholder čtverec. Pod "Pro koho" je bento grid se 4 kartami. Pod ním je Datová připravenost split card. Po "Jak spolupracujeme" jde MDX prose. Pod ní stat grid s 3 výsledky. Pak Cena. Pak tmavá "Co neděláme" sekce. Pak FAQ vycentrovaný. Pak CTA.

Otevřít všechny 4 detail stránky a vizuálně ověřit.

- [ ] **Step 8: Commit**

```bash
git add src/pages/sluzby/[slug].astro
git commit -m "Restructure service detail page: bento, spotlight, outcomes, weDontDo + FAQ width fix"
```

---

## Task 13: Vizuální QA a screenshoty před PR

**Files:**
- (žádné — jen verifikace)

- [ ] **Step 1: Lighthouse perf check**

V dev tools nebo přes `pnpm dlx lighthouse http://localhost:4321/sluzby/analyza-a-strategie --view`.
Expected: LCP < 2.5 s, CLS < 0.05 (CLAUDE.md §4 baseline).

- [ ] **Step 2: Diakritika test**

Otevřít každou ze 4 stránek a vyhledat (Cmd+F) test větu nebo náhodný odstavec s diakritikou. Zkontrolovat, že `ě š č ř ž ý á í é ů ú ď ť ň` renderují čistě.

- [ ] **Step 3: Reduced motion check**

V dev tools: Rendering → "Emulate CSS prefers-reduced-motion: reduce". Reload — žádné animace nesmí běžet.

- [ ] **Step 4: JS-off check**

V dev tools: Settings → Preferences → "Disable JavaScript". Reload — stránka musí zůstat čitelná (FAQ `<details>` funguje nativně bez JS).

- [ ] **Step 5: Mobile preview**

Resize na 375 px (iPhone SE). Ověřit: bento grid se skládá na 1 sloupec, spotlight split na top-bottom, "Co neděláme" 2-col grid se skládá na single column, hero media placeholder se zarovná pod text.

- [ ] **Step 6: Pre-commit hook a lint**

Run: `pnpm astro check && pnpm exec prettier --check 'src/**/*.{astro,ts,mdx}'`
Expected: PASS. Pokud prettier nehlásí PASS, spustit `prettier --write` a commit fix.

- [ ] **Step 7: Push branch + otevřít PR (jen po user approvalu)**

Po výslovném souhlasu uživatele:

```bash
git push -u origin <branch-name>
gh pr create --title "feat(sluzby): bento, spotlight, výsledky, co neděláme + FAQ fix" --body "$(cat <<'EOF'
## Summary
- Service detail šablona doplněna o 4 chybějící sekce (bento "Co konkrétně děláme", per-service spotlight card, Typické výsledky, Co neděláme) per plan.md §1.3 a Stitch winner 03-service-detail-A-larger-920634b5
- Hero rozšířen o optional `media` named slot pro pravý sloupec; všechny existující stránky bez slotu vypadají identicky
- FAQ vycentrované a širší (`max-w-[800px] mx-auto` místo `max-w-3xl` left-aligned)
- 4 nové optional fieldy v `sluzby` Zod schema (`whatWeDo`, `spotlight`, `outcomes`, `weDontDo`)
- Frontmatter doplněn ve všech 4 service MDX

## Test plan
- [ ] /sluzby/analyza-a-strategie — vizuální check všech 9 sekcí
- [ ] /sluzby/automatizace-procesu — totéž
- [ ] /sluzby/skoleni — totéž
- [ ] /sluzby/implementace-a-vyvoj — totéž
- [ ] Mobile preview 375px na všech 4
- [ ] LCP < 2.5 s, CLS < 0.05
- [ ] JS-off check (FAQ `<details>` funguje)
- [ ] prefers-reduced-motion respect

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review

**Spec coverage:**
- Plan.md §1.3 9-step šablona:
  1. Hero ✓ (Task 7 + 12 step 2 přidávají media slot)
  2. Pro koho ✓ (zachováno, beze změny)
  3. Co konkrétně děláme ✓ (Task 3 + 12 step 3 — bento)
  4. Jak spolupracujeme ✓ (zachováno)
  5. Typické výsledky ✓ (Task 5 + 12 step 4 — outcomes stat grid)
  6. Orientační cena ✓ (zachováno)
  7. FAQ ✓ (Task 12 step 6 — width fix)
  8. Co neděláme ✓ (Task 6 + 12 step 5)
  9. CTA ✓ (zachováno)

- User concerns:
  1. FAQ nezabírá šířku → Task 12 step 6 ✓
  2. Hlavní část jen text, ne celá šířka → Task 3 (bento) + Task 4 (spotlight) replace prose-only s strukturovanými full-width sekcemi; MDX prose zůstává jako long-form mezi sekcemi ✓
  3. Žádné obrázky / placeholdery → Task 1 (MediaPlaceholder) + Task 7 (hero media slot) + Task 4 (spotlight media) ✓

- Stitch decisions.md §3:
  - A's layout: ✓ (sekce a pořadí)
  - 3-card "Pro koho" z B: ✓ (existuje)
  - Brand lockdown: ✓ (header/footer in BaseLayout, beze změny)

**Placeholder scan:**
- Žádné "TODO" / "implement later" / "add error handling" ve steps. Každý step má buď kód nebo přesný shell příkaz s expected output.
- Žádné "Similar to Task N" — všechny frontmatter bloky napsané inline.

**Type consistency:**
- `whatWeDo` field: schema (Task 2) má `{title, body, tags, span, accent}`; bento komponenta (Task 3) konzumuje stejně; všechny 4 MDX (Task 8-11) populují stejně.
- `spotlight` field: schema má optional `{eyebrow, headline, body, ctaLabel, ctaHref, mediaLabel}`; komponenta (Task 4) přijímá identicky.
- `outcomes`: schema `{metric, label}` ↔ komponenta (Task 5) ↔ MDX ✓.
- `weDontDo`: schema `{title, body}` ↔ komponenta (Task 6) ↔ MDX ✓.
- `MediaPlaceholder` props: `aspect`, `label`, `tint` konzistentní napříč Task 1, 4, 7, 12.

**Out-of-scope notes (recap):**
- Skoleni anchor menu, Agentic OS dedicated block — odložené samostatné PR.
- Reálné fotografie / Excalidraw — čeká na team photoshoot.
