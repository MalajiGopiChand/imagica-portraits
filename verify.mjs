import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
for(const page of ['','about/','gallery/','events/','contact/','admin/']){const text=await fs.readFile('dist/'+page+'index.html','utf8');assert(text.includes('Imagica Portraits'));assert(text.includes('/app.js'))}
for(const file of ['app.js','style.css','config.js','assets/imagica-logo.jpg','sitemap.xml','robots.txt'])assert((await fs.stat('dist/'+file)).size>0);
const sql=await fs.readFile('supabase.sql','utf8');for(const table of ['photos','events','settings','admin_users'])assert(sql.includes(`alter table public.${table} enable row level security`));
console.log('Verified all six pages, required assets, sitemap and database RLS declarations.');
