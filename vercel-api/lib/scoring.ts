import { z } from 'zod';

// Multi-select fields from FormData can come as either string (single) or array.
// Normalize both to array of strings.
const multiSelectField = z.preprocess(
  (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]),
  z.array(z.string()),
);

export const OdpovediSchema = z.object({
  'data-kvalita': z.enum(['Vynikající', 'Použitelná', 'Roztříštěná', 'Nevíme']),
  'data-kde': multiSelectField,
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
}).passthrough();

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
