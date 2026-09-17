# THURAYA / ثُرَيّا

Independent jewelry storefront and administration application. CROWNED was inspected as reference only; this project does not modify or depend on its repository.

## Run locally

Requires Node 22 or later and npm.

```sh
npm install
npm run demo
```

Open `http://localhost:5173/en`, `/ar` or `/he`. Local demo is explicitly labelled. Its transactions never move money or send messages. Demo owner: `owner@thuraya.test`; password: `ThurayaDemo!2026`. Other fixture roles are listed on the local admin login page at `/admin`. These credentials are not real accounts and are removed from production bundles.

For connected development, copy `.env.example` to `.env.local`, set public Supabase URL/key, and run `npm run dev`. A configured backend takes precedence over demo mode; errors never silently fall back to demo.

## Vercel Preview visual QA demo

For a disposable visual-QA deployment only, add `VITE_PREVIEW_DEMO=true` in **Vercel → Settings → Environment Variables** and select **Preview** as its only target. Do not add it to Production or Development. Vercel supplies `VERCEL_ENV=preview`; THURAYA requires both conditions, so the flag is rejected in production even if it is accidentally present. Leave Preview Supabase URL/anon-key variables unset for this isolated fixture mode: any configured (including partial) backend disables the fixture catalog.

Preview demo data, accounts, orders, payment state and messages are browser-local fixtures only. No provider is called and no real customer, order or credential is used. The Preview banner makes this visible. Normal production builds still remove the fixture credentials; `npm run build:preview-demo` and `npm run verify:preview-demo` are local parity checks for the Vercel Preview build context, not deployment commands.

```sh
npm run typecheck
npm run lint
npm run test
npm run test:db
npm run test:edge
npm run test:e2e
npm run build
npm run build:preview-demo
npm run verify:preview-demo
npm run preview
```

Production preview defaults to `http://localhost:4173`. Public HTML is prerendered for all three languages. Products with incomplete factual details remain drafts; the production catalog is intentionally empty until the owner supplies and publishes real product data.

## Readiness

This source is still under implementation and verification. Do not launch merely because compilation succeeds. Read [WORK_PROGRESS](docs/WORK_PROGRESS.md), [test report](docs/test-report.md) and [launch checklist](docs/launch-checklist.md). Live Supabase/provider testing and the complete E2E/visual audit have not yet been completed.

The current payment implementation supports owner-verified bank transfer once configured. Card, Bit, PayBox and PayPal are modelled but remain unavailable until their merchant adapters and verification are implemented. The payment webhook fails closed.

## Main areas

- `src`: storefront, English admin, localized customer content, UI tokens and services.
- `shared`: domain, server/client pricing, validation, privacy projections, security and SEO.
- `supabase`: migrations, production-safe draft seed and Edge Functions.
- `tests`, `scripts`: unit, SQL integration, E2E, image optimization and build verification.
- `docs/WORK_PROGRESS.md`: authoritative recovery point; newest phase supersedes historical results.
