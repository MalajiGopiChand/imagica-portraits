const encoder=new TextEncoder();
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
const digest=async value=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
const sessionCookie='__Host-imagica_session';
const sessionToken=req=>req.headers.get('Cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(sessionCookie+'='))?.slice(sessionCookie.length+1)||'';
const reply=(value,status=200,cookie)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}});
export async function passwordHash(password,salt){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256))}
export async function isOwner(req,env){
 const token=sessionToken(req);if(!/^[a-f0-9]{64}$/.test(token)||!env.BUCKET||!env.ADMIN_PASSWORD_HASH)return false;
 const item=await env.BUCKET.get('auth/sessions/'+await digest(token));const session=item?await item.json():null;
 return !!session&&session.expires>Date.now()&&session.version===await digest(env.ADMIN_PASSWORD_HASH)&&session.email===env.ADMIN_LOGIN_EMAIL;
}
export async function handleAuth(req,env){
 const path=new URL(req.url).pathname;
 if(req.method!=='POST')return reply({message:'Method not allowed.'},405);
 if(req.headers.get('Origin')!==new URL(req.url).origin||req.headers.get('X-Imagica-Request')!=='studio')return reply({message:'Invalid request origin.'},403);
 if(!env.BUCKET||!env.ADMIN_PASSWORD_HASH||!env.ADMIN_PASSWORD_SALT||!env.ADMIN_LOGIN_EMAIL)return reply({message:'Administrator login is not configured.'},503);
 if(path==='/api/auth/logout'){
  const token=sessionToken(req);if(/^[a-f0-9]{64}$/.test(token))await env.BUCKET.delete('auth/sessions/'+await digest(token));
  return reply({success:true},200,sessionCookie+'=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
 }
 if(path!=='/api/auth/login')return reply({message:'Not found.'},404);
 if(Number(req.headers.get('Content-Length')||0)>2048)return reply({message:'Request too large.'},413);
 const raw=await req.text();if(raw.length>2048)return reply({message:'Request too large.'},413);
 let input;try{input=JSON.parse(raw)}catch{return reply({message:'Invalid request.'},400)}
 if(typeof input.email!=='string'||typeof input.password!=='string'||input.password.length>256)return reply({message:'Enter your email and password.'},400);
 const key='auth/attempts/'+await digest(req.headers.get('CF-Connecting-IP')||'unknown');
 const old=await env.BUCKET.get(key);let attempts=old?await old.json():null;
 if(!attempts||attempts.until<Date.now())attempts={count:0,until:Date.now()+900000};
 if(attempts.count>=10)return reply({message:'Too many sign-in attempts. Please try again in 15 minutes.'},429);
 attempts.count++;await env.BUCKET.put(key,JSON.stringify(attempts));
 const actual=await passwordHash(input.password,env.ADMIN_PASSWORD_SALT);let mismatch=actual.length^env.ADMIN_PASSWORD_HASH.length;
 for(let i=0;i<actual.length;i++)mismatch|=actual.charCodeAt(i)^env.ADMIN_PASSWORD_HASH.charCodeAt(i);
 if(mismatch||input.email.trim().toLowerCase()!==env.ADMIN_LOGIN_EMAIL.toLowerCase())return reply({message:'Incorrect email or password.'},401);
 await env.BUCKET.delete(key);
 const token=hex(crypto.getRandomValues(new Uint8Array(32)));
 await env.BUCKET.put('auth/sessions/'+await digest(token),JSON.stringify({email:env.ADMIN_LOGIN_EMAIL,expires:Date.now()+28800000,version:await digest(env.ADMIN_PASSWORD_HASH)}));
 return reply({authenticated:true,admin:true},200,sessionCookie+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800');
}
