export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ success: false, message: 'Track ID required' });

  try {
    const rawTarget = `https://freefy.app/api/v1/tracks/${encodeURIComponent(id)}/lyrics?duration=0`;
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rawTarget)}`;

    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: 'Upstream lyrics fetch failed' });
    }

    const json = await response.json();
    let plainText = '';
    if (json.lines && Array.isArray(json.lines)) {
      plainText = json.lines.map(line => (line && line.text !== undefined) ? line.text : line).join('\n');
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
