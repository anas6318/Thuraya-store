import type {Media} from './domain.ts';
/**
 * THURAYA ecommerce media roles.
 *
 * Approved product photography ships as a pair per piece: a midnight ("blue")
 * frame that carries the brand while customers browse, and a pearl ("white")
 * frame for clean inspection on the product page. The pair is identified by the
 * file name only — this is presentation, not product data, so no schema,
 * validation or storage contract changes.
 *
 * Anything that does not follow the convention keeps the previous behaviour:
 * the stored media order wins.
 */
const role=(m:Media,name:'blue'|'white')=>m.kind==='image'&&new RegExp(`-${name}(?:-\\d+)?\\.[a-z0-9]+$`,'i').test(m.src);
export const isBrandMedia=(m:Media)=>role(m,'blue');
export const isPlainMedia=(m:Media)=>role(m,'white');
/** Card, catalog and home strip: the midnight frame first, the pearl frame revealed on hover. */
export function browseMedia(media:readonly Media[]):{primary?:Media;alternate?:Media}{
 const images=media.filter(m=>m.kind==='image');
 const blue=images.find(isBrandMedia);const white=images.find(isPlainMedia);
 if(blue&&white)return {primary:blue,alternate:white};
 return {primary:images[0],alternate:images[1]};
}
/** Product page gallery: the pearl frame is the main inspection image, the midnight frame second. */
export function galleryMedia(media:readonly Media[]):Media[]{
 const white=media.find(isPlainMedia);const blue=media.find(isBrandMedia);
 if(!white||!blue)return [...media];
 return [white,blue,...media.filter(m=>m!==white&&m!==blue)];
}
