---
title: QuConsult — launch nového webu (Astro + GH Pages + Vercel functions)
type: feat
status: active
date: 2026-04-30
origin: plan.md
---

# QuConsult — launch nového webu (Astro + GH Pages + Vercel functions)

## Overview

Postavit a spustit nový marketingový web `quconsult.cz` jako statický Astro
projekt deployovaný přes GH Actions na GitHub Pages, s Vercel serverless
funkcemi pro formuláře. Web je primárním lead-gen kanálem dle plánu (viz
origin: `plan.md` §10–§11) a musí v den spuštění obsahovat: úvodní stránku,
4 stránky služeb, "Jak pracujeme", "O nás", blog (prázdný+1 článek je
v pořádku, viz §14.1 "žádné placeholder coming soon"), kontakt s formulářem,
3 právní stránky, AI Readiness Assessment dotazník.

Plán řeší **4 výstupy** najednou, protože jsou silně provázané:

1. **Validace 4 nabízených služeb** vůči ICP a pricingu — co dát na web a v jaké formě.
2. **Page architecture** — kompletní strom URL, mapování na Stitch designy, co designově chybí.
3. **Astro + GH Pages + Vercel functions setup** — repo struktura, content collections, deploy pipeline.
4. **CLAUDE.md** — runtime kontrakt pro budoucí Claude Code editace webu.

Co tento plán **neřeší** (děláme později nebo jinde):
- Finální copy každé stránky (vznikne ve fázi 3 implementace, sekce po sekci v rámci `/ce:work`).
- Vyplnění obsahu Agentic OS dema a YouTube epizod (§10.3, §14.1 — paralelní pracovní stream).
- Návrh AI Readiness Assessment otázek (§11.5 — vlastní mini-projekt, vznikne v paralelní fázi).
- Designový handoff vizitek, e-mail podpisů, slidů (§14.2 — mimo scope webu).

---

## Origin & sources

**Origin document:** `plan.md` (3. revize, 21. 4. 2026). Veškerá strategická
rozhodnutí — positioning, ICP, služby, pricing, brand voice, vizuální
identita — pochází odsud a tento plán je nepřepisuje. Klíčová rozhodnutí
přenášená do plánu:

- **Marketingová značka:** QuConsult (právní entita WellBe s.r.o.) — viz origin §1.1.
- **Doména:** `quconsult.cz` primární — viz origin §1.1.
- **4 public služby:** Analýza a strategie, Automatizace procesů, (Nejen) AI školení, AI Implementace a vývoj — viz origin §5.
- **Primární CTA:** *"Domluvit bezplatnou 45min konzultaci"* — viz origin §0, §11.4.
- **Sekundární CTA:** *AI Readiness Assessment* — viz origin §11.5.
- **Hero copy:** *"Proměňte AI z buzzwordu ve váš největší konkurenční nástroj"* — viz origin §11.2.
- **Brand voice pravidla:** vykání B2B, krátké věty, žádné anglicismy a buzzwordy — viz origin §7.
- **Vizuální identita:** off-white pozadí #FAFAF8, text #1A1A1A, akcent amber #D97706, Noto Serif + Inter, 1200 px content width — viz origin §8 a `DESIGN_BRIEF.md`.
- **Tým:** 5 lidí s konvenčními tituly (žádní "ninja"/"guru") — viz origin §1.8.
- **Logotyp:** Q jako standalone mark, "QuConsult" jako jedno slovo (camelCase) — viz origin §1.1.
- **Co NEděláme na webu při launchi:** žádné placeholder *"coming soon"*, žádné case studies dokud není první publikovatelná reference (viz origin §14.1, §11.1).

**Stitch designs:** projekt `10554376683748281001` ("QuConsult Brand Identity"),
21 screens, design system načten via Stitch MCP. Theme: off-white
`#fff8f5` background, primary `#8d4b00` (tmavší amber), Noto Serif h1 64 px,
Inter body. Připravené screens (DESKTOP, 2560 px wide):

- **Landing Page** (3 verze, `99c02aca…`, `7d264215…`, `ee33d42a…` *Updated Logo*).
- **Services** (3 verze, `ce783f02…`, `ef25d9e3…`, `e21a3f03…`).
- **Blog** (2 verze, `a89dc6e7…`, `6bdb1869…`).
- **Contact** (2 verze, `671b2ccc…`, `eac97271…`).
- **Services Menu Overlay** (2 verze, `ac787b24…`, `dbc12582…`) — nav dropdown.
- **Brand assets:** Business Cards (3), Email Signatures (3), logo Q-mark.

**Co Stitch nepokrývá** a designově dořešíme později (před implementací každé stránky):

- 4 detail stránky služeb (Stitch má jen **rozcestník** "Services").
- "Jak pracujeme" — proces, technologie, principy.
- "O nás" — mise, hodnoty, tým.
- Blog post template (Stitch má jen index).
- AI Readiness Assessment formulář (multi-step).
- 3 právní stránky (souk, zpracovatele, cookies).
- 404.

**Existující assets v repo:**
- `logo-q-mark.svg` (200×200, kruh #1A1A1A s amber notch #D97706, kompatibilní s plan §1.1).
- `soukromi.html`, `zpracovatele.html`, `cookies.html` z původního webu — copy je již vyčištěné na *WellBe s.r.o., IČ: 05830931, Nové sady 988/2, 602 00 Brno* (viz origin §0).
- `tym.html` — starý team page se zastaralými tituly ("ninja", "guru"), jen jako reference, kompletně přepsat.

---

## 1. Validace služeb pro web

Origin §5 definuje 4 služby s jasným modelem a price-bandem. Validace pro
web řeší tři otázky: *(a)* mapuje každá služba na ICP pain point a má jasný
"pro koho"? *(b)* je price-band na webu transparentní bez prozrazení
vyjednávání? *(c)* nejsou služby překryté nebo příliš hluboké pro
vstupní stránku?

### 1.1 Pain → service map (validace pokrytí)

| Pain point z origin §3.6 | Primární služba | Sekundární | Web stránka entry |
|---|---|---|---|
| *"Slyšeli jsme o AI, ale nevíme kde začít"* | 5.1 Analýza a strategie | 5.3 školení (workshop pro management) | `/sluzby/analyza-a-strategie` |
| *"Bojíme se, že AI nahradí lidi"* | 5.3 (Nejen) AI školení | 5.1 Analýza | `/sluzby/skoleni` |
| *"Nemáme interní AI experty"* | 5.3 (Nejen) AI školení | 5.4 Implementace (mentoring) | `/sluzby/skoleni` + `/sluzby/implementace-a-vyvoj` |
| *"Měli jsme špatnou zkušenost s IT projekty"* | 5.1 Analýza (discovery 2 týdny fixní cena) | — | `/sluzby/analyza-a-strategie` (sekce *"Jak snižujeme riziko"*) |
| *"Nevíme jak bezpečně integrovat AI"* | 5.4 Implementace a vývoj | 5.2 Automatizace (n8n self-hosted) | `/sluzby/implementace-a-vyvoj` |
| *"GDPR a bezpečnost firemních dat"* | 5.4 Implementace (on-premise, Ollama) | 5.2 Automatizace (n8n self-hosted) | `/sluzby/implementace-a-vyvoj` + `/jak-pracujeme` |
| *"Naše data nejsou v pořádku"* | 5.1 Analýza (data readiness assessment) | — | `/sluzby/analyza-a-strategie` (samostatná podsekce) |
| *"Manuální administrativa na výrobě"* | 5.2 Automatizace procesů | 5.4 Implementace | `/sluzby/automatizace-procesu` |

**Validační závěry:**

✓ **Pokrytí je úplné.** Všech 8 pain points z §3.6 mapuje na alespoň jednu službu, většina na dvě → na webu se služby logicky doplňují.

⚠ **Riziko: 5.3 "(Nejen) AI školení" je široký bucket.** Origin §5.3 ho dělí na 4 podformy (workshop pro management / hands-on kurz / mentoring IT / partnerství IT retainer). Ty jsou tak různé, že detail page potřebuje jasnou navigaci `Anchor = "Pro management" | "Pro pracovníky" | "Pro IT" | "Dlouhodobá spolupráce"`. Bez toho hrozí, že CEO uvidí "školení" a nechá ho nepřečtené, protože *"školení = pro juniory"*.

⚠ **Riziko: Agentic OS pozice.** Origin §5.4 a §9 chce Agentic OS jako *flagship demo uvnitř služby 5.4*, ne jako samostatný produkt. Web musí explicitně říct: *"Agentic OS není SaaS, který si koupíte. Je to ukázka toho, jak děláme implementaci"* — jinak hrozí, že někdo přijde s otázkou *"Kolik stojí licence?"* (přesně to, co origin §9.4 zakazuje).

⚠ **Riziko: pricing transparency.** Origin §6.2 dává jasný range (Discovery €3–4.5k, Pilot €6–15k, Retainer €600–1200/měs). Web by měl tento range publikovat — odlišuje nás od velkých konzultantek (§4.2) a šetří prodejní hovory s lidmi mimo budget. **Doporučení:** každá služba uvádí *"Orientačně od X €"* + *"Do první 45min konzultace dostanete konkrétní fixní cenu"*.

✓ **Discovery jako entry point je správný funnel.** Plán §5.5 to potvrzuje: typický klient začíná u 5.1 a odtud se rozvětvuje. Web tomu odpovídá: hlavní sluzby rozcestník zvýrazňuje 5.1 jako *"obvyklý první krok"*.

### 1.2 Co dát na vstupní service rozcestník (`/sluzby`)

4 karty, každá se stejnou strukturou:

```
[Ikona/diagram] [Název služby]
[1 věta — co reálně děláme]
[Pro koho je to (1–2 typické situace)]
[Typický výstup / výsledek v Kč nebo %]
[Cena: "Od X €" + odkaz "více"]
[CTA: "Bezplatná konzultace o této službě"]
```

Pořadí karet na rozcestníku: **5.1 → 5.2 → 5.3 → 5.4** (zachováno z origin
§5, ne podle pravděpodobnosti prodeje). Důvod: čtenář prochází *od strategie
k implementaci* — přirozený mental model.

### 1.3 Co je na detail stránce každé služby (jednotná šablona)

Inspirace z origin §11.3, ale rozšířená o validační závěry výše:

1. **Hero:** název služby + 1 odstavec (kdo / co / pro jaký pain).
2. **Pro koho je tato služba** (3 typické situace s konkrétními větami CEO/COO).
3. **Co konkrétně děláme** (typický rozsah, technologie, výstup).
4. **Jak spolupracujeme** (process v 4 krocích: kickoff → discovery → delivery → handover).
5. **Typické výsledky** (úspora času v %, ROI, doba první value).
6. **Orientační cena a model** (fixní cena za pilot / měsíční retainer / *"do první konzultace dostanete konkrétní fixní cenu"*).
7. **FAQ** (3–5 otázek z reálných sales hovorů — naplníme za pochodu).
8. **Co neděláme** (link na origin §5.6 *"explicit non-goals"* — buduje důvěru).
9. **CTA:** primární *"Bezplatná konzultace"* + sekundární *"Stáhnout AI Readiness Assessment"*.

Pro službu 5.3 (Školení) ještě navrch **anchor menu na 4 podformy**, viz validace 1.1.

Pro službu 5.4 (Implementace) **samostatný blok "Agentic OS jako ukázka"** s explicitní disambiguací: *"Není to SaaS produkt. Je to demonstrace, jak přemýšlíme o implementaci."*

### 1.4 Datová připravenost — kde žije na webu

Origin §5 explicitně NEdává datovou připravenost jako samostatnou službu
(je součást Analýzy 5.1). Ale §3.6 pain *"naše data nejsou v pořádku"* a §2.1
číslo *"56 % firem má datovou připravenost jako blokátor"* jsou silné SEO
i sales hooky.

**Řešení:** na `/sluzby/analyza-a-strategie` sekce s vlastním H2 *"Datová
připravenost (Data Readiness Assessment)"* + odkaz na blog článek
*"5 kroků k datové připravenosti pro AI"* (origin §11.3 plánovaný blog #7) +
samostatná landing page **NE** (kanibalizovala by Analýzu).

---

## 2. Site architecture (kompletní URL strom)

```
/                              → Domů (hero, services teaser, agentic OS, kontakt CTA)
/sluzby                        → Rozcestník 4 služeb
/sluzby/analyza-a-strategie    → Detail služby 5.1 (vč. data readiness sekce)
/sluzby/automatizace-procesu   → Detail služby 5.2
/sluzby/skoleni                → Detail služby 5.3 (s anchor navigací na 4 podformy)
/sluzby/implementace-a-vyvoj   → Detail služby 5.4 (vč. Agentic OS bloku)
/jak-pracujeme                 → Proces, technologie, principy (5 pilířů z origin §4.1)
/o-nas                         → Mise, hodnoty, tým (5 lidí), Brno jako základna
/blog                          → Blog index (paginace po 10)
/blog/[slug]                   → Blog post template
/ai-readiness                  → AI Readiness Assessment landing + multi-step formulář
/kontakt                       → Kontakt form + IČO/DIČ + adresa + map
/soukromi                      → Zásady ochrany osobních údajů (port z existující HTML)
/zpracovatele                  → Seznam zpracovatelů osobních údajů (port)
/cookies                       → Prohlášení o cookies (port)
/404                           → Not found (vlastní design, link na hlavní)
```

**Hlavní navigace** (origin §11.1, max 6 položek):

```
Domů | Služby ▾ | Jak pracujeme | Blog | O nás | Kontakt
                 [overlay menu se 4 službami — Stitch má hotový design]
```

Footer:

```
QuConsult.cz                  Služby                    Firma
[Logo + krátký popis]         Analýza a strategie       O nás
                              Automatizace procesů       Jak pracujeme
[CTA: Bezplatná konzultace]   (Nejen) AI školení         Blog
                              Implementace a vývoj       Kontakt
[Newsletter signup            
 inline form, Substack]       Právní
                              Soukromí
[Sociální:                    Zpracovatelé
 LinkedIn, YouTube,            Cookies
 GitHub Martin, Substack]     
                              ─────────────────────────────
                              WellBe s.r.o. · IČ 05830931
                              Nové sady 988/2, 602 00 Brno
                              © 2026 QuConsult
```

**Mapování na Stitch — vítězní kandidáti** (po dvoukolovém Stitch generování + walkthroughu 2026-05-02/03):

| URL | Vítězný Stitch ID | HTML reference | Hlavní fixes (z `decisions.md`) |
|---|---|---|---|
| `/` | `7fef5f99…` | `01-landing-A-praktickeAI-7fef5f99.html` | Tým → Agentic OS proof block; přidat e-mail-only CTA → `/kontakt?email=…` |
| `/sluzby` | `54de8329…` | `02-sluzby-A-czech-54de8329.html` | Doplnit per-card meta (Pro koho, výsledek, *"Od X €"*) |
| `/sluzby/[slug]` × 4 | `920634b5…` (AI Analýza šablona) | `03-service-detail-A-larger-920634b5.html` + B reference `03-service-detail-B-smaller-2e720bb7.html` | Převzít z B 3-card layout pro *"Pro koho"* sekci |
| `/jak-pracujeme` | `ea7e7448…` | `04-jak-pracujeme-A-larger-ea7e7448.html` | Stock laptop screenshot → ručně-kreslený Excalidraw diagram cyklu |
| `/o-nas` | `2c98497d…` | `05-o-nas-A-larger-2c98497d.html` + B reference `05-o-nas-B-smaller-72f6ae08.html` | Mix s B: tým layout, *"Stavíme na regionech"*, CTA *"bez zbytečného šumu"*, světlý peachy citát |
| `/blog` | `a89dc6e7…` | `06-blog-B-refresh-a89dc6e7.html` + A reference `06-blog-A-czech-79520203.html` | Newsletter signup z A; oprav background color; filtrační chips nahoru; obsahově pokrýt všechna témata z plan.md §11.3 |
| `/blog/[slug]` | `fc2470e6…` | `07-article-B-smaller-fc2470e6.html` + A reference `07-article-A-larger-aa4e3ae2.html` | Převzít z A amber mid-page CTA box |
| `/ai-readiness` | `c5274781…` | `08-ai-readiness-B-smaller-c5274781.html` + A reference `08-ai-readiness-A-larger-c6096499.html` | Brand fix (Boutique.AI → QuConsult); post-submit z A |
| `/kontakt` | `ace45cef…` | `09-kontakt-A-czech-ace45cef.html` | *"QuConsult Logo"* placeholder → reálné Q-mark; oprav překlep ve footeru; URL param prefill |
| `/soukromi` `/zpracovatele` `/cookies` | `e9e8c2fd…` | `10-legal-A-larger-e9e8c2fd.html` + B reference `10-legal-B-smaller-5cb06f82.html` | Odstranit amber CTA z headeru; převzít z B peachy hero quote box |
| `/404` | `e9edc6a7…` | `11-404-A-e9edc6a7.html` + B reference `11-404-B-d2541bbb.html` | Serif "Q." → skutečné Q-mark logo z B; oprav footer (WellBe s.r.o., 2026, CZ) |
| Komponenta: Services Menu Overlay | `56921d01…` | `12-menu-A-czech-56921d01.html` | Doplnit nav na 6 položek; broken image → reálné Q-mark logo |

**Universal brand lockdown** (aplikováno univerzálně přes `BaseLayout.astro` / `Header.astro` / `Footer.astro`):
- Header: 6 nav položek *"Domů | Služby ▾ | Jak pracujeme | Blog | O nás | Kontakt"*; logo Q-mark + text *"QuConsult"* (camelCase, jedno slovo); CTA *"Domluvit konzultaci"* (CZ).
- Footer: 4 sloupce + řádek *"WellBe s.r.o. · IČ 05830931 · Nové sady 988/2, 602 00 Brno · © 2026 QuConsult"*; sociální ikony LinkedIn, YouTube, GitHub, Substack; právní odkazy.
- ŽÁDNÉ aliasy: *StrategicCraft*, *Boutique.AI*, *Andersjord Consulting*, *WellBe* jako brand name (pouze WellBe ve footeru jako právní entita).
- Vše v češtině. Žádný EN nav/CTA.

**Stitch HTML jako reference** (ne 1:1 implementace): využíváme Tailwind utility classes ze Stitche pro přesný spacing/colors mapping na Tailwind 4 design tokens. **Stitch HTML NENÍ produkční kód** — Astro projekt staví vlastní komponenty s responsivním designem, motion (§4.7), accessibility, content collections.

**Plný walkthrough log:** [`docs/stitch-candidates/decisions.md`](../stitch-candidates/decisions.md) — per-stránka detail, "co je dobré", "fix list".

---

## 3. Page-by-page content blueprint

Pro každou stránku zafixujeme **strukturu sekcí, klíčové copy mantle, primární CTA a SEO meta**. Finální copy se píše ve fázi implementace.

### 3.1 `/` — Domů

**Cíl stránky:** za 10 sekund odpovědět *"co děláte / pro koho / proč máme zavolat"*.

**Sekce (top → bottom):**

1. **Hero** — H1 *"Proměňte AI z buzzwordu ve váš největší konkurenční nástroj"* (origin §11.2). Subtitle z §11.2. Primární CTA *"Domluvit bezplatnou konzultaci"*, sekundární *"Podívat se, jak řídíme vlastní firmu"*.

   *Motion: hero H1 → subtitle → CTA stagger 80 ms; sekce 2–9 reveal-on-scroll dle §4.7.*
2. **3 stručné value-prop bloky** (z origin §4.1, vybrat 3 nejsilnější — *"Inside-out, ne outside-in"* / *"Žádný vendor lock-in"* / *"Používáme to, co prodáváme"*).
3. **Co děláme — 4 služby teaser** (4 krátké karty, link na detail).
4. **Sociální důkaz / čísla** (z origin §2.1: *"48 % českých firem už AI používá. 56 % má jako blokátor data. My pomáháme s obojím."*).
5. **Pro koho jsme** (mid-market 50–300 výroba + profi služby 5–30; *NE* korporace, *NE* firmy < 30 lidí — origin §3.8).
6. **Agentic OS proof** (sekce *"Jak řídíme vlastní firmu"* — link na YouTube + krátké demo video / screenshot).
7. **Tým preview** (3–5 fotek + jména + role, link na O nás).
8. **Blog teaser** (3 nejnovější články, jakmile budou).
9. **Final CTA blok** s formulářem *"Domluvit konzultaci"* nebo odkaz na `/kontakt`.

**SEO:** `<title>` *"QuConsult — AI konzultace pro české firmy"* (origin §12.1 *"AI konzultace"* primární keyword). Meta description z hero subtitle.

**Acceptance:** stránka se vejde do 1× scroll na 1080p desktopu pro hero+první value blok; LCP < 2.5 s; čte se i bez JS.

### 3.2 `/sluzby` — Rozcestník

**Cíl:** během 30 s návštěvník pozná, která ze 4 služeb je pro něj.

**Sekce:**

1. **H1** *"Co pro vás děláme"* + 1 odstavec o tom, jak se služby skládají (origin §5.5).
2. **4 service karty** (struktura z 1.2 výše).
3. **Sekce *"Jak začít"*** s flowchartem: *Bezplatná konzultace → Discovery (2 týdny, fixní cena) → Pilot nebo retainer*.
4. **Sekce *"Co neděláme"*** (krátký list z origin §5.6, buduje důvěru).
5. **CTA** + odkaz na `/jak-pracujeme` pro detail procesu.

**SEO:** `<title>` *"Služby — QuConsult"*; long-tail klíčová slova z §12.

### 3.3 `/sluzby/analyza-a-strategie`

**Cíl:** primární vstupní stránka funnelu (§5.5). Návštěvník odsud má pochopit, **proč začít zde**.

**Sekce dle šablony 1.3** + tato specifika:

- **Sekce *"Datová připravenost"*** (samostatný H2, viz validace 1.4).
- **Sekce *"Co je AI Readiness Assessment"*** s embedded CTA na `/ai-readiness`.
- **Příklad výstupu:** vzorový roadmap dokument — buď anonymizovaný PDF placeholder, nebo screenshot fiktivního Discovery dokumentu (po první case study nahradit reálným).
- **Cena:** *"Discovery 2 týdny od 75 000 Kč (3 000 €)"* + advisory retainer *"od 15 000 Kč/měs (600 €)"*.

**SEO klíčová slova:** *AI audit*, *AI strategie pro firmy*, *AI poradenství*, *datová připravenost pro AI* (origin §12.1, §12.2).

### 3.4 `/sluzby/automatizace-procesu`

**Cíl:** stránka pro pain *"manuální administrativa na výrobě"* — typicky CEO výrobní firmy, který už ví, že chce automatizovat.

**Sekce dle šablony 1.3** + specifika:

- **Sekce *"Typické příklady automatizace"*** se 4–6 reálnými use-casy z origin §3.4 (zákaznické objednávky → ERP, reklamace, měsíční reporty, nabídky, dodavatelská korespondence, kvalitní dokumentace).
- **Sekce *"Naše technologie"*** (n8n self-hosted = preferovaná, CrewAI multi-agent, integrace Pohoda XML import / Helios / SAP B1 — origin §13).
- **Sekce *"Bezpečnost a GDPR"*** (self-hosted, vlastní infrastruktura, žádný cloud lock-in).
- **Cena:** *"Pilotní implementace 4–8 týdnů, fixní cena od 150 000 Kč (6 000 €)"*.

**SEO:** *automatizace procesů AI*, *automatizace procesů ve výrobě*, *AI a Pohoda*, *integrace Helios s AI*.

### 3.5 `/sluzby/skoleni`

**Cíl:** stránka pro pain *"nemáme interní AI experty"* a *"bojíme se, že AI nahradí lidi"*. **Klíčová pro change management positioning.**

**Sekce dle šablony 1.3** + specifika z validace 1.1:

- **Anchor menu nahoře:** *"Pro management"* | *"Pro pracovníky"* | *"Pro IT tým"* | *"Dlouhodobé partnerství"* (4 podformy z origin §5.3).
- **Každá podforma vlastní sekce** (~3 odstavce + cena/model).
- **Pro pracovníky:** explicitně zmínit *"GDPR-konformní šablony pro obchod, administrativu, marketing, právníky, účetní"* (origin §5.3).
- **Pro IT:** mentoring + code review + *"za 6–12 měsíců provozujete sami"* (origin §5.3).
- **Cena:** workshop half-day od X €, kurz full-day od Y €, mentoring retainer od €600/měs.

**SEO:** *AI školení Brno*, *AI workshop pro management*, *GDPR a AI v ČR* (z plánovaných blog článků §11.3).

### 3.6 `/sluzby/implementace-a-vyvoj`

**Cíl:** technická stránka pro CTO/IT manažera. Hloubka, nikoli marketing.

**Sekce dle šablony 1.3** + specifika:

- **Sekce *"Agentic OS jako ukázka, ne produkt"*** (samostatný H2, explicitní disambiguace per validace 1.1) + krátké video / screenshot demo + odkaz na YouTube epizodu B7.
- **Sekce *"Typické výstupy"*** (chatboty nad firemními dokumenty, AI integrace do existujících aplikací, on-premise deploy s Ollama, dokumentové RAG pipelines, analytické dashboardy).
- **Sekce *"Vendor lock-in? Nikdy"*** — explicitní seznam toho, co předáváme: zdrojové kódy, dokumentace, smluvní garance (origin §4.1 pillar 3).
- **Sekce *"Náš stack"*** (origin §13: Alpine VPS, Authelia, Paperclip, Claude Code, n8n, Ollama, vlastní CEL VM).
- **Cena:** *"Pilotní implementace fixní cena od 150 000 Kč. Agentic OS implementace + retainer od 375 000 Kč. Nikdy SaaS licence."*

**SEO:** *AI implementace*, *chatbot pro firmy*, *AI vývoj na míru*, *on-premise AI*.

### 3.7 `/jak-pracujeme`

**Cíl:** *"OK, beru, ale jak to konkrétně probíhá?"* — odpověď ve 3 minutách.

**Sekce:**

1. **Proces v 5 krocích** (Discovery → Návrh → Pilot → Škálování → Provoz) — 1 odstavec na krok + jednoduchý ručně-kreslený diagram (§8 — Excalidraw style, origin pravidlo).
2. **5 pilířů jak pracujeme** (z origin §4.1, plný výpis s rozšířením).
3. **Naše technologie** (origin §13, krátký list bez marketingu).
4. **Cyklus 2 týdnů** — vysvětlení agile-style iterací (origin §4.1 pillar 4).
5. **Co předáváme** (zdrojové kódy, dokumentace, smluvní garance — origin §4.1 pillar 3).
6. **CTA**.

**SEO:** *jak zavést AI ve firmě*, *AI implementace proces*.

### 3.8 `/o-nas`

**Cíl:** lidskost a důvěra. Origin §3.5 píše: *"Rozhoduje se na základě důvěry v osobu, ne v brand."*

**Sekce:**

1. **Mise** (origin §1.2 — krátký, výrazný odstavec).
2. **5 hodnot** (praktičnost / partnerství / transparentnost / odbornost / česká identita — origin §1.6).
3. **Tým — 5 fotek + bio** (origin §1.8, plus Martinovo krédo doslovně z §1.8).
4. **Brno + ČR mimo Prahu** (origin §1.7 — kde působíme).
5. **Proč Česko** (krátký odstavec — rozumíme regulacím, ERP systémům, kultuře, origin §4.1 pillar 5 *"Česká identita"*).
6. **Právní entita transparentně** (WellBe s.r.o., IČ, sídlo).
7. **CTA**.

**Důležité:** týmové fotky musí být *"autentické, v přirozeném světle, žádné korporátní naaranžování"* (origin §8.4 a `DESIGN_BRIEF.md`). Pokud nejsou hotové, fáze 0 zahrnuje **focení týmu**.

### 3.9 `/blog`

**Cíl:** SEO + důkaz hloubky. **V den launchu může mít 1 článek** (origin §14.1 *"žádné placeholder coming soon"*).

**Sekce:**

1. **H1** *"Praktické AI insights pro české firmy"*.
2. **Filter / kategorie** (Strategie, Implementace, Case studies, How-to). Pro launch: jen "Vše".
3. **Article cards grid** (paginace po 10).
4. **Newsletter signup blok** (Substack embed nebo vlastní).
5. **CTA na konzultaci**.

**Initial článek pro launch:** *"5 procesů, které může každá česká firma automatizovat hned"* (origin §11.3 první v listu) — Martin napíše, ~1500 slov, MDX s embedded diagramem.

### 3.10 `/blog/[slug]` — Post template

**Sekce:**

1. **Frontmatter rendered:** title, datum, autor (foto + jméno), reading time, tagy.
2. **Lead** (1 odstavec H2-velikosti pro shrnutí).
3. **TOC** (auto-generated z H2/H3 pro články > 1500 slov).
4. **Body** — MDX, plně využití typografie (Noto Serif H2/H3, Inter body).
5. **Author bio box** na konci.
6. **Related posts** (3 podle tagů).
7. **CTA box** (kontextuální — pokud je článek o automatizaci → CTA na `/sluzby/automatizace-procesu`, jinak generic).
8. **Newsletter signup**.

**Důležité:** Schema.org `Article` + `BreadcrumbList` + OG image (auto-generated z title + Q-mark, Astro plugin).

### 3.11 `/ai-readiness` — Lead magnet

**Cíl:** §11.5 — gated multi-step dotazník, výstup je krátký PDF + e-mail s pozvánkou na konzultaci.

**Struktura (multi-step form, no full page reload):**

1. **Hero:** *"Zjistěte AI zralost vaší firmy za 10 minut"* + *"Žádné prodejní volání. Jen praktická zpráva."*
2. **Step 1:** O firmě (velikost, obor, ERP).
3. **Step 2:** Datová připravenost (kde data jsou, sjednocenost, kvalita).
4. **Step 3:** Lidé a procesy (kdo by AI vedl, ochota týmu, change capacity).
5. **Step 4:** Cíle (úspora času / nové produkty / kvalita / zákazník).
6. **Step 5:** Kontakt + e-mail (pro doručení reportu).
7. **Submit → Vercel function** vygeneruje krátký PDF (TBD: serverless PDF gen — Resend dokumenty / Puppeteer worker / pre-rendered template + replace) + pošle na e-mail + upoutávka na 45min konzultaci.

**Logika scoringu:** zjednodušený model 0–100, breakdown na 4 dimenze (data / lidé / procesy / cíle). Otázky a scoring pravidla = mini-projekt mimo tento plán; pro fázi launch stačí **placeholder formulář + e-mail s textovou shrnutím**, PDF v fázi 4.

### 3.12 `/kontakt`

**Sekce:**

1. **H1** *"Domluvme si 45minutovou bezplatnou konzultaci"* (origin §11.3).
2. **Krátký copy** *"Identifikujeme TOP 3 příležitosti pro AI ve vaší firmě — bez závazku, bez prodejního tlaku"* (origin §11.3).
3. **Form:** jméno, firma, pozice, e-mail, telefon (volitelný), *"Co nejraději řešíte?"* textarea, GDPR souhlas checkbox.
4. **Form submit → Vercel function** (viz §4 Technická architektura).
5. **Side panel:** přímý kontakt (e-mail, telefon, LinkedIn), adresa firmy, mapa (Brno).
6. **Alternativa: rovnou si vyberte termín** — Cal.com / Calendly embed (cíl: postupně přesunout kontakt na booking, méně friction než form).

### 3.13 Právní stránky (`/soukromi`, `/zpracovatele`, `/cookies`)

Port existujícího HTML obsahu do jednotného Astro layoutu `LegalLayout.astro` s úzkým content column, žádné CTA, jen čistá typografie. **Validovat IČO/adresu** že odpovídá originu §0 (WellBe s.r.o., IČ 05830931, Nové sady 988/2, 602 00 Brno).

### 3.14 `/404`

Krátký H1 *"Tady to není"*, drobný humor v tónu §7 (žádné anglicismy), Q-mark velký, link zpět na `/` a na `/kontakt`. Bez korporátního *"Stránka nebyla nalezena"*.

---

## 4. Technická architektura

### 4.1 Stack

- **Framework:** Astro 5+ (poslední stabilní 2026, content collections, view transitions, MDX integration). Důvod volby: static-first SSG s ostrovní hydratací, nejlepší LCP/CLS metriky pro typografický web; vendor-lock-in minimální (port na cokoli později).
- **Styling:** Tailwind CSS 4 (v4 má native `@theme` directive a OKLCH). Důvod: design system má jasné tokeny v `DESIGN_BRIEF.md`/Stitch, Tailwind je nejjednodušší způsob jejich kodifikace bez build overhead. Alternativa: vanilla CSS s `@layer` — odmítnuto, protože časem narůstá údržba design tokenů.
- **Motion:** Astro View Transitions (built-in) + pure CSS + `IntersectionObserver` (žádná animation library — viz §4.7).
- **TypeScript:** strict mode, content collection schémata via Zod.
- **Content:** Markdown + MDX pro blog, frontmatter validovaný Zod schémou.
- **Forms backend:** Vercel serverless functions (Node.js Runtime, ne Edge — Edge nepodporuje `nodemailer`) — repo subfolder `vercel-api/`.
- **E-mail relay:** Vlastní SMTP přes `nodemailer` (klient má vlastní SMTP server, DKIM/SPF/DMARC řešeno přes provider).
- **Anti-spam:** Google reCAPTCHA v3 (lazy-loaded na form submit). Cookies klasifikovány jako **essential** (bez nich nelze formuláře submitovat) — jednorázový cookie banner s informativním souhlasem (žádné odmítnutí).
- **Analytics:** Plausible (self-hosted nebo cloud, GDPR-friendly, žádné cookies, žádný banner) — alternativa GA4 odmítnuta (cookies, banner, brand inkonzistence).
- **Search (později):** Pagefind — static search index, klient-side, žádný server.
- **Deploy:** GitHub Actions → GitHub Pages (`gh-pages` branch nebo Pages from Actions).
- **DNS:** Cloudflare DNS (free), CNAME `quconsult.cz` → `<github-username>.github.io`. Výhoda: CF poskytne SSL bez nutnosti GH Pages cert dance + edge caching navíc.

### 4.2 Repo struktura

```
quconsult-web/                  (existing repo: github.com/marvec/quconsult, branch master)
├── .github/
│   └── workflows/
│       └── deploy-pages.yml    (build Astro + deploy to GH Pages)
├── public/
│   ├── CNAME                   (existing, www.quconsult.cz)
│   ├── favicon.svg             (Q-mark)
│   ├── og-default.png
│   ├── robots.txt
│   └── images/
│       ├── team/               (autentické fotky 5 lidí — TBD)
│       └── diagrams/           (Excalidraw exports SVG)
├── src/
│   ├── content.config.ts       (Zod schémata pro blog, sluzby, tym)
│   ├── content/
│   │   ├── blog/
│   │   ├── sluzby/             (4 entries)
│   │   └── tym/                (5 entries)
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── LegalLayout.astro
│   │   └── BlogPostLayout.astro
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ServicesMenuOverlay.astro
│   │   ├── CookieBanner.astro
│   │   ├── ContactForm.astro
│   │   ├── AIReadinessForm.astro
│   │   └── ...
│   ├── pages/
│   │   ├── index.astro
│   │   ├── sluzby/
│   │   ├── jak-pracujeme.astro
│   │   ├── o-nas.astro
│   │   ├── blog/
│   │   ├── ai-readiness.astro
│   │   ├── kontakt.astro
│   │   ├── soukromi.astro
│   │   ├── zpracovatele.astro
│   │   ├── cookies.astro
│   │   └── 404.astro
│   ├── styles/
│   │   └── global.css          (Tailwind 4 @theme s design tokens)
│   └── lib/
│       └── recaptcha.ts        (lazy-load helper)
├── vercel-api/                 (Vercel deploy ROOT — separate)
│   ├── package.json            (nodemailer, zod, types)
│   ├── tsconfig.json
│   ├── vercel.json             (framework: null)
│   └── api/
│       ├── contact.ts          (POST /api/contact: reCAPTCHA verify → SMTP)
│       └── ai-readiness.ts     (POST /api/ai-readiness)
├── astro.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json                (Astro deps)
├── README.md                   (existing, update)
├── LICENSE.txt                 (existing, preserved)
├── CLAUDE.md
├── DESIGN_BRIEF.md             (zkopírovaný z parent rewamp/)
├── plan.md                     (zkopírovaný z parent rewamp/, **read-only origin**)
└── .gitignore
```

K odstranění z master při scaffoldingu (po commitu): index.html, tym.html, soukromi.html, zpracovatele.html, cookies.html, krize.html, firma.html, vedouci.html, zamestnanec.html, zakaznik.html, poslani.html, pribehy.html, generic.html, elements.html, assets/ (Phantom CSS/JS), images/team-*.jpg (do public/images/team/ jako fallback), images/* (rest).

### 4.3 Deploy pipeline

**Web (Astro → GH Pages):**

```yaml
# .github/workflows/deploy.yml
on:
  push: { branches: [master] }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

**Forms backend (Vercel functions):**

- **Vercel projekt:** import `marvec/quconsult` z GitHubu.
- **Project Settings:**
  - **Framework Preset:** Other (NE Astro!)
  - **Root Directory:** `vercel-api`
  - **Build Command:** (default, prázdné)
  - **Output Directory:** (default, prázdné)
  - **Install Command:** default `npm install`
  - **Node.js Version:** 22.x (latest LTS)
- **Custom doména:** `api.quconsult.cz` přidat v Vercel Domains; CNAME → `cname.vercel-dns.com.`
- **Env vars (Production scope):** `RECAPTCHA_SECRET_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (Sensitive), `SMTP_FROM`, `NOTIFICATION_EMAIL`, `ALLOWED_ORIGIN` (CSV: `https://quconsult.cz,https://www.quconsult.cz`).
- **Astro klient volá** `${import.meta.env.PUBLIC_API_BASE_URL}/api/contact` — initial value `https://quconsult-api.vercel.app`, později swap na `https://api.quconsult.cz`.
- **CORS whitelist:** funkce checkují `Origin` proti `ALLOWED_ORIGIN`.

### 4.4 DNS plán

```
# Apex (GitHub Pages — already in place)
quconsult.cz       A     185.199.108.153
quconsult.cz       A     185.199.109.153
quconsult.cz       A     185.199.110.153
quconsult.cz       A     185.199.111.153
quconsult.cz       AAAA  2606:50c0:8000::153
quconsult.cz       AAAA  2606:50c0:8001::153
quconsult.cz       AAAA  2606:50c0:8002::153
quconsult.cz       AAAA  2606:50c0:8003::153

# www → marvec.github.io
www.quconsult.cz   CNAME marvec.github.io.

# API subdomain (later, after Vercel domain setup)
api.quconsult.cz   CNAME cname.vercel-dns.com.

# E-mail (handled by user — DKIM/SPF/DMARC pro vlastní SMTP)
@                  MX    [user's mail provider]
@                  TXT   "v=spf1 ..."
[selector]._domainkey  TXT  "v=DKIM1; ..."
_dmarc             TXT   "v=DMARC1; p=quarantine; ..."
```

### 4.5 Performance & SEO baseline

Acceptance pro každou stránku:

- **LCP < 2.5 s** na 4G simulaci (Lighthouse mobilní).
- **CLS < 0.05**.
- **No render-blocking JS** v hero sekci.
- **HTML-first:** stránka funguje s `JS off` (kromě formulářů, které degradují na `mailto:` link).
- **Schema.org:** `Organization` v root layout, `BreadcrumbList` na sub-pages, `Article` v blogu, `Service` na detail služeb, `FAQPage` kde jsou FAQ.
- **Cookies & consent:** Plausible (no cookies). reCAPTCHA v3 (essential cookie `_GRECAPTCHA`) — jednorázový informativní cookie banner při první návštěvě, single "Rozumím" button (žádné odmítnutí — bez cookies nelze formuláře). reCAPTCHA lazy-loaded jen na form submit (defense in depth).
- **Sitemap.xml** auto-generovaný (Astro `@astrojs/sitemap`).
- **RSS feed** pro blog (`/rss.xml`).
- **OG image** per page (default je hero text + Q-mark, custom v blogu z title + autor).
- **Hreflang:** zatím jen `cs-CZ` (anglická verze podle origin §14.3 dlouhodobě).
- **GBP** verifikace (origin §12.4) — adresa a NAP konzistence napříč webem.

### 4.6 Měřitelné cíle launchu

- Lighthouse **performance > 95**, **accessibility > 95**, **best practices > 95**, **SEO 100** na 5 klíčových stránkách (`/`, `/sluzby/*` × 1, `/o-nas`, `/blog`, `/kontakt`).
- Plausible 50+ unique visitors / týden v prvním měsíci po veřejném launchi.
- Min. 1 přijatý lead z formuláře v prvním měsíci (úspěch validace funnelu).

### 4.7 Motion design

Motion je decentní, ne efektní. Reference: Linear.app, Stripe, Vercel — všechny mají vkusné entry animace, žádný parallax. `DESIGN_BRIEF.md` zakazuje *"animace pro efekt"* (showy/gimmicky), nikoli pohyb obecně.

**Co je IN (default behavior):**

- **Reveal-on-scroll** sekcí: fade z 0 → 1 + 8–12 px translateY, 250 ms, easing `cubic-bezier(0.2, 0.8, 0.2, 1)`. Stagger 40–60 ms mezi sourozenci v gridu/listu.
- **Hero entry** při loadu stránky: H1 → subtitle → CTA postupně, každý další +80 ms.
- **Number counters** (např. *"48 % českých firem"*) tickne z 0 → cílová hodnota za 800 ms, jakmile je ve viewportu.
- **Page transitions** mezi route changes: Astro View Transitions, cross-fade 200 ms na main content (header/footer persistent).
- **Hover micro-interactions:** barva/border shift (per Stitch design system) + max 1–2 px translateY na kartách. CTA šipka se posune o 4 px doprava při hoveru. Underline thicken na linkech.
- **Image lazy reveal:** fotky týmu fade-in 200 ms jakmile decoded, žádný flash bílé.

**Co je OUT (zákazy, ne možnost):**

- Žádný parallax při scrollu, žádný scroll-jacking.
- Žádný bouncy spring (`cubic-bezier` s overshootem nad 1.0). Vždy ease-out charakter.
- Žádné nekonečné loopy (rotující ikony, pulsující CTA, blikající dots).
- Žádný autoplay hero video, motion blur, glow efekty.
- Žádný cursor-follow, magnetic buttons, kinetic typography.
- Žádné AI klišé motion (neural-network particle systems, sci-fi grid pulsing).

**Implementace:**

- **Žádná animation library.** Bez Framer Motion, GSAP, Lottie, AOS. Pure CSS + `IntersectionObserver` (~10 LOC vanilla JS shared util) + Astro built-in View Transitions.
- **Tailwind tokens** (do `tailwind.config.ts`):
  - `--ease-quc: cubic-bezier(0.2, 0.8, 0.2, 1)`
  - `--duration-fast: 200ms`, `--duration-base: 250ms`, `--duration-slow: 800ms`
  - `--stagger: 60ms`
- **`@starting-style`** kde podporováno (Chromium 117+, Safari 17.5+) pro CSS-native entry, fallback na `IntersectionObserver` toggling třídy `.is-visible`.
- **`prefers-reduced-motion`** plně respektovat: kompletní vypnutí všech entry/reveal animací (`@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`). Hover micro-interactions zůstávají (jsou nutné pro feedback).

**Acceptance:**

- Stránka s `prefers-reduced-motion: reduce` se chová jako statická (žádný layout shift z entry animací).
- Žádná animace nepřesáhne 800 ms (number counter strop).
- Lighthouse performance > 95 zůstává — motion nesmí přidat measurable JS bundle ani CLS.

---

## 5. CLAUDE.md scaffold

**Účel:** future Claude Code sessions na tomto webu musí mít okamžitě po
ruce: positioning, brand voice rules, file conventions, jak přidat
stránku/článek, NEVER pravidla. Bez toho hrozí, že Claude napíše buzzwordy
nebo poruší design tokens.

CLAUDE.md by měl obsahovat (struktura, ne plný text):

```markdown
# CLAUDE.md — QuConsult Web

## Co tento projekt je
Marketingový web QuConsultu (české AI konzultační firmy). Astro 5,
GH Pages, Vercel functions pro formuláře. Brand voice a strategie
v ./plan.md (zdroj pravdy, NEUPRAVOVAT — pochází z mateřského repo).

## Tech stack quick reference
- Astro 5 + Tailwind 4 + TypeScript strict
- pnpm, Node 22
- Content collections: blog, sluzby, tym (Zod schémata v src/content.config.ts)
- Forms: Vercel functions na api.quconsult.cz
- Deploy: push do main → GH Action → GH Pages

## NIKDY (hard rules)
- NIKDY nepoužívej anglicismy "transformation", "synergy", "leverage",
  "disruption", "state-of-the-art" — viz plan.md §7.3.
- NIKDY nepoužívej buzzwordy "AI-powered", "next-gen", "revolutionary".
- NIKDY nepoužívej stock photos, generic vector ilustrace, 3D rendery,
  AI klišé (neural networks, sci-fi). Viz DESIGN_BRIEF.md §"Co NEchceme".
- NIKDY nepoužívej čistou bílou (#FFFFFF) — vždy off-white #FAFAF8.
- NIKDY nepoužívej čistou černou (#000000) — vždy #1A1A1A.
- NIKDY nepoužívej amber #D97706 jako velkou plochu — max 5–10 %.
- NIKDY neslibuj specifické čísla bez zdroje.
- NIKDY nepřidávej "Coming soon" placeholder. Než se publikuje,
  raději stránku skryj.
- NIKDY nepiš v cizím jazyce na české stránce. EN přijde později.

## VŽDY (defaults)
- Vykání v B2B kontextu (web).
- Krátké věty, aktivní slovesa.
- Konkrétní čísla > abstraktní sliby.
- Diakritika otestována ve frázi "Příliš žluťoučký kůň úpěl ďábelské ódy".
- Schema.org markup u nového typu obsahu.
- Ostrovní hydratace minimalizovaná: `client:visible` jen kde je třeba.
- LCP < 2.5 s, CLS < 0.05.

## File conventions
- Stránky: src/pages/<route>.astro
- Komponenty: src/components/<PascalCase>.astro
- Content collections: src/content/<collection>/<slug>.md(x)
- Layouts: src/layouts/<PascalCase>Layout.astro
- Tailwind tokens: src/styles/global.css (jediné místo úpravy designu)

## Jak přidat nový blog článek
1. Vytvoř src/content/blog/<YYYY-MM-DD>-<slug>.mdx s frontmatter:
   title, description, pubDate, author (slug), tags[], heroImage?
2. Napiš v MDX, používej H2/H3, code bloky ano, embedded SVG ano.
3. Před commitem zkontroluj: čeština, žádné buzzwords, schema OK.
4. Commit + push → auto-deploy.

## Jak přidat novou službu (jen kdyby — origin §5 jich má 4 a do té
   doby, dokud se strategie nezmění, neměníme)
- Diskuze přes plan.md update PRVNÍ. Web je projev plánu, ne zdroj.

## Jak změnit copy stránky
- Najdi src/pages/<route>.astro NEBO src/content/sluzby/<slug>.md
- Copy je často v MD frontmatter — drž se schema (src/content.config.ts).
- Po změně: `pnpm dev` lokálně, klikni přes všechny CTA, pak commit.

## Origin documents (read-only z pohledu webu)
- ./plan.md — zdroj pravdy strategie
- ./DESIGN_BRIEF.md — zdroj pravdy vizuálu
- ./docs/plans/*.md — implementační plány

## Když si nejsi jistý
- ZKONTROLUJ plan.md (strategie) nebo DESIGN_BRIEF.md (vizuál).
- ZKONTROLUJ existující stránky pro precedent vzoru.
- ZEPTEJ se uživatele než smyslíš novou konvenci.
```

Velikost cíl: **150–250 řádků**. Větší = Claude si zapamatuje pravidla
hůř (důležité hard rules na začátku, ne na konci).

---

## 6. Implementační roadmap (fázovaný plán)

Plán nepředepisuje časy — Martin a Claude Code v fázových session.

### Fáze 0 — Setup (≤ 1 day)

- [ ] Naklonovat existující repo `https://github.com/marvec/quconsult.git`. Pracovat na branch `astro-rewrite` (oddělit od master, ať live web zůstane do merge nedotčený).
- [ ] Smazat staré Phantom HTML5 UP soubory na `astro-rewrite` (index.html, tym.html, sluzby HTML, atd.). **Zachovat:** `CNAME`, `LICENSE.txt`, `README.md` (update README copy).
- [ ] Inicializace Astro 5 v rootu (`pnpm create astro@latest .` s minimal template, TypeScript strict).
- [ ] Tailwind 4 integrace (`@astrojs/tailwind` + `tailwindcss@4`); design tokens v `src/styles/global.css` přes `@theme` directive z `DESIGN_BRIEF.md` (off-white #FAFAF8, ink #1A1A1A, amber #D97706, Noto Serif + Inter, motion tokens z §4.7).
- [ ] `BaseLayout.astro` + `Header.astro` (6 nav items) + `Footer.astro` (4 cols + WellBe IČ) + `CookieBanner.astro`.
- [ ] Vercel projekt založit na webu (import `marvec/quconsult`, Root Directory = `vercel-api`, Framework = Other). Env vars per §4.3.
- [ ] `vercel-api/` subfolder s `package.json` (nodemailer, zod), `vercel.json`, stub `api/contact.ts` a `api/ai-readiness.ts`.
- [ ] GH Actions workflow `.github/workflows/deploy-pages.yml` (Pages from Actions, branch `master`, deploy from `dist/`).
- [ ] CLAUDE.md napsán dle §5 (~200 řádků, hard rules pro brand voice + design + file conventions).
- [ ] `astro.config.mjs` se sitemap, MDX, view transitions integracemi.
- [ ] `pnpm install && pnpm build` lokálně OK.
- [ ] Push branch `astro-rewrite`. **Neslučovat do master**, dokud Martin neschválí — old web zůstává live.

**Acceptance:** push do `astro-rewrite` → branch existuje na origin, lokální build prochází, žádné errors. Old `quconsult.cz` se nezměnilo.

### Fáze 1 — Layout & komponenty (≤ 2 days)

- [ ] `BaseLayout.astro` s head, header, footer dle §2 site arch.
- [ ] Header s nav + Stitch *Services Menu Overlay* implementovaný.
- [ ] Footer dle §2.
- [ ] 5 sdílených komponent (Hero, ServiceCard, ValueProp, TeamMember, CTASection).
- [ ] Globální typografie (Noto Serif, Inter z self-hosted fonts), responsive scale.
- [ ] Q-mark favicon set + OG default.

**Acceptance:** otevřít prázdnou stránku → vidím správný header, footer, fonty, fungující nav dropdown.

### Fáze 2 — Content collections & schémata (≤ 1 day)

- [ ] `src/content.config.ts` s Zod schématy pro `blog`, `sluzby`, `tym`.
- [ ] 5 entries v `src/content/tym/` (každý člen, foto path, role, krátký bio).
- [ ] 4 entries v `src/content/sluzby/` s frontmatter pro hero copy, sekce, FAQ, ceny.
- [ ] 1 článek v `src/content/blog/` (Martin napíše paralelně).

**Acceptance:** `pnpm build` projde se Zod validací, žádné typy errors.

### Fáze 3 — Stránky (≤ 5 days, paralelizovatelné)

Po jednotlivých stránkách, každá vlastní commit/branch:

- [ ] `/` — homepage dle §3.1.
- [ ] `/sluzby` — rozcestník dle §3.2.
- [ ] `/sluzby/[slug]` — 4 detail pages dle §3.3–§3.6.
- [ ] `/jak-pracujeme` dle §3.7.
- [ ] `/o-nas` dle §3.8.
- [ ] `/blog` + `/blog/[slug]` dle §3.9–§3.10.
- [ ] `/kontakt` dle §3.12 (form bez backendu zatím — submit do `mailto:`).
- [ ] `/soukromi`, `/zpracovatele`, `/cookies` — port HTML do LegalLayout.
- [ ] `/404`.

**Acceptance:** všechny URL z §2 vrací 200, lighthouse > 95 na 5 klíčových.

### Fáze 4 — Forms backend (≤ 2 days)

- [ ] Vercel function `/api/contact` — validace + Turnstile + Resend e-mail Martinovi.
- [ ] Vercel function `/api/ai-readiness` — validace + Turnstile + Resend (text shrnutí, PDF later).
- [ ] Klient-side `ContactForm.astro` přepojený na produkční endpoint.
- [ ] AI Readiness multi-step formulář funkční (otázky a scoring placeholder).
- [ ] Test e-mailu z formuláře dorazí.

**Acceptance:** odeslání formuláře z produkce → e-mail v Martinově inboxu do 30 s, ne ve spamu (DKIM/SPF zelené).

### Fáze 5 — Polish & launch checks (≤ 1 day)

- [ ] Plausible script přidán do BaseLayout.
- [ ] Sitemap.xml ve `dist/`.
- [ ] RSS feed v `/rss.xml`.
- [ ] Schema.org markupy validovány přes Google Rich Results Test.
- [ ] Robots.txt povoluje vše, blokuje jen `/api/*`.
- [ ] Google Search Console verifikace, sitemap submit.
- [ ] GBP claim pro WellBe s.r.o. + Brno.
- [ ] Manuální test všech CTA, formulářů, odkazů, breakpoints (320, 768, 1280, 1920).
- [ ] Diakritika ručně checknutá ("Příliš žluťoučký kůň úpěl ďábelské ódy" v hero, body, code).
- [ ] Reálné fotky týmu vložené (jinak fáze blokována).

**Acceptance:** uživatel-Martin projde celým webem, nenajde chybu. Veřejný launch.

### Fáze 6+ (post-launch, paralelní s YouTube launch)

- AI Readiness Assessment full-feature (PDF generování, scoring algorithm).
- První case study po podpisu prvního klienta.
- Pagefind search.
- A/B test hero copy.
- Anglická verze (rozhodnutí dle §14.3).
- Cal.com booking embed na `/kontakt`.

---

## 7. Acceptance criteria (launch gate)

Web je připraven k veřejnému launchi pouze pokud:

- [ ] Všechny URL z §2 vrací 200 a obsahují validní obsah (ne placeholder).
- [ ] Žádný anglicismus z blocklistu §7 origin v copy.
- [ ] Vizuální tokens (barvy, fonty, spacing) odpovídají `DESIGN_BRIEF.md`.
- [ ] Lighthouse 95+ na 5 klíčových stránkách.
- [ ] Mobilní rendering OK na 320 × 568, 375 × 812, 414 × 896.
- [ ] Diakritika v hero a body bez vizuálních problémů.
- [ ] Kontaktní formulář pošle reálný e-mail (E2E).
- [ ] AI Readiness formulář alespoň přijme submit a pošle text shrnutí.
- [ ] Footer obsahuje WellBe s.r.o. IČ, sídlo, OR — kompletní právní (§0 origin).
- [ ] 3 právní stránky linkované z footeru, IČO ve footer souhlasí s textem stránek.
- [ ] OG image se renderuje správně (FB debugger / OG.dev test).
- [ ] Plausible zachytává návštěvy.
- [ ] Reálné fotky týmu — žádný placeholder avatar.
- [ ] Repo má smysluplný README a CLAUDE.md je aktuální.
- [ ] Sitemap odeslaný do GSC.
- [ ] Motion respektuje `prefers-reduced-motion: reduce` — testováno (DevTools rendering panel).
- [ ] Žádná animace neudělá CLS hit > 0.05 ani nepřidá JS bundle (žádná lib).

---

## 8. Rizika & otevřené otázky

### 8.1 Rizika

| Riziko | Mitigace |
|---|---|
| GH Pages cache problém s custom doménou (proxy SSL) | CF DNS s "DNS only" pro GH Pages, ne proxy; nebo vypnutí HTTPS-only redirect na GH side |
| Vercel cold start na `api.quconsult.cz` při prvním kontaktním formuláři | Edge Runtime místo Node, Resend latence ~200 ms; UX má loading state |
| SMTP doručitelnost do českých free e-mailů (Seznam.cz, Centrum) | DKIM + SPF + DMARC ze stejné domény (řešeno přes mail providera); test odesláním z noreply@quconsult.cz několikrát před launchem |
| Stitch designy nestihnou pokrýt 4 service detail / Jak pracujeme / O nás / Blog post | Druhé Stitch session paralelně s fází 1; alternativa: navrhnout je v Astro přímo přes Tailwind + odkazy na referenční brandy (Linear, Basecamp) |
| Týmové fotky chybí | Domluvit focení do fáze 0 (NB: §8.4 origin chce přirozené světlo, ne korporátní studio); jinak fáze 5 blocked |
| AI Readiness scoring není navržený | Pro launch stačí form+e-mail+text shrnutí (ne PDF), full feature v Fázi 6 |
| Anglické citace v plan.md (Schein, Block, Maister) na webu | Origin §1.4 explicitně říká: interní princip nepoužívat veřejně. Web tyto autory nezmiňuje. |
| Substack newsletter signup vs vlastní | Pro launch: Substack embed (Martinův), v post-launch zhodnotit migraci |
| GDPR cookie banner přesto | Plausible bez cookies, Turnstile managed bez cookies — pokud někdo přidá GA, banner je třeba. **Pravidlo:** nepřidávat cookies bez vědomí Martina. |
| Motion library bloat | Pravidlo §4.7: žádná lib. PR review odmítne Framer/GSAP/Lottie. CI bundle-size check (post-launch) |
| reCAPTCHA v3 score false-positive (legitimate user blocked) | Funkce přijme submit i při score 0.3–0.5 a označí v e-mailu *"⚠ low score"*; Martin sám rozhodne; full block jen při score < 0.3 |

### 8.2 Otevřené otázky pro Martina

1. **Podoba AI Readiness scoringu.** Mám navrhnout otázky a scoring v separátním plánu, nebo to bude děláno hands-on s Martinem?
K čemu potřebujeme AI Readiness scoring?
2. **Cal.com / Calendly v `/kontakt`?** *(deferred to post-launch)* Origin §11 to nezmíňuje, ale pro CEO 45+ je booking link velký friction reducer. Pro launch: žádný booking, jen form přes Vercel funkci s reCAPTCHA. Reevaluovat post-launch.

3. **Cookie banner copy:** finální české znění informativního banneru (návrh: *"Tento web používá nezbytné cookies pro ochranu formulářů (Google reCAPTCHA) a anonymní analytiku bez cookies (Plausible). [Rozumím]"*). Schválit Martinem.
4. **Tým — fotky.** Hotové, nebo focení v fázi 0?
  Fotky týmu teď máme v assets/images
5. **Initial blog článek pro launch.** Martin píše paralelně? Nebo placeholder a první článek až po launchi (akceptováno per origin §14.1 — *"žádné placeholder"* se týká jen *"coming soon"*)?
Pokud máme představu o článcích (což bychom měli mít, případně uděláme hlubší research), stačí dát placeholder, obsah lorem ipsum a po webu to doděláme.
6. **Doména `wellbe.cc`** — origin §0 říká *"se ruší jako primární"*. Redirect na `quconsult.cz`? Nebo vypnout úplně?
wellbe.cc si nastavím s redirectem, budu tam potřebovat jen nějakou jednoduchou landing page, která bude odkazovat na quconsult a další projekty wellbe (dodám později).
7. **`zpracovatele.html`** — má v sobě seznam reálných zpracovatelů. Aktualizovat před portem dle aktuálních dodavatelů (Resend, Vercel, Cloudflare, GitHub, Plausible by měli být zmíněni)?
Můžeme na GitHub pages použít Cloudflare? Můžeme udělat ten seznam zpracovatelů pokud možno reálný, ale podle mě tam není potřeba dávat Vercel, Cloudflare a Github pages, pokud nepřidávají žádné cookies ani nezpracovávají osobní údaje.
---

## 9. Sources & References

### Origin

- **Origin document:** [`plan.md`](../../plan.md) (3. revize, 21. 4. 2026). Klíčová rozhodnutí přenesená:
  - 4 public služby, jejich pricing model, primární CTA (§5, §6, §11.4).
  - Brand voice rules, blocklist anglicismů (§7).
  - Vizuální identita včetně barev/typografie/spacing (§8).
  - Tým 5 lidí, krédo Martina, konvenční tituly (§1.8).
  - URL struktura webu (§11.3).
  - Lead magnety včetně AI Readiness Assessment (§11.5).
  - Pravidla "žádné coming soon", žádné case studies do první reference (§14.1, §11.1).
- **Companion document:** [`DESIGN_BRIEF.md`](../../DESIGN_BRIEF.md) — vizuální tokens, referenční brandy (Linear, Basecamp, Stripe), zakázané styly.

### Existing assets v repo

- [`logo-q-mark.svg`](../../logo-q-mark.svg) — Q-mark, kompatibilní s plan §1.1.
- [`tym.html`](../../tym.html) — staré team page, kompletní přepis (zastaralé tituly).
- [`soukromi.html`](../../soukromi.html), [`zpracovatele.html`](../../zpracovatele.html), [`cookies.html`](../../cookies.html) — port do LegalLayout, validovat IČO/adresu.

### Stitch designs

- Project ID `10554376683748281001` — *"QuConsult Brand Identity"*, 21 screens, accessed via Stitch MCP 2026-04-29.
- Vybrané verze pro launch: *Updated Logo* varianty (Landing `ee33d42a…`, Blog `6bdb1869…`, Contact `eac97271…`, Services `ef25d9e3…`).

### Externí reference (best practices)

- Astro 5 docs (content collections, view transitions): https://docs.astro.build
- GitHub Actions deploy to Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Vercel functions runtime (Edge): https://vercel.com/docs/functions
- Nodemailer SMTP transport: https://nodemailer.com/smtp/
- Google reCAPTCHA v3 docs: https://developers.google.com/recaptcha/docs/v3
- Plausible analytics (GDPR): https://plausible.io/data-policy
- Pagefind (static search): https://pagefind.app

### Související budoucí plány (po implementaci tohoto)

- AI Readiness Assessment scoring & PDF gen — samostatný plán.
- První case study landing — po podpisu klienta.
- Anglická verze webu — rozhodnutí podle origin §14.3 (po 12 měsících).
- Agentic OS demo content (video, screenshoty) — paralelní YouTube launch (origin §10.3).

---

*Plán napsán 2026-04-30 jako výchozí kontrakt pro implementaci. Za pochodu se může revidovat — origin `plan.md` je zdroj pravdy strategie a má přednost.*


claude --resume 6b8b14bc-2aff-4fee-84a0-9964f241f7fc
