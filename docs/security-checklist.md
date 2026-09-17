# Security gate

- [x] Private supplier/business tables separated from public products.
- [x] RLS enabled and anonymous mutations denied in local SQL harness.
- [x] Server recomputation, inventory locking and request idempotency.
- [x] Server Auth/role checks and MFA assurance-level enforcement.
- [x] Contact-protected guest tracking and positive order projection.
- [x] Upload MIME/size/extension and magic-byte validation.
- [x] Unconfigured payment callbacks fail closed.
- [ ] Live Supabase Auth/RLS/Storage tests for every role.
- [x] Reference-safe orphan cleanup queue and CMS/media deletion protection in local SQL tests.
- [x] Private review uploads, bounded reservations and approved-only media projection in local SQL tests.
- [x] Explicit public settings projection and strict settings input contract.
- [ ] Full upload decoder/malware policy and live Storage integration verification.
- [ ] Provider signatures, payment/refund reconciliation and callback tests.
- [x] Optional Turnstile widget and server verification integration; empty credentials leave it disabled.
- [ ] Production rate-limit trust review: verify the gateway replaces untrusted forwarded-IP headers.
- [x] Code-level analytics consent/PII allowlist tests and private-route header configuration.
- [x] Server-owned customer profile/address mutations, ownership checks and atomic default-address promotion in local SQL tests.
- [x] Explicit marketing/optional-channel preference persistence; transactional email is not silently suppressed by an optional preference.
- [x] Account removal preserves required order/audit history locally while unlinking the customer relationship.
- [x] Supplier references and internal order notes are owner/admin-only; order managers receive only fulfilment controls.
- [ ] Verify actual deployed headers, third-party requests and logs for PII.
- [ ] Dependency audit, secret scan, backup/restore rehearsal and external security review.

No checkmark here implies penetration testing or live infrastructure verification.
