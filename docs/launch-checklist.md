# Launch checklist — NOT READY

- [ ] Complete remaining implementation gaps in WORK_PROGRESS and setup docs.
- [ ] Pass full E2E suite and AR/HE/EN mobile/tablet/desktop visual audit.
- [ ] Validate production build/artifacts and actual-host deep-route refresh.
- [ ] Complete live staging Auth/RLS/Storage/Edge tests and security review.
- [ ] Confirm uploaded-media persistence, transformations and review-photo workflow.
- [ ] Finish required merchant adapters or explicitly choose a bank-transfer-only launch.
- [ ] Verify actual receipt/refund workflows and notification scheduling/retries.
- [ ] Approve product identities, factual specifications, prices, translations and shipping.
- [ ] Approve legal policies and consent behavior.
- [ ] Configure domain, HTTPS, secrets, owner MFA, monitoring and backups.
- [ ] Measure performance and accessibility; record real results.
- [ ] Place and reconcile a real controlled order only with explicit owner approval.

Never describe this checklist as complete merely because external credentials are absent. Several implementation and verification tasks remain.

Latest operational audit: see `master-prompt-parity.md` for A–F classification. Next is the dedicated storefront design pass, then actual browser and live-service verification. 301 unit / 55 local DB / 38 artifact checks do not authorize a production-readiness claim. Complete migration preflight for duplicate case-insensitive coupons and incomplete shipping/page translations.
