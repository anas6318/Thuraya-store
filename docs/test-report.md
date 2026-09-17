# Latest Preview-demo safety checkpoint — 2026-09-17

PASSED: 310 unit tests, 30 migrations, 56 local DB checks, TypeScript, lint, six Edge checks, production build (33 localized pages) and 38 production artifact checks. A defensive build with `VERCEL_ENV=production VITE_PREVIEW_DEMO=true` still emitted no demo products or fixture credentials. An explicit local Vercel-equivalent Preview build (`VERCEL_ENV=preview VITE_PREVIEW_DEMO=true`) rendered the marked fixture catalog and passed its dedicated preview artifact check.

PASSED: preview activation is a pure, unit-tested two-key decision: explicit `VITE_PREVIEW_DEMO=true` plus `VERCEL_ENV=preview`. Any full or partial Supabase public configuration disables fixture fallback. Production retains its existing no-auto-demo behavior when Supabase is absent.

NOT EXECUTED: actual Vercel deployment and browser visual QA. This local fixture-build test does not prove a deployed Preview, live Supabase, payments, messaging or a browser session.

---

# Latest design checkpoint — 2026-09-17

PASSED: 307 unit tests, 30 migrations, 56 local DB checks, TypeScript, lint, six Edge checks, build (33 localized pages), 38 artifact checks and six preview HTTP-200 paths. Gemstone tests cover labels, aliases, custom types, optional facts and active variant filtering; SQL proves persistence.

BLOCKED / NOT EXECUTED: browser assertions and visual/accessibility/performance review. One local browser search found no executable. Preview first failed across isolated processes; managed preview/probe execution succeeded. No live services or Higgsfield generation were performed. See storefront-design-pass.md and WORK_PROGRESS.md for exact implementation and recovery state.

---

# Latest checkpoint — 2026-09-17

PASSED: 301 unit tests, 30 migration loads, 55 local Postgres/WASM checks, TypeScript, lint, six Edge checks, production build (33 localized pages), 38 artifact checks. Last full command and changed files are in WORK_PROGRESS.md.

FAILED THEN FIXED: new actual SQL snapshot coverage exposed alias ambiguity; DB product timestamp offsets and recursive helper typing were corrected. Final suite has zero failures.

BLOCKED: browser/Chromium and contract-dependent providers. One local executable/cache check found no browser; no download was attempted. NOT EXECUTED: browser/E2E assertions, visual/accessibility/performance matrix, live Supabase/provider activity, distributed load tests and deployment. Earlier results below remain historical facts, not current live verification.

---

# Test report

Latest executed results are maintained in WORK_PROGRESS. Historical counts are not promises about later source changes.

| Check | State | Result |
| --- | --- | --- |
| Strict TypeScript | EXECUTED / PASSED | 0 errors |
| ESLint | EXECUTED / PASSED | 0 errors; generated reports excluded |
| Unit tests | EXECUTED / PASSED | 282 passed, 0 failed |
| SQL migrations | EXECUTED / PASSED | 26 loaded in local Postgres/WASM harness |
| SQL integration | EXECUTED / PASSED | 48 checks; Auth/Storage mocked |
| Edge typecheck | EXECUTED / PASSED | store-api, notification-worker, media-delivery, media-cleanup, payment-webhook, notification-receipt |
| Playwright E2E | EXECUTED / FAILED (environment) | 29 browser-launch failures, 0 page assertions; Chromium executable missing. Diagnostic rerun: 1 launch failure, 28 not run. Installation download times out. |
| Production build | EXECUTED / PASSED | 33 localized public pages, including new Admin variant controls |
| Production artifacts | EXECUTED / PASSED | 38 checks, including RTL HTML and no demo credentials |
| Visual review | PARTIALLY EXECUTED | English hero/product and Hebrew mobile product; full matrix outstanding |
| Live Supabase/providers | NOT EXECUTED | No credentials |
| Deployment | NOT EXECUTED | No production deployment |

Do not count the 29 authored E2E cases as passes. Browser actions recorded in WORK_PROGRESS are manual QA, not automated-suite results.

Latest non-browser verification (2026-09-16): strict TypeScript, ESLint, all 282 unit tests, all 26 migrations, all 48 local SQL checks, all six Edge checks, the 33-page production build, and 38 artifact checks passed. This includes attempt-safe worker batch continuation, device-local cart recovery, reference-safe media cleanup/requeue protection, atomic CMS and taxonomy ordering, translation publication guards, safe audit change summaries, complete media-reference visibility, truthful paid-order dashboard insights, server-owned customer-address/default-consent lifecycle checks, and owner/admin-only supplier/internal fulfilment controls. It does not replace live Supabase, provider, browser, or deployment verification.

2026-09-10: all non-browser gates reran successfully after analytics lifecycle and media reference/metadata changes. Six new lifecycle tests and three media-reference tests bring the total to 228. One local browser recovery search found no executable; no download was attempted because the CDN is outside the current permitted network domains. Browser assertions and current visual review remain BLOCKED/NOT EXECUTED respectively.

Latest recovery: no compatible executable found in common system paths or Playwright caches. One bounded HEAD request to the previously failing Chromium CDN URL returned HTTP 502. Installation was not retried because download access was unavailable. Current E2E execution is BLOCKED, and current visual audit is NOT EXECUTED. Historical launch failures remain historical facts.

Resolved regressions in this checkpoint: settings-schema optional-key TypeScript inference, disabled WhatsApp configuration validation, and a misplaced Edge switch case. All affected gates passed after fixes. Final production build prerendered 33 localized pages; 38 artifact checks passed. The six earlier HTTP 200 preview checks were not repeated because the current source changes did not alter Vite host binding or deployment routing.
