import type {Locale} from './domain.ts';
/**
 * The two faces every page of a locale needs before first paint: the display
 * face that sets the headline, and the text face that sets everything else.
 *
 * Both are self-hosted and already declared in the bundled CSS, so preloading
 * them does not add a request — it only starts the one that was going to happen
 * anyway before the stylesheet has been parsed. That closes the window in which
 * a headline is drawn in a system fallback and then re-drawn, which is what the
 * Arabic and Hebrew display faces were being caught by. Heavier weights, italics
 * and the second-language faces stay unpreloaded: they are not above the fold.
 */
export const criticalFaces:Record<Locale,readonly string[]>={
 en:['newsreader-latin-300-normal','ibm-plex-sans-latin-400-normal'],
 ar:['amiri-arabic-400-normal','ibm-plex-sans-arabic-arabic-400-normal'],
 he:['frank-ruhl-libre-hebrew-300-normal','ibm-plex-sans-hebrew-hebrew-400-normal'],
};
/** Resolve each critical face to its hashed build artifact; a rename must break the build, not silently drop the hint. */
export function fontPreloads(locale:Locale,assets:readonly string[]):string[]{
 return criticalFaces[locale].map(face=>{
  const file=assets.find(a=>a.startsWith(`${face}-`)&&a.endsWith('.woff2'));
  if(!file)throw new Error(`Cannot prerender: no built woff2 for "${face}". Update shared/fonts.ts if the font package changed.`);
  return `/assets/${file}`;
 });
}
