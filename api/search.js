export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query } = req.query;
  if (!query) return res.status(400).json({ success: false, message: 'Query parameter required' });

  try {
    const targetUrl = `https://freefy.app/api/v1/search?loader=searchPage&query=${encodeURIComponent(query)}`;
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://freefy.app/'
      }
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, message: 'Failed to fetch tracks' });
    }

    const json = await response.json();
    const rawTracks = json?.results?.tracks?.data || [];

    // Exact payload parsing: title, artist, album image & track id
    const tracks = rawTracks.map(item => {
      const artistName = item.artists && item.artists.length > 0 
        ? item.artists.map(a => a.name).join(', ') 
        : 'Unknown Artist';
      
      const coverImage = item.album?.image || item.image || (item.artists && item.artists[0]?.image_small) || '';

      return {
        id: item.id,
        name: item.name,
        artist: artistName,
        album: item.album?.name || '',
        image: coverImage
      };
    });

    return res.status(200).json({ success: true, count: tracks.length, data: tracks });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
