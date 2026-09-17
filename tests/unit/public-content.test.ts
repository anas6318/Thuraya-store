import test from 'node:test';
import assert from 'node:assert/strict';
import {initialData} from '../../src/seed';
import {customerCatalog} from '../../shared/public-data';
import {contentAt,publicCopy} from '../../shared/public-content';
import {settingsSchema} from '../../shared/settings-schema';
import type {ContentPage} from '../../shared/domain';
const copy={ar:'عربي',he:'עברית',en:'English'};
const page:ContentPage={id:'article',slug:'article',kind:'education',title:copy,body:copy,status:'published',legalReviewed:false};
test('public CMS strips unpublished, incomplete and unknown metadata',()=>{const d=initialData();d.pages=[{...page,...{internalNote:'private'}},{...page,id:'draft',status:'draft'},{...page,id:'partial',body:{...copy,he:''}},{...page,id:'legal',kind:'policy',legalReviewed:false}];const result=customerCatalog(d);assert.equal(result.pages.length,1);assert.equal(JSON.stringify(result.pages).includes('private'),false)});
test('public CMS excludes disabled sections, inactive zones and taxonomies',()=>{const d=initialData();d.sections=d.sections.map(s=>({...s,enabled:false}));d.categories=d.categories.map(c=>({...c,active:false}));d.zones=d.zones.map(z=>({...z,active:false}));const result=customerCatalog(d);assert.deepEqual(result.sections,[]);assert.deepEqual(result.categories,[]);assert.deepEqual(result.zones,[])});
test('content routes cannot expose education articles as legal policies',()=>{assert.equal(contentAt([page],'article','/en/policies/article'),undefined);assert.equal(contentAt([page],'article','/he/journal/article'),page)});
test('partial optional settings are withheld and rejected when saved',()=>{assert.deepEqual(publicCopy({...copy,he:''}),{ar:'',he:'',en:''});const settings=initialData().settings;assert.equal(settingsSchema.safeParse({...settings,story:{...copy,he:''}}).success,false);assert.equal(settingsSchema.safeParse({...settings,story:{ar:'',he:'',en:''}}).success,true)});

test('FAQ detail stays crawlable while unpublished curated IDs are removed',()=>{const faq={...page,kind:'faq' as const};assert.equal(contentAt([faq],'article','/ar/journal/article'),faq);const d=initialData();d.sections[0].selection=['private-draft-id'];assert.deepEqual(customerCatalog(d).sections[0].selection,[])});
