import {publicContent,publicCopy} from './public-content.ts';
import type {Catalog} from './domain.ts';
/** Positive allowlist: never spread database rows into customer-facing review data. */
export function customerCatalog(d:Catalog):Catalog{return {
  products:d.products,...publicContent(d),
  settings:{currency:d.settings.currency,siteUrl:d.settings.siteUrl,contactEmail:d.settings.contactEmail,whatsapp:d.settings.whatsapp,instagram:d.settings.instagram,leadMin:d.settings.leadMin,leadMax:d.settings.leadMax,internationalMode:d.settings.internationalMode,maintenance:d.settings.maintenance,checkoutEnabled:d.settings.checkoutEnabled,giftNote:d.settings.giftNote,freeShippingThreshold:d.settings.freeShippingThreshold,emailEnabled:d.settings.emailEnabled,whatsappEnabled:d.settings.whatsappEnabled,requireMfa:d.settings.requireMfa,announcement:publicCopy(d.settings.announcement),story:publicCopy(d.settings.story),packaging:publicCopy(d.settings.packaging),included:publicCopy(d.settings.included),paymentMethods:d.settings.paymentMethods,analytics:d.settings.analytics,statusLabels:d.settings.statusLabels,templates:[]},
  reviews:d.reviews.filter(r=>r.status==='approved').map(r=>({id:r.id,productId:r.productId,customerId:null,name:r.name,rating:r.rating,text:r.text,media:r.media,verified:r.verified,status:r.status,createdAt:r.createdAt}))
}}
