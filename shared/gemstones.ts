import type {Locale,Product} from './domain.ts';
export const gemstoneTypes=['moissanite','lab_grown_diamond'] as const;
export function gemstoneKey(value:string){const key=value.trim().toLowerCase().replace(/[\s-]+/g,'_');return ['lab_diamond','lab_grown_diamonds'].includes(key)?'lab_grown_diamond':key}
const names={moissanite:{en:'Moissanite',ar:'مويسانيت',he:'מויסנייט'},lab_grown_diamond:{en:'Lab-Grown Diamond',ar:'ألماس مزروع مخبريًا',he:'יהלום מעבדה'}};
export function gemstoneLabel(value:string,locale:Locale){return names[gemstoneKey(value) as keyof typeof names]?.[locale]||value}
/** Only configured, active variant stone types enter public filtering. */
export function productGemstones(p:Product){return [...new Set((p.variants.length?p.variants.filter(v=>v.active).map(v=>v.gem.type||p.gem.type):[p.gem.type]).filter((x):x is string=>!!x).map(gemstoneKey))]}
