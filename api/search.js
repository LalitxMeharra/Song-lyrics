export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  try {
    const targetUrl = `https://freefy.app/api/v1/search?loader=searchPage&query=${encodeURIComponent(q)}`;
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://freefy.app/'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch search results from source' });
    }

    const data = await response.json();
    
    // Normalize tracks list to hide source structure and provide a clean payload
    let tracks = [];
    if (data.tracks && Array.isArray(data.tracks)) {
      tracks = data.tracks;
    } else if (data.results && Array.isArray(data.results)) {
      tracks = data.results;
    } else if (Array.isArray(data)) {
      tracks = data;
    }

    const sanitizedTracks = tracks.map(item => ({
      id: item.id || item.track_id || item._id,
      title: item.title || item.name || 'Unknown Track',
      artist: item.artist?.name || item.artists?.[0]?.name || item.artist_name || 'Unknown Artist',
      album: item.album?.name || item.album_name || '',
      cover: item.album?.image || item.image || item.cover_url || '',
      duration: item.duration || 0
    }));

    return res.status(200).json({
      success: true,
      count: sanitizedTracks.length,
      data: sanitizedTracks
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}