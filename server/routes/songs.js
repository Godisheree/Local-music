const express = require('express');
const router = express.Router();
const path = require('path');
const { getDb, queryAll, queryGet, queryRun } = require('../database');

// Helper untuk membersihkan dan memisahkan judul & artis dari YouTube
function parseYoutubeTitle(rawTitle, rawOwner) {
  let cleanTitle = rawTitle
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/Lyric Video/gi, '')
    .replace(/Lyrics/gi, '')
    .replace(/Official Video/gi, '')
    .replace(/Official Audio/gi, '')
    .replace(/Official Music Video/gi, '')
    .replace(/HD/gi, '')
    .replace(/4K/gi, '')
    .trim();

  if (cleanTitle.includes(' - ')) {
    const parts = cleanTitle.split(' - ');
    const artist = parts[0].trim();
    const title = parts.slice(1).join(' - ').trim();
    return { artist, title };
  }

  let artist = rawOwner || 'Unknown Artist';
  if (artist.endsWith(' - Topic')) {
    artist = artist.replace(' - Topic', '').trim();
  }
  return { artist, title: cleanTitle };
}

// Helper untuk mencari ID video YouTube
async function searchYouTube(query) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${apiKey}&maxResults=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].id.videoId;
      }
    } catch (err) {
      console.error('YouTube API error, falling back to scrape:', err.message);
    }
  }

  // Fallback: Scrape YouTube search page
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const match = html.match(/"videoId":"([^"]+)"/);
    if (match && match[1]) {
      return match[1];
    }
  } catch (err) {
    console.error('YouTube scrape error:', err.message);
  }
  return null;
}

// 1. Ambil semua lagu di library
router.get('/', async (req, res) => {
  try {
    const songs = await queryAll('SELECT id, title, artist, album, duration, filesize, filepath, createdAt, mbid, release_mbid, year, genre, cover_art_url, enriched, enriched_at, youtube_id FROM songs ORDER BY title ASC');
    const result = songs.map(s => ({ 
      ...s, 
      format: s.filepath.startsWith('http') || s.filepath.includes(':') ? 'mp3' : path.extname(s.filepath).toLowerCase().replace('.', '') 
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Cari lagu online menggunakan YouTube Scraper (Sangat Akurat & Cepat)
router.get('/search-online', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query parameter is required' });

  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    const match = html.match(/var ytInitialData = ({.*?});/);
    if (!match) {
      return res.json([]);
    }

    const data = JSON.parse(match[1]);
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
    if (!contents) {
      return res.json([]);
    }

    const results = contents
      .filter(c => c.videoRenderer)
      .map(c => {
        const v = c.videoRenderer;
        const videoId = v.videoId;
        const durationStr = v.lengthText ? v.lengthText.simpleText : '0:00';
        
        // Parse durasi (misal "4:56" -> 296 detik)
        let duration = 0;
        if (durationStr && durationStr !== 'Unknown') {
          const parts = durationStr.replace('.', ':').split(':').map(Number);
          if (parts.length === 3) {
            duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
          } else if (parts.length === 2) {
            duration = parts[0] * 60 + parts[1];
          } else if (parts.length === 1) {
            duration = parts[0];
          }
        }

        const rawTitle = v.title?.runs?.[0]?.text || 'Unknown Title';
        const rawOwner = v.ownerText?.runs?.[0]?.text || 'Unknown Artist';
        const parsed = parseYoutubeTitle(rawTitle, rawOwner);

        return {
          id: `online_${videoId}`,
          mbid: `yt-${videoId}`,
          title: parsed.title,
          artist: parsed.artist,
          album: 'YouTube Stream',
          releaseMbid: null,
          duration: duration,
          year: new Date().getFullYear(),
          coverArtUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          youtubeId: videoId,
          filepath: `youtube:${videoId}`,
          format: 'mp3'
        };
      });

    res.json(results.slice(0, 15)); // Batasi 15 hasil teratas
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Cari YouTube ID untuk lagu tertentu
router.get('/get-youtube-id', async (req, res) => {
  const { title, artist } = req.query;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const searchQueryStr = artist ? `${artist} - ${title}` : title;
    const videoId = await searchYouTube(searchQueryStr);
    if (!videoId) return res.status(404).json({ error: 'YouTube video not found' });
    res.json({ videoId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Cari lirik lagu via LRCLIB
router.get('/lyrics', async (req, res) => {
  const { title, artist, album } = req.query;
  if (!title || !artist) return res.status(400).json({ error: 'Title and artist are required' });

  try {
    let url = `https://lrclib.net/api/get?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}`;
    if (album) url += `&album=${encodeURIComponent(album)}`;

    const response = await fetch(url);
    if (response.status === 404) return res.status(404).json({ error: 'Lyrics not found' });
    
    const data = await response.json();
    res.json({
      plainLyrics: data.plainLyrics,
      syncedLyrics: data.syncedLyrics
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Tambah lagu online ke Library (simpan ke database Turso)
router.post('/', async (req, res) => {
  const { title, artist, album, duration, mbid, releaseMbid, year, coverArtUrl, youtubeId } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    // Gunakan virtual filepath untuk lagu online agar memuaskan constraint UNIQUE
    const virtualPath = mbid ? `online:${mbid}` : `youtube:${youtubeId || Date.now()}`;
    
    const existing = await queryGet('SELECT id FROM songs WHERE filepath = ?', [virtualPath]);
    if (existing) {
      return res.status(200).json({ message: 'Song already in library', id: existing.id });
    }

    const result = await queryRun(
      'INSERT INTO songs (title, artist, album, duration, filepath, mbid, release_mbid, year, cover_art_url, youtube_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        title, 
        artist || 'Unknown Artist', 
        album || 'Unknown Album', 
        duration || 0, 
        virtualPath, 
        mbid || null, 
        releaseMbid || null, 
        year || null, 
        coverArtUrl || null, 
        youtubeId || null
      ]
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Song added to library' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Ambil satu lagu dari library
router.get('/:id', async (req, res) => {
  try {
    const song = await queryGet('SELECT id, title, artist, album, duration, filesize, filepath, createdAt, mbid, release_mbid, year, genre, cover_art_url, enriched, enriched_at, youtube_id FROM songs WHERE id = ?', [+req.params.id]);
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Smart Autoplay Recommendation (Radio Mode - Phase 4)
router.get('/:id/radio', async (req, res) => {
  try {
    const baseSong = await queryGet('SELECT * FROM songs WHERE id = ?', [+req.params.id]);
    if (!baseSong) return res.status(404).json({ error: 'Base song not found' });

    // Fetch candidate songs (exclude the base song itself)
    const candidates = await queryAll('SELECT * FROM songs WHERE id != ?', [+req.params.id]);
    if (candidates.length === 0) return res.json(null);

    const scoredCandidates = candidates.map(song => {
      let score = 0;
      
      // 1. Genre Match (Weight: 40)
      if (baseSong.genre && song.genre) {
        const baseGenre = baseSong.genre.toLowerCase();
        const candGenre = song.genre.toLowerCase();
        if (baseGenre === candGenre) score += 40;
        else if (baseGenre.includes(candGenre) || candGenre.includes(baseGenre)) score += 20;
      }

      // 2. Artist Match (Weight: 15)
      // Usually radio plays DIFFERENT artists, but same artist is a strong vibe match.
      if (baseSong.artist && song.artist && baseSong.artist.toLowerCase() === song.artist.toLowerCase()) {
        score += 15;
      }

      // 3. Year/Era Match (Weight: 10)
      if (baseSong.year && song.year) {
        const diff = Math.abs(baseSong.year - song.year);
        if (diff <= 3) score += 10;
        else if (diff <= 10) score += 5;
      }

      // Add a tiny random factor (0-5) to prevent exact same playlist order every time
      score += Math.random() * 5;

      return { song, score };
    });

    // Sort by score DESC
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Pick one of the top 3 randomly to add variety, fallback to top 1 if less than 3
    const topCandidates = scoredCandidates.slice(0, 3);
    const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)].song;

    const result = { 
      ...selected, 
      format: selected.filepath.startsWith('http') || selected.filepath.includes(':') ? 'mp3' : path.extname(selected.filepath).toLowerCase().replace('.', '') 
    };
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Online Smart Autoplay (YouTube Radio)
router.post('/online-radio', async (req, res) => {
  const { title, artist } = req.body;
  try {
    // Cari query untuk mendapatkan lagu mirip/sejenis di YouTube (menggunakan kata kunci 'mix' atau 'playlist')
    const query = artist ? `${artist} mix` : `${title} music`;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    const match = html.match(/var ytInitialData = ({.*?});/);
    if (!match) return res.status(404).json({ error: 'No related songs found' });

    const data = JSON.parse(match[1]);
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
    if (!contents) return res.status(404).json({ error: 'No related songs found' });

    const results = contents
      .filter(c => c.videoRenderer)
      .map(c => {
        const v = c.videoRenderer;
        const videoId = v.videoId;
        const durationStr = v.lengthText ? v.lengthText.simpleText : '0:00';
        let duration = 0;
        if (durationStr && durationStr !== 'Unknown') {
          const parts = durationStr.replace('.', ':').split(':').map(Number);
          if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
          else if (parts.length === 2) duration = parts[0] * 60 + parts[1];
          else if (parts.length === 1) duration = parts[0];
        }

        const rawTitle = v.title?.runs?.[0]?.text || 'Unknown Title';
        const rawOwner = v.ownerText?.runs?.[0]?.text || 'Unknown Artist';
        const parsed = parseYoutubeTitle(rawTitle, rawOwner);

        return {
          id: `online_${videoId}`, // dummy ID untuk React keys
          mbid: `yt-${videoId}`,
          title: parsed.title,
          artist: parsed.artist,
          album: 'YouTube Auto-play',
          duration: duration,
          year: new Date().getFullYear(),
          coverArtUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          youtubeId: videoId,
          filepath: `youtube:${videoId}`,
          format: 'mp3'
        };
      });
      
    // Filter agar lagu yang sedang diputar tidak langsung diulang
    const filtered = results.filter(r => !r.title.toLowerCase().includes((title || '').toLowerCase()));
    
    // Pilih acak dari top 5 rekomendasi YouTube
    const candidates = filtered.slice(0, 5);
    if (candidates.length === 0) return res.status(404).json({ error: 'No candidates' });
    
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    res.json(selected);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
