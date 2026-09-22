import type {Locale} from '../shared/domain';
/** The locale a URL belongs to: the first path segment is the contract, anything else is English. */
export const localeFromPath=(pathname:string):Locale=>{const segment=pathname.split('/')[1];return segment==='ar'||segment==='he'?segment:'en'};
/**
 * Direction and language are document state, not React state.
 *
 * The prerendered pages already carry both on <html>, but every route rewritten
 * to the SPA shell — cart, checkout, account, tracking, wishlist, review,
 * concierge, admin — begins life as that shell, which is English and LTR. When
 * the locale was only applied from a React effect, an Arabic or Hebrew visitor
 * got an LTR first paint that flipped a full header width once React resolved
 * the route. Settling it from the URL before the first render removes the flip
 * rather than hiding it.
 */
export function applyDocumentLocale(locale:Locale):void{
 if(typeof document==='undefined')return;
 const root=document.documentElement;const dir=locale==='en'?'ltr':'rtl';
 if(root.lang!==locale)root.lang=locale;
 if(root.dir!==dir)root.dir=dir;
}
