import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';

const html=await readFile('dist/en/index.html','utf8');
assert.ok(html.includes('PREVIEW DEMO'), 'Preview demo label missing from prerendered storefront');
assert.ok(html.includes('No real payments or messages'), 'Preview demo safety label missing');
const scripts=await Promise.all((await readdir('dist/assets')).filter(file=>file.endsWith('.js')).map(file=>readFile(`dist/assets/${file}`,'utf8')));
assert.ok(scripts.some(script=>script.includes('ThurayaDemo!2026')), 'Preview fixture credentials were not included in the explicit preview-demo build');
console.log('Preview-demo artifact checks passed. This artifact is for Vercel Preview only.');
