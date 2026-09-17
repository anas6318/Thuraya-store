# Admin guide

Use `/admin`. Local demo is prominently labelled. Real admin requires a Supabase staff profile and, by default, MFA.

- Owner/admin: configuration, financial data and all operational areas.
- Order manager: orders, customers, concierge, review moderation and notification operations.
- Content manager: products, media, taxonomies, content and translation editing; no private product costs.

Create products as drafts. Confirm identity from the actual artwork, then enter prices and factual per-product/per-variant specifications. Unknown facts stay blank. Configure option axes and generate/reconcile variants. Supply all three launch languages before publication; an owner-only translation override is explicit.

The first gallery image is the cover. Use the reorder controls and localized alt text. Keep the original supplied artwork at 4:5. Draft duplication creates new product/variant/option identities.

Orders expose the allowed next states. Verify real bank receipt before payment confirmation. Every status change records a timeline event and outbox records. Supplier references and notes are internal, never customer tracking data.

Homepage sections can be enabled, reordered and edited with constrained content fields. Move-up reordering saves the complete order atomically and rejects stale section lists. Curated collection and product selections may be combined. Full/grid alternatives apply to supported hero/editorial/product-grid layouts; default split compositions remain unchanged. Policies remain drafts until legal-reviewed and complete in all languages. Reviews require manual approval, including their photos. Media alt-text changes use an explicit save button.

Taxonomies use the same complete-list atomic ordering model: create records append at the end, then use Move up to save the whole order. Active categories and collections require AR/HE/EN names. The Media Library shows queued cleanup jobs and allows owner/admin/content-manager staff to safely requeue only jobs marked `needs_attention`; this does not delete an object synchronously.

Media Library also lists every relational product, variant, homepage-section, category and collection reference before it allows deletion. The database remains the final guard. Audit entries describe a create or the names of changed fields only; they intentionally never copy old/new customer, supplier, internal-note or other field values into the audit summary.

Settings validation rejects unknown fields, duplicate payment methods/status-channel template mappings, inverted delivery ranges and incomplete enabled template copy. Official WhatsApp template identifiers are required when enabling that channel. Credentials are never entered in these settings fields.

Customer detail shows operational contact data, preferences, order history and lifetime paid total only. It does not expose supplier references, product costs, private order notes or review capability data. Customers manage their own saved addresses: the first becomes default, changing a default is atomic, and removing a default promotes one remaining address when available. Account preference checkboxes are optional marketing/channel preferences; configured transactional order notices are governed separately by their status templates.

Order managers can manage customer-facing fulfilment dates and an approved HTTPS tracking URL, but cannot read or change supplier references or internal notes. Those fields are reserved for owner/admin at both the Admin UI and database write boundary.

Notification retries are available only for failed, unambiguous jobs below five attempts and within the safe first-attempt window. The Admin table distinguishes a worker send state, operator-attested acceptance, and authenticated provider delivery/read receipts. Manual reconciliation never means delivered or read. Ambiguous WhatsApp delivery requires reconciliation outside the retry button. See WORK_PROGRESS for unverified and unfinished admin capabilities.

## Operational audit additions (2026-09-17)

Active shipping zones require Arabic, Hebrew and English names. Set supported city names exactly as accepted during checkout, or leave cities blank for all Israel destinations. Zone ETA is combined with store/product lead times by taking the maximum. Disabling a zone removes it from checkout; saved order snapshots remain unchanged. The international mode is reserved for a future rollout and does not enable non-Israel orders.

Promotion codes are unique without regard to letter case. One promotion may be used per order; usage increments inside the order transaction and cannot be reset by the promotion editor. Editing dates uses the operator browser's local time while storing absolute timestamps. Invalid/incomplete published content is rejected; optional store copy may be entirely empty but not partially translated. The Translations screen now includes shipping and store copy.

Editors send canonical mutation fields instead of resubmitting DB aliases/timestamps or signed delivery metadata. Do not relax strict server schemas to work around a read-model/edit-model mismatch.

## Moissanite and Lab-Grown Diamonds

Stone type fields now suggest `moissanite` and `lab_grown_diamond`; custom confirmed types remain valid. Configure carat, shape, cut grade, color, clarity and certification individually. Empty variant fields inherit product defaults, so inspect all inherited facts when introducing a different stone type. Active variant stone types are searchable in the storefront filter. No diamond inventory or pricing is created automatically.
