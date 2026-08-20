export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ success: false, message: 'Track ID is required' });

  try {
    const targetUrl = `https://freefy.app/api/v1/tracks/${encodeURIComponent(id)}/lyrics?duration=0`;
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://freefy.app/'
      }
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, message: 'Failed to fetch lyrics' });
    }

    const json = await response.json();
    
    // JSON response structure: lines array extraction
    let plainText = '';
    if (json.lines && Array.isArray(json.lines)) {
      plainText = json.lines.map(lineObj => lineObj.text !== undefined ? lineObj.text : lineObj).join('\n');
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
