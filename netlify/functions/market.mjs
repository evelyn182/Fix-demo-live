export default async (req) => {
  const u=new URL(req.url), interval=u.searchParams.get('interval')||'15min', symbol=u.searchParams.get('symbol')||'EUR/USD';
  const key=process.env.TWELVE_DATA_API_KEY; if(!key)return Response.json({ok:false,error:'Missing TWELVE_DATA_API_KEY'},{status:500});
  const q=new URLSearchParams({symbol,interval,apikey:key,outputsize:String(Math.min(Number(u.searchParams.get('outputsize')||5000),5000)),timezone:'UTC'});
  const start=u.searchParams.get('start'),end=u.searchParams.get('end'); if(start)q.set('start_date',start+' 00:00:00'); if(end)q.set('end_date',end+' 23:59:59');
  try{const r=await fetch('https://api.twelvedata.com/time_series?'+q),j=await r.json(); if(!r.ok||j.status==='error'||j.code)return Response.json({ok:false,error:j.message||'Provider error'},{status:400}); const values=(j.values||[]).reverse().map(x=>({time:Math.floor(new Date(x.datetime+'Z').getTime()/1000),open:+x.open,high:+x.high,low:+x.low,close:+x.close})).filter(x=>Object.values(x).every(Number.isFinite)); return Response.json({ok:true,symbol,interval,values,source:'Twelve Data'});}catch(e){return Response.json({ok:false,error:e.message},{status:502})}
};