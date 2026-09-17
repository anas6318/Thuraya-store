export const locales = ['ar','he','en'] as const;
export type Locale = typeof locales[number];
export type Localized = Record<Locale,string>;
export type Role = 'customer'|'owner'|'admin'|'order_manager'|'content_manager';
export const states = ['order_received','payment_pending','payment_confirmed','in_production','quality_check','ready_to_ship','shipped','delivered','cancelled','refunded'] as const;
export type OrderStatus = typeof states[number];
export interface Gem {type?:string;shape?:string;sizeMm?:number;carat?:number;caratEquivalent?:number;totalCaratWeight?:number;count?:number;color?:string;clarity?:string;cutGrade?:string;certificationType?:string;certificationIncluded?:boolean;certificateReference?:string}
export interface Metal {metal?:string;purity?:string;finish?:string;plating?:string;color?:string}
export interface Measurements {widthMm?:number;thicknessMm?:number;chainWidthMm?:number;stoneDiameterMm?:number;necklaceLengthCm?:number;braceletLengthCm?:number;ringSize?:string;earringDimensions?:string;weightGrams?:number;clasp?:string;setting?:string}
export interface OptionValue {id:string;label:Localized;numericValue?:number}
export interface OptionAxis {id:string;kind:'metal_color'|'stone_size'|'shape'|'necklace_length'|'bracelet_length'|'ring_size'|'quantity_type'|'gemstone';label:Localized;values:OptionValue[]}
export interface Variant {id:string;sku:string;options:Record<string,string>;adjustment:number;active:boolean;stock:number|null;gem:Gem;metal:Metal;measurements:Measurements;mediaIds:string[]}
export interface Media {id:string;src:string;alt:Localized;kind:'image'|'video'|'certificate';width:number;height:number;position:number;mime:string;bytes?:number;storagePath?:string;variantId?:string}
export interface Product {id:string;sku:string;slug:string;status:'draft'|'published'|'archived';name:Localized;shortDescription:Localized;description:Localized;seoTitle:Localized;seoDescription:Localized;categoryId:string;collectionIds:string[];tags:string[];featured:boolean;bestseller:boolean;newArrival:boolean;publishAt:string|null;basePrice:number|null;compareAtPrice:number|null;gem:Gem;metal:Metal;measurements:Measurements;axes:OptionAxis[];variants:Variant[];media:Media[];madeToOrder:boolean;leadMin:number|null;leadMax:number|null;customization:boolean;shippingCountries:string[];included:Localized;care:Localized;isDemo:boolean;createdAt:string}
export interface PrivateProduct {productId:string;supplierSku:string;supplierReference:string;cost:number|null;notes:string}
export interface Taxonomy {imageMedia?:Media;id:string;slug:string;name:Localized;description:Localized;image:string;position:number;active:boolean}
export interface Section {imageMedia?:Media;id:string;kind:'hero'|'collections'|'categories'|'standard'|'editorial'|'education'|'journey'|'story'|'packaging';enabled:boolean;position:number;title:Localized;body:Localized;cta:Localized;href:string;image:string;selection:string[];layout:'split'|'full'|'grid'}
export interface ShippingZone {id:string;name:Localized;country:string;cities:string[];price:number;etaMin:number;etaMax:number;active:boolean}
export interface PaymentMethod {id:'bank_transfer'|'paypal'|'card'|'bit'|'paybox';enabled:boolean;ready:boolean;test:boolean;instructions:Localized}
export interface NotificationTemplate {id:string;status:OrderStatus;channel:'email'|'whatsapp';enabled:boolean;subject:Localized;body:Localized;providerTemplate:Localized}
export interface Settings {currency:'ILS';siteUrl:string;contactEmail:string;whatsapp:string;instagram:string;leadMin:number;leadMax:number;internationalMode:'disabled'|'waitlist'|'enabled';maintenance:boolean;checkoutEnabled:boolean;giftNote:boolean;freeShippingThreshold:number|null;emailEnabled:boolean;whatsappEnabled:boolean;requireMfa:boolean;announcement:Localized;story:Localized;packaging:Localized;included:Localized;paymentMethods:PaymentMethod[];templates:NotificationTemplate[];analytics:{ga4:string;meta:string;tiktok:string};statusLabels:Record<OrderStatus,Localized>}
export interface CartLine {productId:string;variantId:string;quantity:number}
export interface Customer {id:string;email:string;name:string;phone:string;role:Role;locale:Locale;emailUpdates:boolean;whatsappUpdates:boolean;marketingConsent:boolean}
export interface Address {id:string;customerId:string;firstName:string;lastName:string;phone:string;city:string;street:string;postalCode:string;country:string;isDefault:boolean}
export interface CheckoutInput {idempotencyKey:string;locale:Locale;firstName:string;lastName:string;email:string;phone:string;city:string;street:string;postalCode:string;country:string;notes:string;giftNote:string;marketingConsent:boolean;whatsappUpdates:boolean;zoneId:string;paymentMethod:PaymentMethod['id'];discountCode:string;lines:CartLine[];turnstileToken?:string}
export interface OrderItem {productId:string;variantId:string;sku:string;name:Localized;image:string;options:Localized[];gem:Gem;metal:Metal;measurements:Measurements;quantity:number;unitPrice:number;lineTotal:number}
export interface OrderEvent {id:string;status:OrderStatus;at:string}
export interface Order {id:string;number:string;customerId:string|null;locale:Locale;status:OrderStatus;paymentStatus:'pending'|'paid'|'refunded';paymentMethod:string;items:OrderItem[];subtotal:number;discount:number;shipping:number;total:number;createdAt:string;etaMin:number;etaMax:number;events:OrderEvent[];safeTrackingUrl:string|null;isDemo:boolean}
export interface AdminOrder extends Order {customer:Omit<CheckoutInput,'lines'|'idempotencyKey'|'turnstileToken'>;internalNotes:string;supplierReference:string}
export interface Notification {id:string;receiptState?:string;receiptAt?:string;receiptAlert?:string|null;acceptanceEvidence?:'operator_attestation';acceptanceAt?:string;uncertain?:boolean;firstAttemptAt?:string|null;eventId:string;orderId:string;channel:'email'|'whatsapp';audience:'owner'|'customer';templateId:string;locale:Locale;status:'pending'|'sent'|'failed'|'disabled';attempts:number;providerId:string|null;sentAt:string|null;error:string|null;nextAttemptAt:string|null}
export interface MediaCleanupJob {bucket:'product-media'|'review-media';path:string;attempts:number;lastError:string|null;createdAt:string;state:'queued'|'retrying'|'needs_attention'}
export interface Review {id:string;productId:string;customerId:string|null;name:string;rating:number|null;text:string;media:string[];verified:boolean;status:'pending'|'approved'|'rejected'|'hidden';createdAt:string}
export interface Inquiry {id:string;productId:string|null;name:string;email:string;phone:string;message:string;locale:Locale;status:'open'|'contacted'|'quoted'|'converted'|'closed';createdAt:string}
export interface Discount {id:string;code:string;kind:'percentage'|'fixed';value:number;active:boolean;startsAt:string|null;endsAt:string|null;usageLimit:number|null;used:number;minimumSubtotal:number;productIds:string[];collectionIds:string[]}
export interface ContentPage {id:string;slug:string;kind:'faq'|'education'|'policy';title:Localized;body:Localized;status:'draft'|'published';legalReviewed:boolean}
export interface Audit {id:string;actor:string;action:string;target:string;at:string;summary:string}
export interface Catalog {products:Product[];categories:Taxonomy[];collections:Taxonomy[];sections:Section[];settings:Settings;zones:ShippingZone[];pages:ContentPage[];reviews:Review[]}
export interface AdminData extends Catalog {privateProducts:PrivateProduct[];orders:AdminOrder[];customers:Customer[];inquiries:Inquiry[];discounts:Discount[];notifications:Notification[];audit:Audit[];media:Media[]}
export const localized=(en:string,ar:string,he:string):Localized=>({en,ar,he});
export const emptyLocalized=():Localized=>({ar:'',he:'',en:''});
