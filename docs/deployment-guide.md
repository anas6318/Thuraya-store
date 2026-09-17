# Deployment

Do not deploy as a live shop until launch-checklist is complete.

1. Create a separate THURAYA Git repository and commit source, migrations, tests, lockfile and `.env.example`; exclude credentials and local fixture configuration.
2. Complete staging Supabase setup, secure owner enrollment and provider tests.
3. Import the THURAYA repository into Vercel. Build command: `npm run build`; output: `dist`.
4. Set public Supabase URL/anon key and the canonical HTTPS `VITE_SITE_URL`. Do not set demo mode for production. Set server secrets only in Supabase.
5. Build fails if a configured catalog cannot be read. Inspect the generated three-language HTML, sitemap, canonical links and structured data. Rebuild after content publication.
6. Verify direct refresh of product, account and order routes on the actual host. Review `vercel.json` headers against the exact enabled integrations.
7. Point the owner's domain after preview approval; configure TLS, Auth redirects, allowed origins, notification links and monitoring.

Retain database backups and prior frontend deployments. Roll back frontend independently; do not reverse order-history migrations destructively. No deployment or DNS change has been performed.

## Isolated Preview demo for visual QA

This is a Vercel Preview-only fixture mode, not a staging or production integration.

1. In Vercel, create `VITE_PREVIEW_DEMO` with value `true` and select **Preview** only. Do not select Production or Development.
2. Keep the standard Vercel build command, `npm run build`. No `vercel.json` override is needed.
3. Do not provide `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` in that Preview environment. A configured or partially configured backend deliberately prevents the demo catalog from activating.
4. Vercel automatically provides `VERCEL_ENV=preview`. The fixture path requires both that value and the explicit variable. A `VITE_PREVIEW_DEMO=true` value in a Production build is ignored and the production artifact check still requires demo credentials to be absent.
5. Confirm the `PREVIEW DEMO` banner before using the link for visual QA. Its catalog, accounts, cart, orders, payment status and notifications are local simulated fixtures; no payment, email, WhatsApp, Supabase or merchant action is performed.

Never put a service-role key, payment secret, email key, WhatsApp token or any real customer/order export into Vercel `VITE_*` variables. Remove the Preview-only variable before repurposing a preview environment for connected staging.
