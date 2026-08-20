export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Track id is required' });
  }

  try {
    const targetUrl = `https://freefy.app/api/v1/tracks/${encodeURIComponent(id)}/lyrics?duration=0`;
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://freefy.app/'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch lyrics' });
    }

    const data = await response.json();
    
    // Parse plain text or synced lrc lines
    let plainText = '';
    let syncedLines = [];

    if (typeof data === 'string') {
      plainText = data;
    } else if (data.lyrics) {
      if (typeof data.lyrics === 'string') {
        plainText = data.lyrics;
      } else if (Array.isArray(data.lyrics)) {
        syncedLines = data.lyrics;
        plainText = data.lyrics.map(l => l.text || l.line || l.words || '').join('\n');
      }
    } else if (data.lines && Array.isArray(data.lines)) {
      syncedLines = data.lines;
      plainText = data.lines.map(l => l.words || l.text || '').join('\n');
    }

    return res.status(200).json({
      success: true,
      id,
      plainLyrics: plainText.trim(),
      synced: syncedLines.length > 0 ? syncedLines : null
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
