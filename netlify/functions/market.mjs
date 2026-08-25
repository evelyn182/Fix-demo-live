export default async (req) => {
  const u = new URL(req.url);
  const interval = u.searchParams.get('interval') || '15min';
  const symbol = u.searchParams.get('symbol') || 'EUR/USD';
  const start = u.searchParams.get('start');
  const end = u.searchParams.get('end');
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) return Response.json({ ok:false, error:'Missing TWELVE_DATA_API_KEY' }, { status:500 });
  try {
    const url = new URL('https://api.twelvedata.com/time_series');
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('interval', interval);
    url.searchParams.set('outputsize', start || end ? '5000' : '500');
    url.searchParams.set('apikey', key);
    if (start) url.searchParams.set('start_date', start);
    if (end) url.searchParams.set('end_date', end);
    const r = await fetch(url, { cache:'no-store' });
    const j = await r.json();
    if (!r.ok || j.status === 'error' || !Array.isArray(j.values)) return Response.json({ ok:false, error:j.message || 'Twelve Data returned no candles', provider:j }, { status:r.status >= 400 ? r.status : 502 });
    const values = j.values.map(v => ({ time:Math.floor(new Date(v.datetime.replace(' ','T')+'Z').getTime()/1000), open:Number(v.open), high:Number(v.high), low:Number(v.low), close:Number(v.close) })).filter(x=>[x.open,x.high,x.low,x.close].every(Number.isFinite)).sort((a,b)=>a.time-b.time);
    return Response.json({ ok:true, values, symbol, source:'Twelve Data' });
  } catch(e) { return Response.json({ ok:false, error:e?.message || 'Twelve Data market request failed' }, { status:502 }); }
};
