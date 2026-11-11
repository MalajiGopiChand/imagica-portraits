const categories=['Weddings','Pre-Wedding','Birthdays','Portraits','Engagements','Events','Maternity','Fashion & Creative'];
const uuid=/^[a-f0-9-]{36}$/;
const mediaKey=/^[a-f0-9-]{36}\.(jpg|png|webp)$/;
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
export function isOwner(req,env){return !!env.ADMIN_OWNER_EMAIL&&!!req.headers.get('oai-authenticated-user-id')&&req.headers.get('oai-authenticated-user-email')?.toLowerCase()===env.ADMIN_OWNER_EMAIL.toLowerCase()}
const read=async(bucket,key)=>{const o=await bucket.get(key);return o?o.json():null};
const write=(bucket,key,data)=>bucket.put(key,JSON.stringify(data),{httpMetadata:{contentType:'application/json'}});
async function records(bucket,type){let cursor,items=[];do{const page=await bucket.list({prefix:'records/'+type+'/',cursor,limit:500});for(let i=0;i<page.objects.length;i+=20){const rows=await Promise.all(page.objects.slice(i,i+20).map(o=>read(bucket,o.key)));items.push(...rows.filter(Boolean))}cursor=page.truncated?page.cursor:undefined}while(cursor);return items}
function text(value,name,max,required=true){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))fail('Enter a valid '+name+'.');return value.trim()}
function internalMedia(value,origin){if(value===null||value==='')return null;try{const u=new URL(value);if(u.origin!==origin||!u.pathname.startsWith('/media/')||!mediaKey.test(u.pathname.slice(7)))fail('Invalid image URL.');return u.href}catch{fail('Invalid image URL.')}}
async function visibility(bucket,record,on){const urls=record.url?[record.url]:[record.cover_url,...(record.images||[])];for(const url of urls.filter(Boolean)){const key=new URL(url).pathname.slice(7);if(mediaKey.test(key))await write(bucket,'visibility/'+key,{published:!!on})}}
async function body(req){if(Number(req.headers.get('Content-Length')||0)>20000)fail('Request is too large.',413);const raw=await req.text();if(raw.length>20000)fail('Request is too large.',413);try{return JSON.parse(raw)}catch{fail('Invalid request data.')}}
export async function handleBackend(req,env){
 try{
  const u=new URL(req.url),path=u.pathname,owner=isOwner(req,env),bucket=env.BUCKET;
  if(path==='/api/me')return json({authenticated:!!req.headers.get('oai-authenticated-user-id'),admin:owner});
  if(!bucket)fail('Studio storage is temporarily unavailable.',503);
  if(path.startsWith('/media/')){
   if(!['GET','HEAD'].includes(req.method))return json({message:'Method not allowed'},405);
   const key=path.slice(7);if(!mediaKey.test(key))fail('Image not found.',404);
   if(!owner&&!(await read(bucket,'visibility/'+key))?.published)fail('Image not found.',404);
   const file=await bucket.get('images/'+key);if(!file)fail('Image not found.',404);
   return new Response(req.method==='HEAD'?null:file.body,{headers:{'Content-Type':file.httpMetadata?.contentType||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  const mutate=!['GET','HEAD'].includes(req.method);
  if(mutate){if(!owner)fail('Only the studio owner can make changes.',403);if(req.headers.get('Origin')!==u.origin||req.headers.get('X-Imagica-Request')!=='studio')fail('Invalid request origin.',403)}
  if(path==='/api/admin/trash'){
   if(!owner)fail('Owner sign-in required.',403);
   return json({photos:(await records(bucket,'photos')).filter(p=>p.deleted),events:(await records(bucket,'events')).filter(p=>p.deleted)});
  }
  if(path.startsWith('/api/storage/v1/object/photos/')){
   if(req.method!=='POST')fail('Method not allowed.',405);
   const key=path.split('/').pop();if(!mediaKey.test(key))fail('Invalid image filename.');
   const mime=req.headers.get('Content-Type'),bytes=new Uint8Array(await req.arrayBuffer());
   if(bytes.length===0||bytes.length>10485760)fail('Images must be between 1 byte and 10 MB.',413);
   const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
   const png=[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
   const webp=new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
   if(!(mime==='image/jpeg'&&jpeg&&key.endsWith('.jpg')||mime==='image/png'&&png&&key.endsWith('.png')||mime==='image/webp'&&webp&&key.endsWith('.webp')))fail('Use a valid JPG, PNG or WebP photograph.');
   await bucket.put('images/'+key,bytes,{httpMetadata:{contentType:mime}});return json({key});
  }
  if(path==='/api/storage/v1/object/photos'&&req.method==='DELETE')return json({message:'Images retained for recovery in Trash.'});
  if(path==='/api/rest/v1/admin_users'){if(!owner)fail('This account is not the studio owner.',403);return json([{user_id:req.headers.get('oai-authenticated-user-id')}])}
  if(path==='/api/rest/v1/settings'){
   if(req.method==='GET')return json([{data:(await read(bucket,'settings/site.json'))||{}}]);
   if(req.method!=='POST')fail('Method not allowed.',405);
   const {data}=await body(req),clean={};for(const key of ['phone','email','instagram','location','testimonial','testimonialName'])clean[key]=text(data?.[key]??'',key,1000,false);
   if(clean.phone&&!/^\d{8,15}$/.test(clean.phone))fail('WhatsApp requires 8–15 digits, including country code.');
   if(clean.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email))fail('Enter a valid email.');
   if(clean.instagram){try{if(new URL(clean.instagram).protocol!=='https:')fail('Instagram URL must use https.')}catch{fail('Enter a valid Instagram URL.')}}
   await write(bucket,'settings/site.json',clean);return json(clean);
  }
  const match=path.match(/^\/api\/rest\/v1\/(photos|events)$/);if(!match)fail('Not found.',404);
  const type=match[1];
  if(req.method==='GET'){let list=await records(bucket,type);list=list.filter(p=>!p.deleted&&(owner&&!u.searchParams.has('published')||p.published));list.sort((a,b)=>type==='photos'?b.created_at.localeCompare(a.created_at):a.date.localeCompare(b.date));return json(list)}
  let id=u.searchParams.get('id')?.replace(/^eq\./,'');if(id&&!uuid.test(id))fail('Invalid record ID.');
  if(req.method==='DELETE'){
   if(!id)fail('Missing record ID.');const key='records/'+type+'/'+id+'.json',old=await read(bucket,key);if(!old)fail('Record not found.',404);
   await visibility(bucket,old,false);await write(bucket,key,{...old,deleted:true,deleted_at:new Date().toISOString()});return json({deleted:true});
  }
  if(!['POST','PATCH'].includes(req.method))fail('Method not allowed.',405);
  const data=await body(req),old=id?await read(bucket,'records/'+type+'/'+id+'.json'):null;if(req.method==='PATCH'&&!old)fail('Record not found.',404);
  id=id||crypto.randomUUID();
  if(data.restore===true){if(!old)fail('Record not found.',404);const restored={...old,deleted:false,published:false};await write(bucket,'records/'+type+'/'+id+'.json',restored);return json(restored)}
  const record={id,title:text(data.title,'title',160),description:text(data.description,'description',type==='photos'?1000:3000,false),published:data.published===true,created_at:old?.created_at||new Date().toISOString(),deleted:false};
  if(type==='photos'){
   if(!categories.includes(data.category))fail('Choose an occasion category.');record.category=data.category;record.featured=data.featured===true;record.url=internalMedia(data.url||old?.url,u.origin);if(!record.url)fail('Select an image.');
  }else{
   if(!data.date||!Number.isFinite(Date.parse(data.date)))fail('Enter a valid event date.');record.date=new Date(data.date).toISOString();record.location=text(data.location,'location',300);record.cover_url=internalMedia(data.cover_url,u.origin);if(!Array.isArray(data.images)||data.images.length>50)fail('Use up to 50 event images.');record.images=data.images.map(v=>internalMedia(v,u.origin)).filter(Boolean);
  }
  // Every referenced file must already exist. Keep missing or partial uploads private.
  for(const url of (record.url?[record.url]:[record.cover_url,...(record.images||[])]).filter(Boolean))if(!await bucket.head('images/'+new URL(url).pathname.slice(7)))fail('An image upload is missing. Please select it again.');
  if(old)await visibility(bucket,old,false);
  await write(bucket,'records/'+type+'/'+id+'.json',record);await visibility(bucket,record,record.published);return json(record,req.method==='POST'?201:200);
 }catch(e){return json({message:e.status?e.message:'Unable to save studio content. Please retry.'},e.status||500)}
}
