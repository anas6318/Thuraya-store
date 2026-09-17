# Analytics

IDs are owner-configurable and empty by default. Consent must be accepted before event dispatch. The adapter allowlists product IDs, quantities, amounts and transaction IDs; it does not accept email, address, phone or freeform search text.

All required event names are wired: view_item, view_item_list, search, select_item, add_to_wishlist, add_to_cart, view_cart, begin_checkout, add_shipping_info, add_payment_info and purchase. Search sends no freeform query. Purchase requires a real order with paid status and is recorded locally only after adapter dispatch; a bank-transfer order awaiting payment does not emit purchase.

GA4 loads only after accepted consent and a valid configured ID. It becomes initialized only after the script load event; consent withdrawal blocks dispatch and denies analytics storage. Reacceptance restores consent. Page URLs are reduced to origin and referrer is blank to avoid private order/contact values. Events before initialization are dropped, not backfilled. Verify first-page event coverage after SDK initialization in staging.

Meta and TikTok have explicit registration interfaces (`registerAnalyticsAdapter`) but no bundled SDK initializers. Their IDs alone never activate them. A future integration must initialize the official SDK after consent, map the shared event contract to vendor events, register only on successful initialization, and revoke on withdrawal. These integrations remain implementation work, not a credential-only task. No conversion metrics may be claimed from IDs or dispatch attempts.

`analyticsState()` reports disabled, loading or initialized adapter state. An initialized adapter means the local dispatch interface is registered, not that a provider received an event. Unit tests cover consent, initialization, missing IDs and payload privacy. Provider debug validation, cookie behavior and outgoing network inspection have NOT EXECUTED.

## Lifecycle update — 2026-09-10

The previous statement that events during initialization are dropped is superseded for an actively loading provider: consented events may wait in memory for at most 30 seconds, with a shared limit of 100 pending entries. There is no pre-consent capture, persistent event queue or replay to a newly configured ID. Withdrawal, failed loads and ID changes discard pending events. GA4 script loading times out after 15 seconds. Failed or stale callbacks cannot register an active adapter.

Queued purchase duplicates collapse by provider and transaction ID. The order page marks dispatch only when its callback runs after a successful local adapter call. That callback is not proof of network receipt or conversion attribution. Single-product events now include the GA4 items array. Meta/TikTok registration requires consent and the matching configured ID; their concrete official SDK initialization remains outstanding because usable primary-source contracts were not retrieved in this session.

Post-dispatch purchase deduplication now retains up to 500 provider/ID/transaction keys in memory. Consent regrant or adapter re-registration does not resend those purchases. Reload/cross-device persistence still relies on the order-page marker and is not a server conversion ledger. Six Node tests simulate script completion, error, timeout, consent withdrawal, configuration changes and blocked insertion. They do not execute Google's real script or prove provider receipt.

The latest official documentation requests failed, and explicit network escalation was rejected by the environment policy. Meta/TikTok loaders and mapping must remain unavailable until authoritative contracts can be inspected. No third-party snippet was substituted.

Complete consent/legal review, configure the chosen IDs, verify in provider debug tools, and inspect outgoing requests for PII in staging. No live analytics data has been verified.
