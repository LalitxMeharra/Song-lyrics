export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ success: false, message: 'Track ID is required' });

  try {
    const targetUrl = `https://freefy.app/api/v1/tracks/${encodeURIComponent(id)}/lyrics?duration=0`;
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://freefy.app/',
        'Origin': 'https://freefy.app',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: `Status: ${response.status}` });
    }

    const json = await response.json();
    let plainText = '';
    if (json.lines && Array.isArray(json.lines)) {
      plainText = json.lines.map(lineObj => (lineObj && lineObj.text !== undefined) ? lineObj.text : lineObj).join('\n');
    }

    return res.status(200).json({
      success: true,
      id,
      plainLyrics: plainText.trim()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
