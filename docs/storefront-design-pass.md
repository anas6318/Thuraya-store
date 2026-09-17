# White-dominant storefront and dual gemstone support

Implemented 2026-09-17 on the existing THURAYA application. This is an implemented source checkpoint; browser visual approval remains outstanding.

## Product support

The existing Gem model already has type, carat, carat-equivalent, total weight, cut grade, shape, color, clarity, certification type/inclusion/reference, and per-variant overrides. No schema rebuild or migration was needed. Admin now offers `moissanite` and `lab_grown_diamond` suggestions for products and variants while preserving custom stone types. Known legacy spellings normalize for search/filter identity. Customer labels are Arabic, Hebrew and English. Catalog filters include configured active-variant stone types, rather than checking only the base product.

All facts remain explicit owner inputs. Existing product-default/variant-override inheritance is preserved: inspect inherited grades and certification when configuring a different stone variant. No diamond prices, grades, certifications or products were seeded into the production catalog. A database regression persists both base diamond attributes and a variant override within a rolled-back test transaction.

## Visual implementation

`src/styles/storefront.css` supplies pearl-white and soft-ivory surfaces, restrained navy typography/actions, more space around collections and product grids, a light hero copy area alongside untouched navy product artwork, one dark editorial section and a dark footer. The latest white-dominant direction supersedes the earlier full-width dark hero treatment. Arabic/Hebrew use their existing script typography and logical layout properties; the THURAYA logo is unchanged.

All nine supplied source images were inspected in a local contact sheet from `public/media`. Notably, the file called Polaris pendant depicts studs; the original artwork is kept, not reinterpreted from its filename. No image was regenerated, recolored or stretched. Product artwork keeps its 4:5 geometry. Desktop/mobile rules cover the existing catalog, product, cart and checkout surfaces without replacing their behavior or Admin styling.

The existing enabled education section now exposes its published Moissanite and Lab-Grown Diamonds journal entries using CMS titles/body. Draft/unpublished entries remain excluded. This is education, not a claim of available diamond inventory.

## Native motion

- One-time, below-fold section reveals use IntersectionObserver and Web Animations.
- Content is visible without JavaScript; there is no hidden-content prerequisite.
- Reduced-motion changes cancel active reveal work and disable CSS animation/transitions.
- Product hover, gallery image changes and dialog opening use small native transitions.
- No scroll polling, animation library, forced parallax or autoplay video was added.

Higgsfield was evaluated as an optional asset source. No generation job was submitted and no generated loop is shipped. Native movement meets this phase's interaction requirement while preserving supplied jewelry accuracy. Future approved visual loops can use the existing MP4 media pipeline; they must be reviewed for unchanged geometry and given a static fallback before adoption. UI motion remains frontend code.

## Verification and remaining work

PASSED: 307 unit tests; 30 migration loads; 56 local database checks; strict TypeScript; lint; six Edge checks; production build, 33 localized pages, 38 artifact checks; six HTTP-200 preview smoke paths.

The first isolated preview probe returned connection refused. Running preview and probes in one managed process succeeded for `/en`, `/ar`, `/he`, `/en/journal/lab-grown-diamonds`, `/ar/shop`, `/he/checkout`. This checks HTTP serving only, not browser behavior.

BLOCKED / NOT EXECUTED: browser E2E, actual screenshot review at AR/HE/EN × 390/430/820/1440, browser accessibility and motion inspection, Lighthouse/performance. One local executable/cache search found no Chromium; no download was retried. CSS responsiveness is implemented, not visually certified. Live services and unsupported provider contracts remain unchanged.

Next: obtain a usable browser, execute the full E2E suite and visual matrix, inspect screenshots and fix verified issues. Do not call the site production-ready based on source or HTTP tests.
