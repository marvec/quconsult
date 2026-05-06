import * as CookieConsent from 'vanilla-cookieconsent';
import type { CookieConsentConfig } from 'vanilla-cookieconsent';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    __gaLoaded?: boolean;
    __ccInitialized?: boolean;
  }
}

const GA_ID = import.meta.env.PUBLIC_GA_MEASUREMENT_ID;

function loadGA4(): void {
  if (!GA_ID || window.__gaLoaded) return;
  window.__gaLoaded = true;

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { anonymize_ip: true });
}

function syncConsent(): void {
  const granted = CookieConsent.acceptedCategory('analytics');
  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
  });
  if (granted) loadGA4();
}

const czTranslations = {
  consentModal: {
    title: 'Vážíme si Vašeho soukromí',
    description:
      'Tento web používá nezbytné cookies pro svůj provoz a volitelně analytické cookies (Google Analytics) pro měření návštěvnosti. Analytické cookies aktivujeme pouze s Vaším souhlasem. Souhlas můžete kdykoli odvolat.',
    acceptAllBtn: 'Přijmout vše',
    acceptNecessaryBtn: 'Pouze nezbytné',
    showPreferencesBtn: 'Spravovat předvolby',
    footer: '<a href="/soukromi">Ochrana osobních údajů</a> · <a href="/cookies">Cookies</a>',
  },
  preferencesModal: {
    title: 'Předvolby cookies',
    acceptAllBtn: 'Přijmout vše',
    acceptNecessaryBtn: 'Odmítnout vše',
    savePreferencesBtn: 'Uložit volbu',
    closeIconLabel: 'Zavřít',
    sections: [
      {
        title: 'Použití cookies',
        description:
          'Cookies používáme k zajištění základní funkčnosti webu a — pokud nám k tomu dáte souhlas — k anonymnímu měření návštěvnosti. Předvolby si můžete kdykoliv změnit.',
      },
      {
        title: 'Nezbytné cookies <span class="pm__badge">Vždy aktivní</span>',
        description:
          'Bez těchto cookies web nemůže správně fungovat (zapamatování Vaší volby ohledně cookies, ochrana formulářů přes Google reCAPTCHA). Neukládají žádné osobní údaje.',
        linkedCategory: 'necessary',
      },
      {
        title: 'Analytické cookies',
        description:
          'Pomáhají nám pochopit, jak návštěvníci web používají, abychom jej mohli zlepšovat. Údaje jsou anonymizované a zpracovává je Google Analytics 4 (Google Ireland Limited).',
        linkedCategory: 'analytics',
        cookieTable: {
          headers: { name: 'Cookie', domain: 'Doména', desc: 'Popis', exp: 'Platnost' },
          body: [
            {
              name: '_ga',
              domain: 'quconsult.cz',
              desc: 'ID návštěvníka pro GA4 (anonymizováno)',
              exp: '2 roky',
            },
            {
              name: '_ga_*',
              domain: 'quconsult.cz',
              desc: 'Stav session GA4',
              exp: '2 roky',
            },
          ],
        },
      },
      {
        title: 'Další informace',
        description:
          'Máte-li dotazy ohledně našich zásad cookies, kontaktujte nás na <a href="mailto:info@quconsult.cz">info@quconsult.cz</a>. Více v <a href="/zpracovatele">seznamu zpracovatelů</a>.',
      },
    ],
  },
};

export const ccConfig: CookieConsentConfig = {
  guiOptions: {
    consentModal: {
      layout: 'box inline',
      position: 'bottom right',
      equalWeightButtons: true,
      flipButtons: false,
    },
    preferencesModal: {
      layout: 'box',
      equalWeightButtons: true,
      flipButtons: false,
    },
  },
  categories: {
    necessary: { enabled: true, readOnly: true },
    analytics: {
      enabled: false,
      autoClear: {
        cookies: [{ name: /^_ga/ }, { name: '_gid' }],
      },
    },
  },
  onFirstConsent: syncConsent,
  onConsent: syncConsent,
  onChange: syncConsent,
  language: {
    default: 'cs',
    translations: { cs: czTranslations },
  },
};

export { CookieConsent };
