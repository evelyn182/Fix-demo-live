exports.handler = async (event) => {
  const p = event.queryStringParameters || {};
  const interval = p.interval || '1min';
  const symbol = p.symbol || 'EUR/USD';
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) return { statusCode: 500, body: JSON.stringify({ ok:false, error:'Missing TWELVE_DATA_API_KEY in Netlify environment variables' }) };
  try {
    const q = new URLSearchParams({ symbol, interval, apikey:key, outputsize:p.outputsize || '5000', timezone:'UTC' });
    if (p.start) q.set('start_date', p.start + ' 00:00:00');
    if (p.end) q.set('end_date', p.end + ' 23:59:59');
    const r = await fetch('https://api.twelvedata.com/time_series?' + q);
    const j = await r.json();
    if (!r.ok || j.status === 'error' || j.code) return { statusCode: r.status >= 400 ? r.status : 400, body: JSON.stringify({ ok:false, error:j.message || 'Twelve Data error' }) };
    const values = (j.values || []).reverse().map(x => ({ time:Math.floor(Date.parse(x.datetime + 'Z')/1000), open:+x.open, high:+x.high, low:+x.low, close:+x.close })).filter(x => Object.values(x).every(Number.isFinite));
    return { statusCode:200, headers:{'content-type':'application/json','cache-control':'no-store'}, body:JSON.stringify({ ok:true, symbol, interval, values, source:'Twelve Data', serverTime:Math.floor(Date.now()/1000) }) };
  } catch (e) { return { statusCode:502, body:JSON.stringify({ ok:false, error:e.message || 'Market request failed' }) }; }
};
