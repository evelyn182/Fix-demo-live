export default async (req) => {
  const u = new URL(req.url);
  const symbol = u.searchParams.get('symbol') || 'EUR/USD';
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) return Response.json({ ok:false, error:'Missing TWELVE_DATA_API_KEY' }, { status:500 });
  try {
    const url = new URL('https://api.twelvedata.com/quote');
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('apikey', key);
    const r = await fetch(url, { cache:'no-store' });
    const j = await r.json();
    const price = Number(j.close || j.price);
    if (!r.ok || !Number.isFinite(price)) return Response.json({ ok:false, error:j.message || 'Twelve Data returned no usable quote' }, { status:r.status >= 400 ? r.status : 502 });
    return Response.json({ ok:true, symbol, price, timestamp:Math.floor(Date.now()/1000), source:'Twelve Data' });
  } catch(e) { return Response.json({ ok:false, error:e?.message || 'Twelve Data quote request failed' }, { status:502 }); }
};
