import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {localeFromPath} from '../../src/document-locale.ts';
import {criticalFaces,fontPreloads} from '../../shared/fonts.ts';

test('the URL decides the locale, including the routes served from the SPA shell',()=>{
 for(const [path,expected] of [
  ['/','en'],['/en','en'],['/en/shop','en'],
  ['/ar','ar'],['/ar/cart','ar'],['/ar/checkout','ar'],['/ar/account/orders','ar'],
  ['/he','he'],['/he/track','he'],['/he/product/demo-nova','he'],
  ['/admin','en'],['/admin/products','en'],['/nonsense','en'],['','en'],
 ] as const) assert.equal(localeFromPath(path),expected,path);
});

test('direction is settled before the first render, not from a React effect',()=>{
 const main=readFileSync('src/main.tsx','utf8');
 assert.match(main,/applyDocumentLocale\(localeFromPath\(window\.location\.pathname\)\)/);
 assert.ok(main.indexOf('applyDocumentLocale(localeFromPath')<main.indexOf('createRoot(document'),'must run before the root renders');
 const store=readFileSync('src/store.tsx','utf8');
 assert.doesNotMatch(store,/documentElement\.dir=/,'the store must go through applyDocumentLocale');
});

test('each locale preloads its own display and text face and nothing else',()=>{
 const assets=['amiri-arabic-400-normal-AAAA.woff2','amiri-arabic-700-normal-BBBB.woff2','ibm-plex-sans-arabic-arabic-400-normal-CCCC.woff2','newsreader-latin-300-normal-DDDD.woff2','ibm-plex-sans-latin-400-normal-EEEE.woff2','frank-ruhl-libre-hebrew-300-normal-FFFF.woff2','ibm-plex-sans-hebrew-hebrew-400-normal-GGGG.woff2'];
 assert.deepEqual(fontPreloads('ar',assets),['/assets/amiri-arabic-400-normal-AAAA.woff2','/assets/ibm-plex-sans-arabic-arabic-400-normal-CCCC.woff2']);
 assert.deepEqual(fontPreloads('he',assets),['/assets/frank-ruhl-libre-hebrew-300-normal-FFFF.woff2','/assets/ibm-plex-sans-hebrew-hebrew-400-normal-GGGG.woff2']);
 assert.deepEqual(fontPreloads('en',assets),['/assets/newsreader-latin-300-normal-DDDD.woff2','/assets/ibm-plex-sans-latin-400-normal-EEEE.woff2']);
 for(const locale of ['ar','he','en'] as const)assert.equal(criticalFaces[locale].length,2,'two faces per locale, no more');
});

test('a renamed font artifact breaks the build instead of silently dropping the hint',()=>{
 assert.throws(()=>fontPreloads('ar',['amiri-arabic-400-normal-AAAA.woff']),/no built woff2/);
 assert.throws(()=>fontPreloads('he',[]),/no built woff2/);
});

test('the premium display faces are kept: no system-font substitution, no font-display override',()=>{
 const css=readFileSync('src/styles/storefront.css','utf8');
 assert.match(css,/html\[lang=ar\]\{--display:'Amiri'/);
 assert.match(css,/html\[lang=he\]\{--display:'Frank Ruhl Libre'/);
 assert.match(css,/--display:'Newsreader'/);
 assert.doesNotMatch(css,/font-display\s*:\s*(optional|block)/,'no FOIT and no silent downgrade to the fallback');
});
