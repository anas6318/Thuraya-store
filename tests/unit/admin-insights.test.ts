import test from 'node:test';
import assert from 'node:assert/strict';
import {adminInsights} from '../../shared/admin-insights.ts';
import {initialData} from '../../src/seed.ts';

const data=initialData(true);const [first,second]=data.products.filter(product=>product.isDemo);
const line=(product=first,quantity=1,price=38000)=>({productId:product.id,variantId:product.variants[0].id,sku:'SKU',name:product.name,image:'',options:[],gem:{},metal:{},measurements:{},quantity,unitPrice:price,lineTotal:price*quantity});
const order=(status:'paid'|'pending'|'refunded',items=[line()])=>({id:crypto.randomUUID(),number:'TH-TEST',customerId:null,locale:'en' as const,status:'payment_pending' as const,paymentStatus:status,paymentMethod:'bank_transfer' as const,items,subtotal:0,discount:0,shipping:0,total:0,createdAt:new Date().toISOString(),etaMin:10,etaMax:14,events:[],safeTrackingUrl:null,isDemo:false,customer:{firstName:'',lastName:'',email:'',phone:'',city:'',street:'',postalCode:'',country:'IL',notes:'',giftNote:'',marketingConsent:false,locale:'en' as const,whatsappUpdates:false,zoneId:'',paymentMethod:'bank_transfer' as const,discountCode:''},internalNotes:'',supplierReference:''});

test('admin insights include paid order lines only',()=>{const insights=adminInsights(data.products,data.collections,[order('paid',[line(first,2),line(second,1,49000)]),order('pending',[line(first,9)]),order('refunded',[line(second,8)])]);assert.deepEqual(insights.topProducts.map(row=>[row.id,row.units,row.revenue]),[[first.id,2,76000],[second.id,1,49000]])});
test('admin collection insight is a truthful paid-piece count',()=>{const insights=adminInsights(data.products,data.collections,[order('paid',[line(first,3)])]);assert.deepEqual(insights.topCollections,[{id:'celestial',name:'Celestial signatures',units:3}])});
test('admin insights keep deterministic bounds and ties',()=>{const insights=adminInsights(data.products,data.collections,[order('paid',[line(first,1),line(second,1,49000)])],1);assert.equal(insights.topProducts.length,1);assert.equal(insights.topCollections.length,1)});
