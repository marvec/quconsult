# Stitch Walkthrough — Decisions Log

Vítězné Stitch screens pro každou stránku + fix list pro 3rd refinement pass.

## Status legend
- ✅ **Vítěz vybraný** — připravené k 3rd refinement
- 🟡 **V procesu**
- ⏳ **Čeká**

---

## ✅ 1. `/` Domů — Vítěz: `7fef5f99…` (*"QuConsult — Praktické AI pro české firmy"*)

**Stav:** screen není umístěný na canvasu (floating), pracujeme s lokální kopií `01-landing-A-praktickeAI-7fef5f99.png`.

**Co je dobré:**
- Správný hero z plan.md: *"Proměňte AI z buzzwordu ve váš největší konkurenční nástroj"*.
- 3 value props bloky.
- Service rozcestník (4 karty) přímo v home.
- Final CTA banner s amber pozadím.
- Žádné AI klišé (na rozdíl od ostatních 3 kandidátů, které měly forbidden neural-network grafiku).

**Fix list pro 3rd refinement:**
1. **Odstranit tým sekci z home.** Tým žije pouze na `/o-nas`.
2. **Místo týmu vložit "Agentic OS proof" blok** — *"Jak řídíme vlastní firmu"* + krátký screenshot/teaser + CTA na YouTube. (Po získání první case study se sekce přepne na case study card.)
3. **Přidat e-mail field do final CTA bloku.** Jediný `<input type="email">` + tlačítko *"Domluvit konzultaci"*. JS přesměruje na `/kontakt?email=<urlencoded>`, kontakt page předvyplní.
4. Aplikovat brand lockdown (header 6 položek, logo Q-mark, footer s WellBe s.r.o. IČ).

---

## ✅ 2. `/sluzby` Rozcestník — Vítěz: `54de8329…` (*"Služby - QuConsult"*)

**Stav:** floating, lokální kopie `02-sluzby-A-czech-54de8329.png`.

**Co je dobré:**
- H1 *"Co pro vás děláme"* matches plan.md §3.2.
- 4 service karty 2×2 grid se správnými názvy služeb.
- Sekce *"Jak začít"* (3krokové flow).
- Sekce *"Co neděláme"* (plan.md §5.6).

**Fix list pro 3rd refinement:**
1. Aplikovat brand lockdown (header 6 položek, logo Q-mark, footer s WellBe IČ).
2. Ověřit/doplnit ke každé kartě: *"Pro koho"*, typický výsledek, *"Od X €"*, CTA *"Bezplatná konzultace o této službě"*.

---

## ✅ 3. `/sluzby/[slug]` Service detail šablona — Vítěz: `920634b5…` (s úpravou z B)

**Stav:** floating, lokální kopie `03-service-detail-A-larger-920634b5.png` (a referenční B `03-service-detail-B-smaller-2e720bb7.png`).

**Co je dobré v A:**
- Hero + 2 amber CTA buttons.
- Sekce *"Pro koho je tato služba určena?"*.
- Sekce *"Mřížkové přístupy k AI"* (= *"Co konkrétně děláme"*).
- *"Investice do plánování"* — 2coulová pricing sekce ✓.
- *"Časté dotazy"* FAQ sekce ✓.
- Final CTA blok.

**Fix list pro 3rd refinement:**
1. **Převzít z B 3-card layout pro sekci *"Pro koho je tato služba"*** (3 sloupce vedle sebe místo původního layoutu v A).
2. Aplikovat brand lockdown (header 6 položek, logo Q-mark, footer s WellBe IČ).
3. Ověřit pokrytí všech sekcí dle plan.md §3.3:
   - Hero ✓
   - *"Pro koho"* (3-card layout z B) ✓
   - *"Co konkrétně děláme"*
   - *"Jak spolupracujeme"* (4 kroky)
   - *"Typické výsledky"*
   - *"Datová připravenost"* sub-section
   - *"Co je AI Readiness Assessment"* CTA blok
   - *"Orientační cena"* (Discovery 2 týdny od 75 000 Kč) ✓
   - FAQ (3-5 otázek) ✓
   - *"Co neděláme"*
   - Final CTA ✓

---

## ✅ 4. `/jak-pracujeme` — Vítěz: `ea7e7448…`

**Stav:** floating, lokální kopie `04-jak-pracujeme-A-larger-ea7e7448.png`.

**Co je dobré v A:**
- *"Proces v 5 krocích"* — 5 sloupců.
- *"5 pilířů, kterými se odlišujeme"* — 2-column layout s hloubkou.
- *"Naše technologie"* — 4 amber cards.
- *"Co od nás přesně dostáváte"* — 3 sloupce (zdrojové kódy / dokumentace / garance).
- *"Začněme malým pilotem"* CTA banner.

**Fix list pro 3rd refinement:**
1. **Nahradit stock laptop screenshot** v sekci *"Cyklus 2 týdnů"* za **ručně-kreslený Excalidraw-style diagram cyklu** — kruhové schéma s 2týdenními iteracemi (per plan.md §8 *"ručně kreslené diagramy"*, `DESIGN_BRIEF.md`).
2. Aplikovat brand lockdown (header 6 položek, logo Q-mark, footer s WellBe IČ).
3. Ověřit kompletní obsah 5 pilířů — všech 5 z plan.md §4.1 plně rozepsaných.

---

## ✅ 5. `/o-nas` — Vítěz: `2c98497d…` (s několika úpravami z B)

**Stav:** floating, lokální kopie `05-o-nas-A-larger-2c98497d.png` + reference `05-o-nas-B-smaller-72f6ae08.png`.

**Co je dobré v A (zachováváme):**
- Hero H1 *"Pomáháme českým firmám dělat praktické změny s AI"* — mise z plan.md §1.2.
- Sekce *"Naše hodnoty"* — 5 sloupců (Praktičnost, Partnerství, Transparentnost, Odbornost, Česká identita) per plan.md §1.6.
- Pull-quote s Martinovým krédem.
- Sekce *"Brno + Česko mimo Prahu"* + samostatná *"Proč Česko"*.

**Fix list pro 3rd refinement (mix A + B):**
1. **Sekce tým — převzít layout z B** (kompaktnější grid s 5 černobílými fotkami).
2. **Místo mapy + lokalit z A použít *"Stavíme na regionech"* 2-column blok z B** (kompaktnější, čistší).
3. **Final CTA — převzít copy a design z B:** *"Hledáte cestu k AI bez zbytečného šumu?"* + amber CTA box.
4. **Citát Martina — světlý peachy background z B** (ne tmavý jako v A).
5. Aplikovat brand lockdown (header 6 položek, logo Q-mark, footer s WellBe s.r.o. IČ).
6. Ověřit, že právní entita je explicitně uvedena (*WellBe s.r.o., IČ 05830931, Nové sady 988/2, 602 00 Brno*) — buď v sekci nebo v footeru.

---

## ✅ 6. `/blog` Index — Vítěz: `a89dc6e7…` (B, s úpravami z A)

**Stav:** floating, lokální kopie `06-blog-B-refresh-a89dc6e7.png` + reference `06-blog-A-czech-79520203.png`.

**Co je dobré v B (zachováváme):**
- **Featured article hero** s autorem a velkým obrázkem.
- **Mixed-size grid karet** s obrázky (různě velké dlaždice).
- Code snippet block (technický look pro vývojářské články).
- Filtr je na stránce (jen níž).

**Fix list pro 3rd refinement (mix B + A):**
1. **Opravit barvu pozadí** — sjednotit s brand off-white #FAFAF8 (B má teď jinou barvu).
2. **Newsletter signup design převzít z A** — *"Zůstaňte v obraze"* box s e-mail inputem a amber tlačítkem *"Přihlásit se"*.
3. **Obsahově pokrýt všechna témata z plan.md §11.3 — kombinace z A i z B:**
   - Z A: *"5 procesů, které může každá česká firma automatizovat hned"*, *"AI vs. RPA"*, *"GDPR a AI"*, *"Jak spočítat ROI AI projektu"*, *"ChatGPT vs. firemní AI asistent"*, *"5 kroků k datové připravenosti pro AI"*.
   - Z B: *"Proč nepotřebujete AI transformaci, ale praktické projekty"*, *"Pohled pod kapotu AI"*, technické články.
4. **Filtrační chips** umístit nahoru (nad grid, ne dole) — *"Vše · Strategie · Implementace · How-to · Case studies"* per plan.md §3.9.
5. Aplikovat brand lockdown (header 6 položek, logo Q-mark *"QuConsult"* — ne *"StrategicCraft"* z varianty A!, footer s WellBe IČ).
6. **Pozn. pro launch:** zobrazit jen 1 reálný článek (*"5 procesů…"*), ostatní karty schovat dokud články nevzniknou (per plan.md §14.1 *"žádné placeholder coming soon"*).

---

## ✅ 7. `/blog/[slug]` Article template — Vítěz: `fc2470e6…` (B, s úpravou z A)

**Stav:** floating, lokální kopie `07-article-B-smaller-fc2470e6.png` + reference `07-article-A-larger-aa4e3ae2.png`.

**Co je dobré v B (zachováváme):**
- Sticky TOC vlevo.
- H1 + author byline + **always-visible amber CTA *"Domluvit konzultaci"*** vpravo nahoře.
- Body sekce s názvy přesně z plan.md §3.4 pain pointů (*"1. Zpracování objednávek z e-mailu"*, atd.).
- Prominentní code block (n8n/JSON snippet) — technická hloubka.
- Author bio box.
- 3 karty *"Související články"*.
- **Final black CTA banner: *"Jednou měsíčně přehled trendů..."*** — copy z plan.md §11.4.

**Fix list pro 3rd refinement:**
1. **Převzít z A amber mid-page CTA box** — *"Chcete vidět, co je realistické možné u vás?"* (výraznější než peachy box v B).
2. Aplikovat brand lockdown (header 6 položek, logo Q-mark *"QuConsult"*, footer s WellBe IČ).
3. Ověřit, že frontmatter obsahuje: tagy, datum, autora s fotkou, reading time.
4. Lead odstavec H2-velikosti italikou (per plan.md §3.10).

---

## ✅ 8. `/ai-readiness` AI Readiness Assessment — Vítěz: `c5274781…` (B)

**Stav:** floating, lokální kopie `08-ai-readiness-B-smaller-c5274781.png` + reference `08-ai-readiness-A-larger-c6096499.png`.

**Co je dobré v B:**
- H1 *"Zjistěte AI zralost vaší firmy za 10 minut"* per plan.md §3.11.
- Progress bar (Krok 1 z 5).
- Form fields: VELIKOST FIRMY (button tabs), OBOR, VELIKOST ERP, textarea.
- *"Zpět"* + *"Pokračovat"* navigace.
- ✓ **Sekce *"Po dokončení dotazníku"* se 3 ikonami: *"Zpráva do 24 hodin"*, *"TOP 3 příležitosti"*, *"Bez prodejního tlaku"*** — přesně per plan.md §3.11.
- Sociální důkaz (author quote).
- Plný 4-sloupcový footer.

**Fix list pro 3rd refinement:**
1. **Brand fix:** *Boutique.AI* → *QuConsult* (header logo + footer + všude).
2. **Post-submit message** — převzít design z A (*"Děkujeme. Zprávu pošleme do 24 hodin na váš e-mail."* + 2 buttons), ale jako oddělený view, který se zobrazí až po submit (ne mid-page).
3. Aplikovat brand lockdown (header 6 položek, logo Q-mark, footer s WellBe IČ).
4. Ověřit obsah všech 5 kroků dle plan.md §3.11 (O firmě → Datová připravenost → Lidé a procesy → Cíle → Kontakt).

---

## ✅ 9. `/kontakt` — Vítěz: `ace45cef…` (A)

**Stav:** floating, lokální kopie `09-kontakt-A-czech-ace45cef.png`.

**Co je dobré v A:**
- H1 *"Domluvme si 45minutovou bezplatnou konzultaci"* — slovo od slova z plan.md §3.12.
- Subtitle *"Identifikujeme TOP 3 příležitosti pro AI ve vaší firmě — bez závazku, bez prodejního tlaku."* — z plan.md §3.12.
- Form fields kompletní per plan: jméno, firma, pozice, e-mail, telefon (volitelný), *"Co nejraději řešíte?"* textarea + GDPR checkbox.
- Amber CTA *"ODESLAT A DOMLUVIT KONZULTACI"*.
- Side panel: *"Kontakt napřímo"* (e-mail, telefon, LinkedIn), *"Kde nás najdete"* (WellBe s.r.o., Nové sady 988/2, 602 00 Brno) + mapa.
- Follow-up info: *"Odpovídáme do 24 hodin v pracovních dnech. Konzultaci pořádáme online (Google Meet) nebo osobně v Brně."*

**Fix list pro 3rd refinement:**
1. **Nahradit *"QuConsult Logo"* placeholder text** za reálné Q-mark logo (z `logo-q-mark.svg`).
2. **Opravit překlep ve footeru** *"emysliplno"* → správný text (pravděpodobně *"smysluplnou"*).
3. Aplikovat brand lockdown (header 6 položek, footer s WellBe IČ).
4. **Pre-fill via URL param** — implementovat: pokud `?email=<encoded>` v URL, předvyplnit field (napojení na homepage email-only CTA z bodu 1.3).
5. Zvážit, zda header amber *"KONZULTACE"* CTA je redundant (už máme primární submit button).

---

## ✅ 10. `/soukromi /zpracovatele /cookies` Legal template — Vítěz: `e9e8c2fd…` (A)

**Stav:** floating, lokální kopie `10-legal-A-larger-e9e8c2fd.png` + reference `10-legal-B-smaller-5cb06f82.png`.

**Co je dobré v A:**
- H1 *"Zásady ochrany osobních údajů"* + date stamp.
- Sticky TOC vlevo.
- 6 sekcí: *"O správci"*, *"Osobní údaje shromažďované správcem"*, *"Účel zpracování"*, *"Doba uchovávání"*, *"Vaše práva"*, *"Kontakt"*.
- Autentický interior image.

**Fix list pro 3rd refinement:**
1. **Odstranit amber CTA z headeru** — legal pages = žádné CTA (plan.md §3.13).
2. **Převzít z B styled peachy hero quote box** pro úvodní intro odstavec.
3. Aplikovat brand lockdown (header 6 položek, logo Q-mark, footer s WellBe IČ + odkazy mezi legal stránkami).
4. **Vytvořit 3 instance této šablony** pro `/soukromi`, `/zpracovatele`, `/cookies` s textem z existujících HTML souborů v repo (po validaci IČO).
5. Validovat, že IČO/adresa odpovídá originu §0 (WellBe s.r.o., IČ 05830931, Nové sady 988/2, 602 00 Brno, OR Krajský soud v Brně oddíl C vložka 98394).

---

## 🟡 11. `/404` — V procesu

**Vítěz:** `e9edc6a7…` (A, s úpravou loga z B)

**Stav:** floating, lokální kopie `11-404-A-e9edc6a7.png` + reference `11-404-B-d2541bbb.png`.

**Co je dobré v A:**
- Český nav (Služby, Jak pracujeme, Blog, O nás, Kontakt).
- H1 *"Tady to není"* per plan.md §3.14.
- Subtitle s lidskostí: *"Stránku, kterou hledáte, jsme buď přejmenovali, nebo se ztratila někde mezi servery. Jsme za ni v každém případě zodpovědní my."*
- Italic note: *"Pokud jste sem přišli z odkazu, dejte nám prosím vědět — opravíme to."*
- 2 buttons: *"Zpět na úvod"* + *"Napsat nám"*.

**Fix list pro 3rd refinement:**
1. **Nahradit serif *"Q."* velkou verzí skutečného Q-mark loga** (z B / `logo-q-mark.svg`).
2. **Opravit footer:** *"QuConsult s.r.o."* → *"WellBe s.r.o."*, odstranit EN tagline *"Boutique AI Strategic Consulting"*, rok 2024 → 2026.
3. **Header amber CTA** *"Consultation"* → *"Domluvit konzultaci"* (CZ).
4. Aplikovat brand lockdown.

---

## ✅ 12. Services Menu Overlay (komponenta) — Vítěz: `56921d01…` (A)

**Stav:** floating, lokální kopie `12-menu-A-czech-56921d01.png` + reference `12-menu-C-original-dbc12582.png`.

**Co je dobré v A:**
- Český copy (header label *"EXPERTIZA A STRATEGICKÁ AI"*, hero *"Naše Služby"*, subtitle CZ).
- 4 service cards v 2×2 gridu se správnými názvy + tagy (Roadmap, Studie proveditelnosti, AI Agenty, Návrh procesů, Workshops, Mentoring, Agentic OS, Vývoj na míru).
- Bottom CTA *"Chcete probrat váš projekt?"* + amber *"DOMLUVIT SCHŮZKU"*.
- Footer s českými labely.

**Fix list pro 3rd refinement:**
1. **Doplnit nav na 6 položek** per plan.md §2: *"Domů | Služby ▾ | Jak pracujeme | Blog | O nás | Kontakt"*. Změnit *"Nabídka"* na *"Služby"*.
2. **Nahradit broken image placeholder *"QuConsult Logo Q"*** skutečným Q-mark logem z `logo-q-mark.svg` (z C okopírovat vizuál).
3. Aplikovat brand lockdown.

---

## Souhrn — všech 12 vítězů

| # | Stránka | Vítězný ID | Note |
|---|---|---|---|
| 1 | `/` Domů | `7fef5f99…` | Tým nahradit Agentic OS proof + email CTA field |
| 2 | `/sluzby` Rozcestník | `54de8329…` | Doplnit per-card meta |
| 3 | `/sluzby/[slug]` Service detail | `920634b5…` | + 3-card *"Pro koho"* z B |
| 4 | `/jak-pracujeme` | `ea7e7448…` | Stock laptop → ručně-kreslený diagram cyklu |
| 5 | `/o-nas` | `2c98497d…` | Mix: tým + regiony + CTA + světlý citát z B |
| 6 | `/blog` Index | `a89dc6e7…` | Newsletter z A, témata z A i B |
| 7 | `/blog/[slug]` Article | `fc2470e6…` | + amber mid-page CTA z A |
| 8 | `/ai-readiness` | `c5274781…` | Brand fix + post-submit z A |
| 9 | `/kontakt` | `ace45cef…` | Logo placeholder fix + URL param prefill |
| 10 | Legal template | `e9e8c2fd…` | Bez CTA + peachy hero quote z B |
| 11 | `/404` | `e9edc6a7…` | Serif "Q." → skutečné Q-mark logo z B |
| 12 | Services Menu Overlay | `56921d01…` | Doplnit nav na 6 položek + Q-mark logo |
