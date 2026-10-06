import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {resolveSiteOrigin,isProductionBuild,LOCAL_SITE_ORIGIN} from '../../shared/site-url.ts';

const P='production';
test('production accepts and normalizes a public https origin',()=>{
  assert.equal(resolveSiteOrigin('https://www.example.com',P),'https://www.example.com');
  assert.equal(resolveSiteOrigin(' https://www.example.com/ ',P),'https://www.example.com');
  assert.ok(isProductionBuild(P));assert.ok(!isProductionBuild('preview'));assert.ok(!isProductionBuild(undefined));
});
test('production rejects a missing value',()=>{for(const v of [undefined,'','   '])assert.throws(()=>resolveSiteOrigin(v,P),/VITE_SITE_URL/)});
test('production rejects non-production or malformed values',()=>{
  for(const v of ['http://localhost:4173','https://localhost','https://app.localhost','http://127.0.0.1:4173','https://127.0.0.1','https://[::1]','https://shop.local','https://a.internal','https://a.test','http://www.example.com','https://www.example.com/shop','https://www.example.com?x=1','https://www.example.com/#a','https://u:p@www.example.com','ftp://www.example.com','not a url'])
    assert.throws(()=>resolveSiteOrigin(v,P),/VITE_SITE_URL/,v);
});
test('local, development and preview keep the localhost fallback',()=>{
  for(const env of [undefined,'development','preview'])assert.equal(resolveSiteOrigin(undefined,env),LOCAL_SITE_ORIGIN);
  assert.equal(LOCAL_SITE_ORIGIN,'http://localhost:4173');
  assert.equal(resolveSiteOrigin('http://localhost:5173',undefined),'http://localhost:5173');
  assert.equal(resolveSiteOrigin('https://www.example.com','preview'),'https://www.example.com');
});
test('non-empty values are validated in every context',()=>{assert.throws(()=>resolveSiteOrigin('https://www.example.com/shop',undefined),/VITE_SITE_URL/)});

// The guard sits above the catalog fetch and any dist access, so these fail fast.
for(const siteUrl of [undefined,'http://localhost:4173'])test(`prerender exits non-zero in production with VITE_SITE_URL=${siteUrl??'(unset)'}`,()=>{
  const env:NodeJS.ProcessEnv={...process.env,VERCEL_ENV:P};delete env.VITE_SUPABASE_URL;delete env.VITE_SITE_URL;if(siteUrl)env.VITE_SITE_URL=siteUrl;
  const r=spawnSync(process.execPath,['--import','tsx','scripts/prerender.tsx'],{env,encoding:'utf8'});
  assert.notEqual(r.status,0);assert.match(r.stderr,/VITE_SITE_URL/);
});
