import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
let checks=0;
for(const locale of ['ar','he','en']){
  const html=await readFile(`dist/${locale}/index.html`,'utf8');
  for(const expected of [`lang="${locale}"`,`dir="${locale==='en'?'ltr':'rtl'}"`,'rel="canonical"','hreflang="ar"','hreflang="he"','hreflang="en"','application/ld+json','<h1']){assert.ok(html.includes(expected),`${locale}: ${expected}`);checks++}
  const article=await readFile(`dist/${locale}/journal/moissanite/index.html`,'utf8');assert.ok(article.includes('<h1'));checks++;
}
const sitemap=await readFile('dist/sitemap.xml','utf8');for(const privateRoute of ['/admin','/checkout','/cart','/account','/order/']){assert.ok(!sitemap.includes(privateRoute));checks++}
for(const file of await readdir('dist/assets'))if(file.endsWith('.js')){const s=await readFile(`dist/assets/${file}`,'utf8');assert.ok(!s.includes('ThurayaDemo!2026')&&!s.includes('owner@thuraya.test'),`Demo credentials in ${file}`);checks++}
assert.ok((await readFile('dist/robots.txt','utf8')).includes('Sitemap:'));checks++;
console.log(`${checks} production artifact checks passed.`);
