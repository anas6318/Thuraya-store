import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {criticalFaces,fontPreloads} from '../shared/fonts.ts';
import {resolveSiteOrigin,isProductionBuild} from '../shared/site-url.ts';
const builtAssets=await readdir('dist/assets');
let checks=0;
for(const locale of ['ar','he','en']){
  const html=await readFile(`dist/${locale}/index.html`,'utf8');
  for(const expected of [`lang="${locale}"`,`dir="${locale==='en'?'ltr':'rtl'}"`,'rel="canonical"','hreflang="ar"','hreflang="he"','hreflang="en"','application/ld+json','<h1']){assert.ok(html.includes(expected),`${locale}: ${expected}`);checks++}
  const article=await readFile(`dist/${locale}/journal/moissanite/index.html`,'utf8');assert.ok(article.includes('<h1'));checks++;
  // Every page preloads its own two critical faces, and only those: the display
  // face that sets the headline and the text face that sets everything else.
  const preloads=[...html.matchAll(/<link rel="preload" as="font"[^>]*href="([^"]+)"[^>]*>/g)].map(m=>m[1]);
  assert.deepEqual(preloads,fontPreloads(locale as 'ar'|'he'|'en',builtAssets),`${locale}: font preloads`);checks++;
  for(const href of preloads){await stat(`dist${href}`);assert.ok(html.includes(`href="${href}" crossorigin`),`${locale}: ${href} must be preloaded with crossorigin`);checks++}
  for(const other of (['ar','he','en'] as const).filter(l=>l!==locale))
    for(const face of criticalFaces[other])assert.ok(!preloads.some(h=>h.includes(face)),`${locale} must not preload ${face}`);
  checks++;
}
const sitemap=await readFile('dist/sitemap.xml','utf8');for(const privateRoute of ['/admin','/checkout','/cart','/account','/order/']){assert.ok(!sitemap.includes(privateRoute));checks++}
for(const file of await readdir('dist/assets'))if(file.endsWith('.js')){const s=await readFile(`dist/assets/${file}`,'utf8');assert.ok(!s.includes('ThurayaDemo!2026')&&!s.includes('owner@thuraya.test'),`Demo credentials in ${file}`);checks++}
assert.ok((await readFile('dist/robots.txt','utf8')).includes('Sitemap:'));checks++;
// Site-origin contract: every SEO URL starts with the origin prerender resolved, and a production artifact carries no local host.
const origin=resolveSiteOrigin(process.env.VITE_SITE_URL,process.env.VERCEL_ENV);
const walk=async(dir:string):Promise<string[]>=>(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]))).flat();
const distFiles=await walk('dist');
const onOrigin=(url:string,where:string)=>{assert.ok(url===origin||url.startsWith(`${origin}/`),`${where}: ${url} must start with ${origin}`);checks++};
let seoUrls=0;
for(const file of distFiles.filter(f=>f.endsWith('/index.html')&&!f.startsWith('dist/assets/'))){const html=await readFile(file,'utf8');for(const m of html.matchAll(/<link rel="(?:canonical|alternate)"[^>]*href="([^"]+)"|<meta property="og:url" content="([^"]+)"/g)){onOrigin(m[1]??m[2],file);seoUrls++}}
assert.ok(seoUrls>0,'no canonical/hreflang/og:url URLs found');checks++;
for(const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>|<xhtml:link [^>]*href="([^"]+)"/g))onOrigin(m[1]??m[2],'sitemap.xml');
const robots=await readFile('dist/robots.txt','utf8');for(const m of robots.matchAll(/^Sitemap: (.+)$/gm))onOrigin(m[1],'robots.txt');
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));checks++;
if(isProductionBuild(process.env.VERCEL_ENV))for(const file of distFiles.filter(f=>/\.(html|xml|txt)$/.test(f))){const s=await readFile(file,'utf8');assert.ok(!/localhost|127\.0\.0\.1|\[::1\]/.test(s),`${file}: local host in a production artifact`);checks++}
console.log(`${checks} production artifact checks passed.`);
