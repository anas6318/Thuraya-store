import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {editorialLoop,loopSources} from '../../src/components/EditorialLoop.tsx';
import {initialData,editorialStill,siteMedia} from '../../src/seed.ts';

test('the editorial band is built on the approved midnight frame',()=>{
 const section=initialData(true).sections.find(s=>s.kind==='editorial');
 assert.ok(section);
 assert.equal(section.image,'/media/tennis-bracelet-blue.jpeg');
 const resolved=siteMedia.find(m=>m.src===section.image);
 assert.ok(resolved,'the editorial still must resolve to a real media record');
 assert.equal(resolved.src,editorialStill.src);
 assert.equal(resolved.width,1122);
 assert.equal(resolved.height,1402);
 for(const locale of ['en','ar','he'] as const)assert.ok(resolved.alt[locale]);
});

test('a loop is only offered for the still it was generated from',()=>{
 assert.equal(editorialLoop('/media/tennis-bracelet-blue.jpeg'),'/media/tennis-bracelet-blue-loop');
 assert.equal(editorialLoop('/media/tennis-bracelet-white.jpeg'),undefined);
 assert.equal(editorialLoop('/media/polaris-necklace-blue.jpeg'),undefined);
});

test('the loop ships alongside its poster, in both codecs',()=>{
 assert.ok(existsSync(`public${editorialStill.src}`),'approved still missing');
 const sources=loopSources(editorialLoop(editorialStill.src)!);
 assert.deepEqual(sources.map(s=>s.type),['video/webm','video/mp4']);
 for(const s of sources)assert.ok(existsSync(`public${s.src}`),`${s.src} missing`);
});

test('the loop stays a second layer: still first, video muted, lazy and out of the accessibility tree',()=>{
 const source=readFileSync('src/components/EditorialLoop.tsx','utf8');
 for(const attribute of ['muted','loop','playsInline','preload="none"','aria-hidden="true"','tabIndex={-1}'])
  assert.match(source,new RegExp(attribute.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`${attribute} missing`);
 assert.doesNotMatch(source,/controls/,'the loop must not expose controls');
 assert.doesNotMatch(source,/autoPlay/,'playback is gated in an effect, never by autoplay');
 assert.match(source,/prefers-reduced-motion:reduce/);
 assert.match(source,/min-width:1024px/);
 const markup=readFileSync('src/pages/Storefront.tsx','utf8');
 assert.ok(markup.indexOf('media={still}')<markup.indexOf('<EditorialLoop'),'the photograph renders before the loop');
});
