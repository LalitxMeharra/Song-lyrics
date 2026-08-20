export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query, q } = req.query;
  const searchTerm = query || q;
  if (!searchTerm) return res.status(400).json({ success: false, message: 'Query required' });

  try {
    const rawTarget = `https://freefy.app/api/v1/search?loader=searchPage&query=${encodeURIComponent(searchTerm)}`;
    
    // Relay proxy via codetabs/corsproxy inside serverless function
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rawTarget)}`;

    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: 'Upstream fetch failed' });
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

    return res.status(200).json({ success: true, count: tracks.length, data: tracks });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
