import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from './content.js';
function response(){return {code:0,data:null,headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(v){this.data=v;return this}}}
test('Vercel public gateway rejects writes and unknown resources',async()=>{for(const method of ['POST','PATCH','DELETE']){const r=response();await handler({method,query:{resource:'photos'}},r);assert.equal(r.code,405)}const r=response();await handler({method:'GET',query:{resource:'https://attacker.example'}},r);assert.equal(r.code,404)});
test('Vercel does not claim owner authentication',async()=>{const r=response();await handler({method:'GET',query:{resource:'me'}},r);assert.deepEqual(r.data,{authenticated:false,admin:false})});
