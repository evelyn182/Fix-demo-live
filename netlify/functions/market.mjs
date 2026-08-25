export default async (req) => {
  const u = new URL(req.url);
  const interval = u.searchParams.get('interval') || '15min';
  const symbol = u.searchParams.get('symbol') || 'EUR/USD';
  const start = u.searchParams.get('start');
  const end = u.searchParams.get('end');
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) return Response.json({ ok:false, error:'Missing TWELVE_DATA_API_KEY' }, { status:500 });
  try {
    const q = new URLSearchParams({ symbol, interval, apikey:key, outputsize:'5000' });
    if (start) q.set('start_date', start+' 00:00:00');
    if (end) q.set('end_date', end+' 23:59:59');
    const r = await fetch('https://api.twelvedata.com/time_series?'+q);
    const j = await r.json();
    if (!r.ok || j.status === 'error' || j.code) return Response.json({ ok:false, error:j.message || 'Twelve Data request failed', provider:j }, { status:r.status >= 400 ? r.status : 400 });
    const values = (j.values || []).reverse().map(x => ({ time:Math.floor(new Date(x.datetime+'Z').getTime()/1000), open:+x.open, high:+x.high, low:+x.low, close:+x.close }));
    return Response.json({ ok:true, values, symbol, source:'Twelve Data' });
  } catch (e) {
    return Response.json({ ok:false, error:e?.message || 'Market request failed' }, { status:502 });
  }
};
