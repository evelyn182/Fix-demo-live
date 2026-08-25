export default async (req) => {
  const u = new URL(req.url);
  const symbol = u.searchParams.get('symbol') || 'EUR/USD';
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return Response.json({ ok:false, error:'Missing FINNHUB_API_KEY' }, { status:500 });
  const fh = `OANDA:${symbol.replace('/','_')}`;
  try {
    const url = new URL('https://finnhub.io/api/v1/forex/quote');
    url.searchParams.set('symbol', fh);
    url.searchParams.set('token', key);
    const response = await fetch(url, { cache:'no-store' });
    const data = await response.json();
    if (!response.ok || data.error || (!Number.isFinite(Number(data.c)) && !Number.isFinite(Number(data.bid)))) return Response.json({ ok:false, error:data.error || 'Finnhub returned no usable quote', provider:data }, { status:response.status >= 400 ? response.status : 502 });
    const price = Number(data.c ?? ((Number(data.bid)+Number(data.ask))/2));
    return Response.json({ ok:true, symbol, price, bid:Number(data.bid)||null, ask:Number(data.ask)||null, timestamp:Number(data.t)||Math.floor(Date.now()/1000), source:'Finnhub' });
  } catch (e) { return Response.json({ ok:false, error:e?.message || 'Finnhub quote request failed' }, { status:502 }); }
};
