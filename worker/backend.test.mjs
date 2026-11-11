import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleBackend} from './backend.mjs';
import {passwordHash} from './auth.mjs';
class Bucket{
 data=new Map();
 async put(k,v,options={}){this.data.set(k,{v,options})}
 async get(k){const d=this.data.get(k);return d?{json:async()=>JSON.parse(d.v),body:d.v,httpMetadata:d.options.httpMetadata}:null}
 async delete(k){this.data.delete(k)}
 async head(k){return this.data.has(k)?{}:null}
 async list({prefix}){return {objects:[...this.data.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key})),truncated:false}}
}
const origin='https://studio.example',env={BUCKET:new Bucket(),ADMIN_LOGIN_EMAIL:'owner@example.com',ADMIN_PASSWORD_SALT:'test-salt',ADMIN_PASSWORD_HASH:await passwordHash('test-password','test-salt')};
let cookie='';
function request(path,{method='GET',data,owner=false,wrong=false,originHeader=origin,headers={}}={}){return new Request(origin+path,{method,headers:{...(owner?{Cookie:wrong?'__Host-imagica_session=invalid':cookie}:{}),...(method!=='GET'?{'Origin':originHeader,'X-Imagica-Request':'studio','Content-Type':'application/json'}:{}),...headers},...(data!==undefined?{body:typeof data==='string'||data instanceof Uint8Array?data:JSON.stringify(data)}:{})})}
const call=(p,o)=>handleBackend(request(p,o),env);
const login=await call('/api/auth/login',{method:'POST',data:{email:'owner@example.com',password:'test-password'}});cookie=login.headers.get('set-cookie').split(';')[0];
test('anonymous, non-owner and cross-origin writes are rejected',async()=>{
 for(const opts of [{},{owner:true,wrong:true},{owner:true,originHeader:'https://attacker.example'}])assert.equal((await call('/api/rest/v1/settings',{method:'POST',data:{data:{}},...opts})).status,403);
 assert.equal((await call('/api/admin/trash')).status,403);
 assert.deepEqual(await (await call('/api/me',{owner:true})).json(),{authenticated:true,admin:true});
});
test('upload, categories, publication privacy, trash and restoration persist',async()=>{
 const key=crypto.randomUUID()+'.png',url=origin+'/media/'+key;
 assert.equal((await call('/api/storage/v1/object/photos/'+key,{method:'POST',owner:true,data:new Uint8Array([137,80,78,71,13,10,26,10,0]),headers:{'Content-Type':'image/png'}})).status,200);
 assert.equal((await call('/media/'+key)).status,404);
 const created=await call('/api/rest/v1/photos',{method:'POST',owner:true,data:{title:'Birthday collection',description:'A celebration',category:'Birthdays',url,published:false,featured:true}});assert.equal(created.status,201);const item=await created.json();
 assert.deepEqual(await(await call('/api/rest/v1/photos?published=eq.true')).json(),[]);
 assert.equal((await call('/media/'+key,{owner:true})).status,200);
 assert.equal((await call('/api/rest/v1/photos?id=eq.'+item.id,{method:'PATCH',owner:true,data:{...item,published:true}})).status,200);
 assert.equal((await call('/media/'+key)).status,200);
 assert.equal((await(await call('/api/rest/v1/photos?published=eq.true')).json())[0].category,'Birthdays');
 await call('/api/rest/v1/photos?id=eq.'+item.id,{method:'DELETE',owner:true});assert.equal((await call('/media/'+key)).status,404);
 assert.equal((await(await call('/api/admin/trash',{owner:true})).json()).photos.length,1);
 await call('/api/rest/v1/photos?id=eq.'+item.id,{method:'PATCH',owner:true,data:{restore:true}});
 const restored=await(await call('/api/rest/v1/photos',{owner:true})).json();assert.equal(restored[0].published,false);assert.equal(restored[0].deleted,false);
 assert.equal((await call('/media/'+key)).status,404);
 assert.equal((await call('/api/storage/v1/object/photos/'+crypto.randomUUID()+'.jpg',{method:'POST',owner:true,data:new Uint8Array([0,1,2]),headers:{'Content-Type':'image/jpeg'}})).status,400);
});
test('event management and settings persist; invalid data is rejected',async()=>{
 const data={title:'Studio session',description:'By appointment',date:'2027-01-10T10:00:00+05:30',location:'Studio',cover_url:null,images:[],published:true};
 const result=await call('/api/rest/v1/events',{method:'POST',owner:true,data});assert.equal(result.status,201);const event=await result.json();
 assert.equal((await(await call('/api/rest/v1/events?published=eq.true')).json())[0].title,data.title);
 assert.equal((await call('/api/rest/v1/events?id=eq.'+event.id,{method:'PATCH',owner:true,data:{...data,date:'invalid'}})).status,400);
 await call('/api/rest/v1/events?id=eq.'+event.id,{method:'DELETE',owner:true});assert.equal((await(await call('/api/admin/trash',{owner:true})).json()).events.length,1);
 await call('/api/rest/v1/settings',{method:'POST',owner:true,data:{data:{location:'By appointment',phone:'',studioBio:'Our photography story',photographerName:'The studio'}}});const settings=(await(await call('/api/rest/v1/settings')).json())[0].data;assert.equal(settings.location,'By appointment');assert.equal(settings.studioBio,'Our photography story');assert.equal(settings.photographerName,'The studio');
 assert.equal((await call('/api/rest/v1/settings',{method:'POST',owner:true,data:{data:{phone:'invalid'}}})).status,400);
});

test('password login rejects wrong credentials, forged identity headers and CSRF; logout revokes sessions',async()=>{
 assert.equal((await call('/api/auth/login',{method:'POST',data:{email:'owner@example.com',password:'wrong'}})).status,401);
 assert.equal((await call('/api/auth/login',{method:'POST',originHeader:'https://evil.example',data:{email:'owner@example.com',password:'test-password'}})).status,403);
 assert.equal((await call('/api/rest/v1/settings',{method:'POST',data:{data:{}},headers:{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.com'}})).status,403);
 assert(login.headers.get('set-cookie').includes('HttpOnly; Secure; SameSite=Strict'));
 await call('/api/auth/logout',{method:'POST',owner:true});assert.equal((await(await call('/api/me',{owner:true})).json()).admin,false);
 for(let i=0;i<10;i++)await call('/api/auth/login',{method:'POST',data:{email:'owner@example.com',password:'wrong'},headers:{'CF-Connecting-IP':'test-client'}});
 assert.equal((await call('/api/auth/login',{method:'POST',data:{email:'owner@example.com',password:'test-password'},headers:{'CF-Connecting-IP':'test-client'}})).status,429);
});
