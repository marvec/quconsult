---
id: erp-pohoda-mala
dimension: provoz
priority: 5
weight: may
triggers:
  - field: erp
    equals: "Pohoda"
  - field: velikost
    in: ["pod 30", "30–50"]
---

Pohoda je nejrozšířenější účetní software v Česku pro malé a střední firmy. U firem pod 50 zaměstnanců je to typický výchozí stav.

Co to znamená pro AI projekt: Pohoda není primárně analytický systém. Nemá rozsáhlé API — data exportujete přes CSV nebo přes MSSQL databázi na pozadí. Propojení s AI nástrojem tedy přidává 2–3 týdny práce na datové vrstvě (ETL — příprava dat pro zpracování).

To není blokátor. Je to zvýšená vstupní cena za datový pipeline. U projektů nad 200 tisíc korun se tato investice vyplatí. Pod tuto hranici doporučujeme nejdřív ověřit, jestli lze use-case udělat přímo z exportovaných CSV souborů — bez plné integrace.

Vhodné use-casy pro firmy s Pohodou: automatická kategorizace výdajů, analýza zákaznické platební morálky, predikce cash-flow z fakturace.

Konkrétní krok: Ověřte, jestli váš správce Pohody umí exportovat transakcí data za posledních 24 měsíců do CSV. Pokud ano, přineste ukázkový export na konzultaci — budeme vědět přesně, s čím pracujeme.
