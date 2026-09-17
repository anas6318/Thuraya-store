# Architecture

React 19, Vite, strict TypeScript, React Router, Zod and Supabase JS. The public storefront and lazy admin share typed domain entities and pricing rules. The real API is `store-api`; browser visibility is never the authorization boundary.

Products, localized text, option axes, option values, variants, variant selections and media associations are separate relational entities. Sparse gemstone/metal/measurement metadata uses intentional JSONB fields. Supplier cost and sourcing information reside in the private schema, separate from public products.

Checkout validates input at the Edge boundary. A Postgres function locks inventory and coupons, recalculates minor-unit prices, creates immutable order snapshots, records events and inserts the outbox in one transaction. A request-key advisory lock serializes retries. Changed payloads are rejected.

Guest tracking requires order number and an HMAC of normalized email/phone. Responses use a positive customer-data projection; private notes and sourcing details are never included. Abuse-prone requests use database-backed rate limits.

Notification processing is separate from order commits. Resend uses a stable idempotency key and stored payload. Ambiguous WhatsApp outcomes are held for reconciliation, not blindly resent. No callback can change a payment while an adapter is unconfigured.

Build-time React rendering emits crawlable localized HTML and sitemap entries for published content. Publishing content requires a new frontend deployment to refresh prerendered HTML. Runtime catalog requests provide current prices; server checkout remains authoritative.

Known unfinished areas are listed in WORK_PROGRESS and launch-checklist. This document describes implemented boundaries, not a claim of completed production validation.
