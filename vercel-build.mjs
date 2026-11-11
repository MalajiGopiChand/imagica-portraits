import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('public');
const domain=process.env.SITE_URL||('https://'+(process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL||'imagica-portraits-studio.turfybass4.chatgpt.site'));
const site=new URL(domain);if(!['http:','https:'].includes(site.protocol))throw Error('SITE_URL must be an HTTP(S) URL.');
async function copy(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){if(['server','.openai','admin'].includes(entry.name))continue;const source=path.join(dir,entry.name),relative=path.relative('dist',source),target=path.resolve(root,relative);if(!target.startsWith(root+path.sep))throw Error('Build target outside public directory.');if(entry.isDirectory()){await copy(source);continue}await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(source,target)}}
await fs.mkdir(root,{recursive:true});await copy('dist');
const pages={'':'Home','about/':'About','gallery/':'Gallery','events/':'Events','contact/':'Contact'};
for(const [page,title]of Object.entries(pages)){const file=path.join(root,page,'index.html');let html=await fs.readFile(file,'utf8');const url=new URL('/'+page,site.origin).href;html=html.replace(/<title>[^<]*<\/title>/,`<title>${title} | Imagica Portraits</title>`).replace('</head>',`<link rel="canonical" href="${url}"><meta property="og:url" content="${url}"></head>`);await fs.writeFile(file,html)}
await fs.writeFile(path.join(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+Object.keys(pages).map(p=>`<url><loc>${site.origin}/${p}</loc></url>`).join('')+'</urlset>');
await fs.writeFile(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${site.origin}/sitemap.xml\n`);
console.log('Vercel build ready: five public pages, public API gateway, and secure admin redirect.');
