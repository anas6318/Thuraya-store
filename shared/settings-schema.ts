import {z} from 'zod';
import {states,type Settings} from './domain.ts';
const localized=z.object({ar:z.string().max(20000),he:z.string().max(20000),en:z.string().max(20000)}).strict();
const id=z.string().min(1).max(100);
export const settingsSchema=z.object({
 currency:z.literal('ILS'),siteUrl:z.string().url().or(z.literal('')),contactEmail:z.string().email().or(z.literal('')),whatsapp:z.string().regex(/^(?:\+[1-9]\d{7,14})?$/),instagram:z.string().max(100),
 leadMin:z.number().int().min(0).max(365),leadMax:z.number().int().min(0).max(365),internationalMode:z.enum(['disabled','waitlist','enabled']),maintenance:z.boolean(),checkoutEnabled:z.boolean(),giftNote:z.boolean(),freeShippingThreshold:z.number().int().nonnegative().nullable(),emailEnabled:z.boolean(),whatsappEnabled:z.boolean(),requireMfa:z.boolean(),
 announcement:localized,story:localized,packaging:localized,included:localized,
 paymentMethods:z.array(z.object({id:z.enum(['bank_transfer','paypal','card','bit','paybox']),enabled:z.boolean(),ready:z.boolean(),test:z.boolean(),instructions:localized}).strict()).max(5),
 templates:z.array(z.object({id,status:z.enum(states),channel:z.enum(['email','whatsapp']),enabled:z.boolean(),subject:localized,body:localized,providerTemplate:localized}).strict()).max(100),
 analytics:z.object({ga4:z.string().max(100),meta:z.string().max(100),tiktok:z.string().max(100)}).strict(),statusLabels:z.record(z.enum(states),localized)
}).strict().superRefine((s,c)=>{
 const issue=(message:string)=>c.addIssue({code:'custom',message});
 for(const field of ['announcement','story','packaging','included'] as const){const values=Object.values(s[field]);if(values.some(v=>v.trim())&&values.some(v=>!v.trim()))issue(`Incomplete ${field} translations`)}
 for(const label of Object.values(s.statusLabels))if(Object.values(label).some(v=>!v.trim()))issue('Incomplete status label translations');
 if(s.leadMax<s.leadMin)issue('Invalid delivery range');
 if(states.some(state=>!s.statusLabels[state]))issue('Missing status label');
 if(new Set(s.paymentMethods.map(m=>m.id)).size!==s.paymentMethods.length)issue('Duplicate payment method');
 if(new Set(s.templates.map(t=>t.id)).size!==s.templates.length||new Set(s.templates.map(t=>t.status+':'+t.channel)).size!==s.templates.length)issue('Duplicate template mapping');
 for(const t of s.templates)if(t.enabled&&(['ar','he','en'] as const).some(l=>!t.body[l].trim()||(t.channel==='email'?!t.subject[l].trim():s.whatsappEnabled&&!t.providerTemplate[l].trim())))issue('Incomplete enabled template translation');
}).transform(s=>s as Settings); // superRefine verifies every status key before this narrowing.
