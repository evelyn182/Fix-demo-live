export default async (req) => {
  const u = new URL(req.url);
  const interval = u.searchParams.get('interval') || '15min';
  const symbol = u.searchParams.get('symbol') || 'EUR/USD';
  const start = u.searchParams.get('start');
  const end = u.searchParams.get('end');
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return Response.json({ ok:false, error:'Missing FINNHUB_API_KEY' }, { status:500 });

  const resolution = { '15min':'15', '1h':'60', '4h':'240' }[interval] || '15';
  const fh = `OANDA:${symbol.replace('/', '_')}`;
  const now = Math.floor(Date.now()/1000);
  const from = start ? Math.floor(new Date(start+'T00:00:00Z').getTime()/1000) : now - (resolution==='15' ? 5000*900 : resolution==='60' ? 5000*3600 : 5000*14400);
  const to = end ? Math.floor(new Date(end+'T23:59:59Z').getTime()/1000) : now;

  try {
    const url = new URL('https://finnhub.io/api/v1/forex/candle');
    url.searchParams.set('symbol', fh);
    url.searchParams.set('resolution', resolution);
    url.searchParams.set('from', String(from));
    url.searchParams.set('to', String(to));
    url.searchParams.set('token', key);
    const r = await fetch(url, { cache:'no-store' });
    const j = await r.json();
    if (!r.ok || j.s !== 'ok' || !Array.isArray(j.t)) {
      return Response.json({ ok:false, error:j.error || `Finnhub returned no candles for ${symbol}`, provider:j }, { status:r.status >= 400 ? r.status : 502 });
    }
    const values = j.t.map((time,i)=>({
      time:Number(time),
      open:Number(j.o[i]),
      high:Number(j.h[i]),
      low:Number(j.l[i]),
      close:Number(j.c[i])
    })).filter(x=>[x.open,x.high,x.low,x.close].every(Number.isFinite));
    return Response.json({ ok:true, values, symbol, source:'Finnhub' });
  } catch (e) {
    return Response.json({ ok:false, error:e?.message || 'Finnhub market request failed' }, { status:502 });
  }
};
