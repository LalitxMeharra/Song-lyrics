export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query } = req.query;
  if (!query) return res.status(400).json({ success: false, message: 'Query parameter required' });

  try {
    const targetUrl = `https://freefy.app/api/v1/search?loader=searchPage&query=${encodeURIComponent(query)}`;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        'Referer': 'https://freefy.app/',
        'Origin': 'https://freefy.app',
        'Sec-Ch-Ua': '"Chromium";v="124", "Android WebView";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?1',
        'Sec-Ch-Ua-Platform': '"Android"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ 
        success: false, 
        message: `Source API error: ${response.status}`, 
        raw: errText.slice(0, 150) 
      });
    }

    const json = await response.json();
    const rawTracks = json?.results?.tracks?.data || [];

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
