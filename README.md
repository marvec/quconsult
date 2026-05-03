# QuConsult Web

Marketingový web QuConsultu (česká AI konzultantka). Astro 5 + Tailwind 4,
deploy na GH Pages + Vercel funkce.

## Quickstart

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # static dist/
pnpm preview      # serve build
```

Node 22+, pnpm 9+.

## Strategy

- `plan.md` — strategy source of truth (mateřský dokument)
- `DESIGN_BRIEF.md` — visual rules (barvy, typografie, layout)
- `CLAUDE.md` — pravidla pro Claude Code sessions

Před změnou copy nebo struktury si přečtěte `plan.md` §11 (Web)
a `DESIGN_BRIEF.md`. Před změnou strategie eskalujte na Martina.

## Deploy

- **Static site:** push do `master` → GH Action build → GH Pages
  (`quconsult.cz`). Workflow: `.github/workflows/deploy-pages.yml`.
- **API:** Vercel projekt, **Root Directory = `vercel-api/`**,
  Framework Preset = Other. Env vars dle `CLAUDE.md` §2 a
  `vercel-api/api/contact.ts` (RECAPTCHA_SECRET_KEY, SMTP_*,
  NOTIFICATION_EMAIL, ALLOWED_ORIGIN).

Astro klient volá API přes `import.meta.env.PUBLIC_API_BASE_URL`
(viz `.env.example`).

## Repo struktura

```
src/            Astro pages, layouts, components, styles
public/         Statické assety (favicon, CNAME)
vercel-api/     Serverless funkce (separate Vercel project)
.github/        CI/CD workflows
```

Detail v `CLAUDE.md` §5.
