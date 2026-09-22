import {customerCatalog} from '../shared/public-data';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {App} from '../src/App.tsx';
import {initialData} from '../src/seed.ts';
import {publicPaths,pageMeta} from '../shared/seo.ts';
import {locales,type Catalog} from '../shared/domain.ts';
import {escapeHtml as esc} from '../shared/notifications.ts';
import {previewDemoEnabled} from '../shared/preview-demo.ts';
import {fontPreloads} from '../shared/fonts.ts';
const origin=(process.env.VITE_SITE_URL||'http://localhost:4173').replace(/\/$/,'');
const previewDemo=previewDemoEnabled(process.env.VITE_PREVIEW_DEMO,process.env.VERCEL_ENV);
const seed=initialData(previewDemo);
let data:Catalog={...seed,products:[],reviews:[],pages:seed.pages.filter(p=>p.status==='published'&&(p.kind!=='policy'||p.legalReviewed))};
if(process.env.VITE_SUPABASE_URL){const r=await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/store-api`,{method:'POST',headers:{'Content-Type':'application/json',apikey:process.env.VITE_SUPABASE_ANON_KEY||''},body:JSON.stringify({action:'catalog'})});if(!r.ok)throw new Error('Cannot prerender: configured catalog is unavailable');data=await r.json();if(!data.products||!data.settings)throw new Error('Invalid catalog response')}
data=customerCatalog(data);
const builtAssets=await readdir('dist/assets');
const template=(await readFile('dist/index.html','utf8')).replace(/<html\b[^>]*>/,'<html lang="en">');const paths=publicPaths(data);const urls:string[]=[];
for(const locale of locales)for(const path of paths){const route=`/${locale}${path}`;const meta=pageMeta(data,path,locale,origin);const content=renderToString(<MemoryRouter initialEntries={[route]}><App initial={data}/></MemoryRouter>);const head=`${fontPreloads(locale,builtAssets).map(href=>`<link rel="preload" as="font" type="font/woff2" href="${href}" crossorigin>`).join('')}<title>${esc(meta.title)}</title><meta name="description" content="${esc(meta.description)}"><link rel="canonical" href="${esc(meta.url)}">${meta.alternates.map(a=>`<link rel="alternate" hreflang="${a.locale}" href="${esc(a.url)}">`).join('')}<link rel="alternate" hreflang="x-default" href="${origin}/en${path}"><meta property="og:title" content="${esc(meta.title)}"><meta property="og:description" content="${esc(meta.description)}"><meta property="og:url" content="${esc(meta.url)}"><meta property="og:image" content="${esc(meta.image)}"><script type="application/ld+json">${JSON.stringify(meta.structured).replaceAll('<','\\u003c')}</script>`;const html=template.replace('<html lang="en">',`<html lang="${locale}" dir="${locale==='en'?'ltr':'rtl'}">`).replace(/<title>.*?<\/title>/,head).replace('<div id="root"></div>',`<div id="root">${content}</div>`);await mkdir(`dist${route}`,{recursive:true});await writeFile(`dist${route}/index.html`,html);urls.push(`<url><loc>${esc(meta.url)}</loc>${meta.alternates.map(a=>`<xhtml:link rel="alternate" hreflang="${a.locale}" href="${esc(a.url)}"/>`).join('')}</url>`)}
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>`);
await writeFile('dist/robots.txt',`User-agent: *\nDisallow: /admin\n${locales.flatMap(l=>['cart','checkout','account','order','track','wishlist','review'].map(p=>`Disallow: /${l}/${p}`)).join('\n')}\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile('dist/404.html',template.replace('</head>','<meta name="robots" content="noindex"></head>'));
console.log(`Prerendered ${urls.length} localized public pages; sitemap and robots generated.${previewDemo?' Preview demo content only.':' No demo products.'}`);
