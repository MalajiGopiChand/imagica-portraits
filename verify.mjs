import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
for(const page of ['','about/','gallery/','events/','contact/','admin/','services/','films/']){const text=await fs.readFile('dist/'+page+'index.html','utf8');assert(text.includes('Imagica Portraits'));assert(text.includes('/app.js'))}
for(const file of ['app.js','pages.js','style.css','premium.css','films-data.js','config.js','assets/imagica-logo.jpg','sitemap.xml','robots.txt'])assert((await fs.stat('dist/'+file)).size>0);
const manifest=JSON.parse(await fs.readFile('.openai/hosting.json','utf8'));assert.equal(manifest.r2,'BUCKET');assert(!manifest.static);assert((await fs.stat('dist/server/index.js')).size>0);
console.log('Verified eight pages, assets, sitemap, persistent storage binding and Worker build.');
