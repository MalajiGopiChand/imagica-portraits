// Public read-only gateway. Never forward cookies, identity headers or owner secrets.
const origin='https://imagica-portraits-studio.turfybass4.chatgpt.site';
const paths={photos:'/api/rest/v1/photos?published=eq.true',events:'/api/rest/v1/events?published=eq.true',settings:'/api/rest/v1/settings'};
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return res.status(405).json({message:'Public endpoint is read-only.'})}
 const resource=req.query?.resource;
 if(resource==='me')return res.status(200).json({authenticated:false,admin:false});
 if(typeof resource!=='string'||!paths[resource])return res.status(404).json({message:'Content not found.'});
 try{
  const upstream=await fetch(origin+paths[resource],{headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000),redirect:'error'});
  if(!upstream.ok)throw Error('Content unavailable');
  const data=await upstream.json();if(!Array.isArray(data))throw Error('Invalid content response');
  return res.status(200).json(data);
 }catch{return res.status(503).json({message:'Studio content is temporarily unavailable. Please try again.'})}
}
