import { describe, it, expect } from 'vitest';
import { scoreReadiness, type Odpovedi } from './scoring.js';

describe('scoreReadiness', () => {
  it('returns max score for ideal answers', () => {
    const odpovedi: Odpovedi = {
      'data-kvalita': 'Vynikající',
      'data-kde': ['V ERP systému', 'Ve vlastní databázi', 'V cloudu (SharePoint, Drive)'],
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
    const odpovedi: Odpovedi = {
      'data-kvalita': 'Použitelná',
      'data-kde': ['V ERP systému'],
      reporting: 'Ano, funkční',
      vedeni: 'CEO / vedení',
      'tym-postoj': 'Velký zájem',
      kapacita: '5–10 h',
      cil: 'Úspora času',
      horizont: 'Do 6 měsíců',
      rozpocet: '300–500 tis.',
      erp: 'Pohoda',
      velikost: '50–150',
      obor: 'Výroba',
    };
    const r = scoreReadiness(odpovedi);
    expect(r.dimensions.data).toBe(67);
    expect(r.dimensions.lide).toBe(90);
    expect(r.dimensions.strategie).toBe(98);
    expect(r.dimensions.provoz).toBe(83);
    // round(67*0.3 + 90*0.3 + 98*0.25 + 83*0.15) = round(84.05) = 84
    expect(r.total).toBe(84);
  });

  it('caps data-kde bonus at 30', () => {
    const odpovedi: Odpovedi = {
      'data-kvalita': 'Vynikající',
      'data-kde': [
        'V ERP systému',
        'Ve vlastní databázi',
        'V cloudu (SharePoint, Drive)',
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
      cil: 'Vyšší kvalita',
      horizont: 'Do roka',
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
