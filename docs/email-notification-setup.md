# Email notifications

Configure `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, verified `EMAIL_FROM`, `ORDER_NOTIFICATION_EMAIL`, `SITE_URL`, and a strong `NOTIFICATION_WORKER_SECRET` as server secrets. Enable the email channel and desired templates in Admin.

Schedule an authenticated POST to the `notification-worker` Edge Function. The authorization value is `Bearer` followed by the worker secret. Keep scheduling credentials outside browser code and logs.

Orders and status changes commit outbox records regardless of provider availability. Worker claims are separate. Payloads are persisted before sending; Resend receives the outbox ID as its idempotency key. Retry only within the safe retention window. Admin can retry eligible failures.

`sent` means provider accepted the message, not inbox delivery. Verify bounce handling, scheduling and recipient-language rendering in staging. No emails have been sent by this build.

Migration 0017 requires an acceptance ID and prevents delayed failures from overwriting committed acceptance. Duplicate results do not duplicate logs. Migration 0018 provides an owner/admin-only, audited reconciliation dialog for uncertain held messages: independently inspect the provider dashboard, match the order and recipient, and attest the exact accepted message ID. It does not contact the provider, resend, or verify delivery. Leave unknown outcomes held. Demo mode cannot attest real acceptance. Migrations 0019–0020 add attempt identity and private authenticated receipt storage/projection. Resend receipt ingestion is implemented but disabled until configured and not live-tested; see [notification receipts](notification-receipts.md) for authentication, safe upgrade order and staging requirements.

Reference: https://resend.com/docs/dashboard/emails/idempotency-keys

Migration 0012 selects the account preferred language when present, otherwise the checkout language. Account email-update preferences can suppress status messages. The new-order owner email remains separate. Disabled jobs stay disabled; enabling a channel does not silently replay them. Retry limits are five attempts and a 23-hour first-attempt window; expired jobs require operational investigation. Settings are read before claiming jobs so a configuration read failure cannot strand newly claimed work. Provider exceptions happen after the order/status transaction commits and cannot roll it back.
