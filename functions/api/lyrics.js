export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (!id) {
    return new Response(JSON.stringify({ success: false, message: 'Track ID is required' }), {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const targetUrl = `https://freefy.app/api/v1/tracks/${encodeURIComponent(id)}/lyrics?duration=0`;
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
    let plainText = '';
    if (json.lines && Array.isArray(json.lines)) {
      plainText = json.lines.map(line => (line && line.text !== undefined) ? line.text : line).join('\n');
    }

    return new Response(JSON.stringify({
      success: true,
      id,
      plainLyrics: plainText.trim()
    }), {
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
