# Supabase setup

1. Create a separate staging project for THURAYA. Never use CROWNED's database.
2. Install the Supabase CLI using its official instructions. Link the intended staging project and verify its project ID before database writes.
3. Review all migrations, then run `supabase db push`. The local database harness is not a substitute for this live staging check.
4. Execute `supabase/seed.sql` once against an empty staging installation. It contains seven drafts and published starting editorial content, no demo orders/accounts/prices. Do not rerun bootstrap over owner-edited content without reviewing its upserts.
5. Create the owner through Supabase Auth. Using a privileged SQL session, set only that verified user's `profiles.role` to `owner`. User metadata cannot assign a privileged role.
6. Configure Auth redirect URLs for the actual three-language account/password-reset routes. Enable TOTP MFA and enroll the owner through Admin.
7. Deploy `store-api`, `notification-worker` and the fail-closed `payment-webhook`. They have gateway JWT verification disabled because the API supports guests; each privileged action performs its own validated Auth/role/MFA check.
8. Set server secrets with Supabase's secret manager. Set only URL/anon key/site URL in Vite configuration.

Run staging tests for anonymous reads, customer access, each staff role, media upload, atomic order retry, contact mismatch and outbox processing before production. No live staging execution has been performed in the build environment.

## Migrations 0027–0030

Apply in sequence. 0027 safely disables incomplete active shipping zones; review and translate them before reactivation. 0028 enforces case-insensitive coupon identity: if conflicting historical codes exist, resolve them explicitly without deleting redemption/order history, then retry. It never silently merges promotions. 0029 returns incomplete published pages to draft and enforces launch-language completeness. 0030 corrects SQL snapshot variable ambiguity. Local harness applies all 30 migrations; live deployment has not been executed.
