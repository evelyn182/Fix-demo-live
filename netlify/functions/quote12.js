exports.handler = async (event) => {
  const symbol = (event.queryStringParameters || {}).symbol || 'EUR/USD';
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) return { statusCode:500, body:JSON.stringify({ok:false,error:'Missing TWELVE_DATA_API_KEY'}) };
  try {
    const q = new URLSearchParams({ symbol, apikey:key });
    const r = await fetch('https://api.twelvedata.com/quote?' + q);
    const j = await r.json();
    if (!r.ok || j.status === 'error' || j.code) return {statusCode:r.status>=400?r.status:400,body:JSON.stringify({ok:false,error:j.message||'Quote error'})};
    return {statusCode:200,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify({ok:true,symbol,price:+j.close,timestamp:Math.floor(Date.now()/1000),source:'Twelve Data'})};
  } catch(e){return {statusCode:502,body:JSON.stringify({ok:false,error:e.message||'Quote request failed'})};}
};
