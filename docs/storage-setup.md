# Product media

The migrations create a private `product-media` bucket with a 20 MB limit and a MIME allowlist. Admin obtains a scoped signed upload ticket, uploads bytes, confirms the ticket, and then associates media with a product.

Confirmation checks actor, expiry, byte count, reported MIME and file signature. This is format screening, not a malware scan or full media decoder. PDFs and videos require additional production scanning policy before broad untrusted upload access.

Product/variant foreign keys prevent deleting referenced media. Original THURAYA artwork stays unchanged. `scripts/optimize-media.ts` produces 320/640/1080 WebP derivatives for the supplied images.

Public product and CMS media use the `media-delivery` Edge Function with stable media IDs. The function rechecks current publication/reference eligibility on every request. Staff previews use short-lived signed URLs. Public image delivery accepts only 320, 640 or 1080 widths, defaults to 1080, and requests aspect-ratio-preserving `contain` transformations at quality 90. MediaView supplies srcset/sizes, intrinsic dimensions, lazy loading and high-priority hero loading. Originals remain private and unchanged; transformations must not crop or reconstruct jewelry.

This strategy requires working Supabase Storage image transformations. Verify project plan support in staging. It fails closed rather than silently exposing original full-resolution files when transformations fail. Responses are private/no-store so hiding a review or unpublishing a piece affects subsequent requests; this deliberately trades CDN caching efficiency for revocation. Performance targets remain unmeasured. Videos forward byte ranges; PDFs download as attachments with a restrictive CSP and nosniff.

## Review photos

The review action accepts no arbitrary media URLs. It returns a two-hour capability for a saved pending review. Customers may reserve at most three uploads, each JPEG/PNG/WebP/AVIF and at most 5 MB. The private `review-media` bucket has no direct public access. Server confirmation checks the capability, pending status, reserved MIME/byte count and file signature. Confirmation is idempotent. Approval makes confirmed references eligible for public delivery; hiding/rejecting the review removes that eligibility. Approval also closes further attachment to prevent post-moderation additions. File-format screening is not a full decoder or malware scan.

AR/HE/EN forms report photo failures separately from a successfully saved review. Do not resubmit a review to retry a failed photo. Admin sees private previews for moderation. Existing confirmed review media is retained with its review; no automatic destruction of business history is performed.

## Cleanup

Deploy `media-cleanup` and set server-only `MEDIA_CLEANUP_SECRET`. Schedule an authenticated POST with `Authorization: Bearer <secret>` from a trusted scheduler. Migration 0011 queues expired unreferenced product upload tickets and unconfirmed expired review reservations after 48 hours. Migration 0021 also queues a product object immediately after its detached media record is deleted; the queue refuses paths that still have a relational media reference. Each run processes at most 100 objects; failed deletions stop after five attempts for operational investigation. A foreign key prevents attachment/deletion races. Product, variant and CMS references block deletion. Never manually delete bucket objects that have database references.

Staging must verify actual signed uploads, transformation responses, moderation revocation, byte-range videos, PDF downloads and scheduler authentication. None of those live Storage requests has been executed here.

Migration 0014 maintains private foreign-key references for CMS/category/collection images. Assignment and deletion cannot race past the reference guard. New unknown external image URLs are rejected; select an uploaded media-library entry or bundled local artwork. Known existing references are backfilled. Legacy unmatched external URLs are retained during migration and need owner review before their image field can be saved again.

Migration 0015 resolves public CMS delivery and Admin previews through those relational media IDs. Replacing a media source updates delivery and dimensions without breaking its CMS references; unchanged image fields preserve identity. Disabled sections revoke public delivery unless another eligible public reference exists. Local database tests cover replacement, visibility, expired review capabilities, unconfirmed-photo privacy and draft-product revocation; live Storage behavior still requires staging.

Migration 0022 makes delayed cleanup observable in Admin and prevents a queued object path from being attached to a new media record before cleanup. Staff may requeue only a `needs_attention` job after the database confirms that no live media reference exists; the retry is audited. The cleanup-status API is staff-only and reports paths, attempts and error summaries without granting direct bucket access. Do not clear a queue row manually to reuse an object path.
