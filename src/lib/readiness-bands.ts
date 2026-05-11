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
