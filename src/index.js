export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. API: SEARCH ENDPOINT
    if (url.pathname === '/api/search') {
      const q = url.searchParams.get('q') || url.searchParams.get('query');
      if (!q) {
        return new Response(JSON.stringify({ success: false, message: 'Query parameter required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      try {
        const targetUrl = `https://freefy.app/api/v1/search?loader=searchPage&query=${encodeURIComponent(q)}`;
        const res = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': 'https://freefy.app/',
            'Origin': 'https://freefy.app',
            'Accept': 'application/json, text/plain, */*'
          }
        });

        const json = await res.json();
        const rawTracks = json?.results?.tracks?.data || [];

        const tracks = rawTracks.map(item => ({
          id: item.id,
          name: item.name,
          artist: item.artists && item.artists.length > 0 ? item.artists.map(a => a.name).join(', ') : 'Unknown Artist',
          album: item.album?.name || '',
          image: item.album?.image || item.image || (item.artists && item.artists[0]?.image_small) || ''
        }));

        return new Response(JSON.stringify({ success: true, count: tracks.length, data: tracks }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // 2. API: LYRICS ENDPOINT
    if (url.pathname === '/api/lyrics') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ success: false, message: 'ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      try {
        const targetUrl = `https://freefy.app/api/v1/tracks/${encodeURIComponent(id)}/lyrics?duration=0`;
        const res = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': 'https://freefy.app/',
            'Origin': 'https://freefy.app',
            'Accept': 'application/json, text/plain, */*'
          }
        });

        const json = await res.json();
        let plainText = '';
        if (json.lines && Array.isArray(json.lines)) {
          plainText = json.lines.map(line => (line && line.text !== undefined) ? line.text : line).join('\n');
        }

        return new Response(JSON.stringify({
          success: true,
          id,
          plainLyrics: plainText.trim()
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // 3. FRONTEND UI
    return new Response(getHtmlContent(), {
      headers: { 'Content-Type': 'text/html;charset=utf-8' }
    });
  }
};

function getHtmlContent() {
  return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Song Lyrics Downloader</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #121826;
      --card-hover: #1e293b;
      --accent-gradient: linear-gradient(135deg, #6366f1, #a855f7);
      --text: #f8fafc;
      --text-dim: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Poppins', sans-serif; }
    body {
      background-color: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem 1rem;
    }
    .wrapper { width: 100%; max-width: 850px; }
    header { text-align: center; margin: 1.5rem 0 2rem; }
    header h1 { font-size: 2.2rem; font-weight: 700; color: #fff; margin-bottom: 0.3rem; }
    header p { color: var(--text-dim); font-size: 0.95rem; }

    .search-box {
      display: flex;
      gap: 0.5rem;
      background: var(--card-bg);
      padding: 0.4rem 0.5rem;
      border-radius: 50px;
      border: 1px solid #1e293b;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      margin-bottom: 2rem;
    }
    .search-box input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #fff;
      padding: 0.8rem 1.2rem;
      font-size: 1rem;
    }
    .search-box button {
      background: var(--accent-gradient);
      color: #fff;
      border: none;
      outline: none;
      padding: 0.8rem 1.8rem;
      border-radius: 50px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .search-box button:hover { opacity: 0.9; }

    .status-box { text-align: center; color: var(--text-dim); font-size: 1rem; margin: 2rem 0; display: none; }

    .tracks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.2rem;
      margin-bottom: 3rem;
    }
    .track-card {
      background: var(--card-bg);
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
    }
    .track-card:hover {
      background: var(--card-hover);
      transform: translateY(-3px);
      border-color: #6366f1;
    }
    .track-card img {
      width: 60px;
      height: 60px;
      border-radius: 10px;
      object-fit: cover;
      background-color: #1e293b;
    }
    .track-meta { flex: 1; overflow: hidden; }
    .track-title { font-weight: 600; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 0.2rem; }
    .track-artist { font-size: 0.8rem; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .lyrics-container {
      display: none;
      background: var(--card-bg);
      border-radius: 20px;
      padding: 2rem;
      border: 1px solid #1e293b;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .lyrics-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 1.2rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .btn-group { display: flex; gap: 0.6rem; }
    .btn {
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: 0.2s;
    }
    .btn-download { background: var(--accent-gradient); color: #fff; }
    .btn-copy { background: #334155; color: #fff; }
    .btn:hover { opacity: 0.85; }

    .lyrics-text {
      white-space: pre-wrap;
      font-size: 1.05rem;
      line-height: 1.9;
      color: #cbd5e1;
      max-height: 500px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }
  </style>
</head>
<body>

  <div class="wrapper">
    <header>
      <h1>Lyrics Finder</h1>
      <p>Search track, read lyrics & download .TXT file</p>
    </header>

    <form class="search-box" id="searchForm">
      <input type="text" id="searchInput" placeholder="Song ya Artist name (e.g. Khat)..." required>
      <button type="submit">Search</button>
    </form>

    <div class="status-box" id="statusBox">Loading...</div>

    <div class="tracks-grid" id="tracksGrid"></div>

    <div class="lyrics-container" id="lyricsBox">
      <div class="lyrics-top">
        <div>
          <h2 id="songTitle" style="font-size: 1.3rem;">Song Title</h2>
          <p id="songArtist" style="color: #6366f1; font-size: 0.9rem;">Artist</p>
        </div>
        <div class="btn-group">
          <button class="btn btn-copy" id="copyBtn">Copy</button>
          <button class="btn btn-download" id="downloadBtn">Download .TXT</button>
        </div>
      </div>
      <div class="lyrics-text" id="lyricsText"></div>
    </div>
  </div>

  <script>
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const statusBox = document.getElementById('statusBox');
    const tracksGrid = document.getElementById('tracksGrid');
    const lyricsBox = document.getElementById('lyricsBox');
    const songTitle = document.getElementById('songTitle');
    const songArtist = document.getElementById('songArtist');
    const lyricsText = document.getElementById('lyricsText');
    const downloadBtn = document.getElementById('downloadBtn');
    const copyBtn = document.getElementById('copyBtn');

    let currentTrack = {};

    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = searchInput.value.trim();
      if (!q) return;

      statusBox.style.display = 'block';
      statusBox.textContent = 'Songs search ho rahe hain...';
      tracksGrid.innerHTML = '';
      lyricsBox.style.display = 'none';

      try {
        const res = await fetch('/api/search?q=' + encodeURIComponent(q));
        const json = await res.json();

        if (!json.success || !json.data || json.data.length === 0) {
          statusBox.textContent = 'Koi song nahi mila. Dusra search try karein.';
          return;
        }

        statusBox.style.display = 'none';
        renderTracks(json.data);
      } catch (err) {
        statusBox.textContent = 'Search failed. Please try again.';
      }
    });

    function renderTracks(tracks) {
      tracksGrid.innerHTML = tracks.map(track => \`
        <div class="track-card" onclick="getLyrics('\${track.id}', '\${encodeURIComponent(track.name)}', '\${encodeURIComponent(track.artist)}')">
          <img src="\${track.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'}" alt="Cover" onerror="this.src='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'"/>
          <div class="track-meta">
            <div class="track-title">\${escapeHtml(track.name)}</div>
            <div class="track-artist">\${escapeHtml(track.artist)}</div>
          </div>
        </div>
      \`).join('');
    }

    window.getLyrics = async (id, encName, encArtist) => {
      const name = decodeURIComponent(encName);
      const artist = decodeURIComponent(encArtist);

      statusBox.style.display = 'block';
      statusBox.textContent = \`"\${name}" ke lyrics load ho rahe hain...\`;
      lyricsBox.style.display = 'none';

      try {
        const res = await fetch('/api/lyrics?id=' + encodeURIComponent(id));
        const json = await res.json();

        if (!json.success || !json.plainLyrics) {
          statusBox.textContent = 'Is song ke lyrics available nahi hain.';
          return;
        }

        statusBox.style.display = 'none';
        lyricsBox.style.display = 'block';
        songTitle.textContent = name;
        songArtist.textContent = artist;
        lyricsText.textContent = json.plainLyrics;

        currentTrack = { name, artist, lyrics: json.plainLyrics };
        lyricsBox.scrollIntoView({ behavior: 'smooth' });
      } catch (e) {
        statusBox.textContent = 'Lyrics load nahi ho paye.';
      }
    };

    downloadBtn.addEventListener('click', () => {
      if (!currentTrack.lyrics) return;
      const textData = \`Song: \${currentTrack.name}\\nArtist: \${currentTrack.artist}\\n\\n------------------------------\\n\\n\${currentTrack.lyrics}\`;
      const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = \`\${currentTrack.name.replace(/[/\\\\?%*:|"<>]/g, '_')}_Lyrics.txt\`;
      link.click();
    });

    copyBtn.addEventListener('click', () => {
      if (!currentTrack.lyrics) return;
      navigator.clipboard.writeText(currentTrack.lyrics);
      alert('Lyrics copied!');
    });

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
      });
    }
  </script>
</body>
</html>`;
}
