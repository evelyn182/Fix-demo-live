export default async (req) => {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) {
    return Response.json({ ok: false, error: 'Missing TWELVE_DATA_API_KEY' }, { status: 500 });
  }

  try {
    const url = new URL('https://api.twelvedata.com/quote');
    url.searchParams.set('symbol', 'EUR/USD');
    url.searchParams.set('apikey', key);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.status === 'error' || data.code) {
      return Response.json(
        { ok: false, error: data.message || 'Twelve Data quote request failed', provider: data },
        { status: response.status >= 400 ? response.status : 400 }
      );
    }

    const price = Number(data.close ?? data.price);
    if (!Number.isFinite(price)) {
      return Response.json({ ok: false, error: 'Twelve Data returned no usable EUR/USD price', provider: data }, { status: 502 });
    }

    return Response.json({
      ok: true,
      symbol: 'EUR/USD',
      price,
      timestamp: data.timestamp ? Number(data.timestamp) : Math.floor(Date.now() / 1000),
      source: 'Twelve Data'
    });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || 'Quote request failed' }, { status: 502 });
  }
};
