# Notification attempts and authenticated receipts

## Attempt safety

Migration 0019 binds worker payload preparation and result submission to the claimed attempt count. A stale attempt cannot clear a newer lock, schedule its retry, replace its payload or write another completion log. Duplicate completions are no-ops. Existing sent acceptance remains terminal. Manual reconciliation remains owner/admin attestation through its own audited function, not a fabricated delivery receipt.

For upgrade: pause the notification scheduler; apply migrations; deploy the matching worker and store-api; then resume scheduling. Legacy workers lose permission to the old result/payload functions and fail closed. Do not run old and new worker versions together. Existing uncertain sends stay held. Staging must test concurrent workers and interrupted database connections; local SQL tests simulate reordered completions, not live distributed execution.

## Receipt model

Migration 0020 stores provider, immutable event ID, provider message ID, normalized state, occurrence time and receipt time. Raw webhook bodies, recipients, subjects and provider diagnostic payloads are not retained. Exact duplicates do not add rows; conflicting reuse is rejected. Message identity is unique per channel. Check for duplicate historical provider IDs before applying that index and investigate them rather than deleting history automatically.

Receipts can arrive before send completion and remain unassociated until the exact provider message ID is recorded. Projection is derived, so later binding needs no replay job. Unmatched receipts never mutate orders or send status. Keep unmatched records for operational reconciliation; retention/pruning should be approved and monitored before production. This build does not automatically erase receipt history.

Read takes precedence over delivered, and delivered over failure/accepted. A late negative event is retained as a separate alert, not allowed to erase proven delivery. The model supports accepted, delivered, read, bounced, failed, complained and suppressed. Resend opens/clicks are deliberately ignored rather than called read. Delivery means the recipient mail server accepted the email, not guaranteed inbox placement or human reading. No WhatsApp receipt adapter is implemented yet; schema fixtures are not live WhatsApp evidence.

## Resend configuration

The `notification-receipt` Edge Function is disabled unless server-side `NOTIFICATION_RECEIPTS_ENABLED=true` and `RESEND_WEBHOOK_SECRET` are set. Use the signing secret for this exact endpoint, not the sending API key. Its gateway JWT check is disabled because Resend authenticates with a raw-body signature; the application requires that signature on every POST before any database write. There is no unauthenticated mutation fallback.

Create a Resend webhook pointing to `/functions/v1/notification-receipt` and select `email.sent`, `email.delivered`, `email.bounced`, `email.failed`, `email.complained`, and `email.suppressed`. The implementation verifies original bytes with HMAC SHA-256 and the documented Svix headers; a local five-minute timestamp tolerance rejects expired/future signatures. Malformed or unsigned requests return 401. Disabled configuration returns 503. Database failures return 503, never a false acknowledgement; successfully committed or intentionally ignored verified events return 204. Request body limit is 256 KiB with a 15-second deadline.

Deploy only after applying migrations. Verify legitimate signatures, invalid signatures, repeated events, receipts preceding send completion, delivery followed by stale failure, and unmatched message reconciliation in staging. No real provider receipt has been received in this workspace. Signature tests use local fixtures and the published Svix vector. Clock synchronization and provider replay behavior must be validated operationally.

## Authoritative contracts consulted

- [Resend webhook authentication](https://resend.com/docs/webhooks/verify-webhooks-requests)
- [Svix manual signature contract and test vector](https://docs.svix.com/receiving/verifying-payloads/how-manual)
- [Resend event semantics](https://resend.com/docs/webhooks/event-types)
- [Delivered payload](https://resend.com/docs/webhooks/emails/delivered)
- [Sent payload](https://resend.com/docs/webhooks/emails/sent)
- [Bounced payload](https://resend.com/docs/webhooks/emails/bounced)
- [Suppressed payload](https://resend.com/docs/webhooks/emails/suppressed)

These references were accessible during this phase. This does not remove the prior Meta/TikTok SDK-contract blocker or authorize guessed WhatsApp receipt authentication.
