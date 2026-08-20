export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || url.searchParams.get('query');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (!query) {
    return new Response(JSON.stringify({ success: false, message: 'Query parameter is required' }), {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const targetUrl = `https://freefy.app/api/v1/search?loader=searchPage&query=${encodeURIComponent(query)}`;
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://freefy.app/',
        'Origin': 'https://freefy.app',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ success: false, message: `Upstream error: ${response.status}` }), {
        status: response.status,
        headers: corsHeaders
      });
    }

    const json = await response.json();
    const rawTracks = json?.results?.tracks?.data || [];

    const tracks = rawTracks.map(item => ({
      id: item.id,
      name: item.name,
      artist: item.artists && item.artists.length > 0 ? item.artists.map(a => a.name).join(', ') : 'Unknown Artist',
      album: item.album?.name || '',
      image: item.album?.image || item.image || (item.artists && item.artists[0]?.image_small) || ''
    }));

    return new Response(JSON.stringify({ success: true, count: tracks.length, data: tracks }), {
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
