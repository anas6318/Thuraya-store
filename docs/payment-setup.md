# Payments

No provider is simulated as successful. Only bank transfer has an implemented operational path: configure truthful AR/HE/EN instructions, set `BANK_TRANSFER_ACCOUNT_CONFIRMED` server-side, enable the method and checkout, then verify actual receipt before confirming payment in Admin.

Card, Bit, PayBox and PayPal are disabled even when toggled because their adapters are not implemented. Adding credentials alone does not complete these integrations. The empty adapter registry makes their webhook return 503 before processing a body; it makes no order changes.

Each future adapter must implement creation, redirect/hosted checkout, provider-specific signature verification, exact currency/amount/order matching, provider event idempotency, refunds and sandbox reconciliation. Only then may server readiness expose it to customers. Never store card details in THURAYA.

Manual refund status means the owner has actually issued the refund externally; it is not a request that transfers funds. Live merchant approval and tests are outstanding.

## Implemented provider-independent boundary

`shared/payments.ts` requires an adapter to authenticate original callback bytes before returning a strict normalized event. The Edge endpoint bounds bodies to 256 KiB and 15 seconds, rejects unverified callbacks, and returns 503 rather than acknowledging an uncommitted database result. It does not implement any merchant's signature algorithm.

Migration 0016 locks the order, matches method/ILS/full order amount, rejects conflicting reuse of provider event IDs, and makes exact duplicates idempotent. Full-refund confirmation requires a paid order. Late events cannot revive a refunded payment. Partial refunds are deliberately rejected; there is no partial-refund ledger or automated refund request yet. Database checks exercise normalized events directly, not live merchant callbacks.

For **each** of Card, Bit, PayBox and PayPal, launch still requires an authoritative merchant contract, hosted payment creation, authenticated callback adapter, test/live credential readiness, failure/cancellation UX, refund execution and settlement reconciliation. Admin readiness must stay false until these are implemented and tested. The callback interface alone is not a complete payment provider.
