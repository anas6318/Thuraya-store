# Performance report

No Lighthouse or field Core Web Vitals scores have been measured. LCP <2.5s, CLS <0.1 and INP <200ms remain targets, not results.

Implemented: fixed image dimensions, supplied-art WebP derivatives at 320/640/1080px, lazy nonhero media, self-hosted fonts, separate admin/React/Supabase/validation chunks, immutable asset caching configuration, reduced-motion handling.

Remaining: uploaded-image transformations, full three-language mobile audit, production network measurements, font/subset tuning and verification of actual cache headers. Do not infer performance scores from bundle size alone.
