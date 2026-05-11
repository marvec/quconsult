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
