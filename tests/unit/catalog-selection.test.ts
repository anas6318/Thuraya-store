import test from 'node:test';
import assert from 'node:assert/strict';
import {shopProducts,sectionProducts,homeProductIds} from '../../shared/catalog-selection.ts';
import {initialData} from '../../src/seed.ts';
const data=initialData(true);const sample=data.products.find(p=>p.isDemo)!;
const products=Array.from({length:6},(_,i)=>({...sample,id:'item-'+i,featured:true,categoryId:i%2?'rings':'necklaces',basePrice:10000+i*1000,collectionIds:i<3?['selected']:[]}));
const section={...data.sections.find(s=>s.kind==='collections')!,enabled:true,selection:[]};
test('unknown collection never falls back to the full catalog',()=>{
 assert.deepEqual(shopProducts(products,new URLSearchParams(),null),[]);
});
test('shop rendering and analytics share category and collection selection',()=>{
 assert.deepEqual(shopProducts(products,new URLSearchParams('category=rings'),'selected').map(p=>p.id),['item-1']);
});
test('shop sorting and price ranges preserve source catalog order',()=>{
 assert.deepEqual(shopProducts(products,new URLSearchParams('min=120&max=140&sort=high')).map(p=>p.id),['item-4','item-3','item-2']);assert.equal(products[0].id,'item-0');
});
test('wishlist and zero-result selection never report unrelated products',()=>{
 assert.deepEqual(shopProducts(products,new URLSearchParams(),undefined,[]),[]);
 assert.deepEqual(shopProducts(products,new URLSearchParams('category=absent')),[]);
});
test('home product IDs follow enabled curated sections and four-card limits',()=>{
 assert.equal(sectionProducts(products,section).length,4);
 assert.deepEqual(homeProductIds(products,[{...section,enabled:false}]),[]);
 assert.deepEqual(homeProductIds(products,[{...section,selection:['item-5']},{...section,selection:['item-5','item-1']}]),['item-5','item-1']);
});
