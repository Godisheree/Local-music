const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getDb, queryAll, queryGet, queryRun } = require('../database');

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

// 2. Cari lagu online menggunakan MusicBrainz
router.get('/search-online', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query parameter is required' });

  try {
    const url = `https://musicbrainz.org/ws/2/recording/?query=recording:${encodeURIComponent(query)}&fmt=json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'LocalMusicPlayer/1.0.0 (https://github.com/Godisheree/Local-music)' }
    });
    const data = await response.json();

    const recordings = data.recordings || [];
    const results = recordings.map(rec => {
      const releaseMbid = rec.releases?.[0]?.id || '';
      const year = rec.releases?.[0]?.date ? new Date(rec.releases[0].date).getFullYear() : null;
      return {
        mbid: rec.id,
        title: rec.title,
        artist: rec['artist-credit']?.map(ac => ac.name).join(', ') || 'Unknown Artist',
        album: rec.releases?.[0]?.title || 'Unknown Album',
        releaseMbid: releaseMbid,
        duration: rec.length ? Math.round(rec.length / 1000) : 0,
        year: year,
        coverArtUrl: releaseMbid ? `https://coverartarchive.org/release/${releaseMbid}/front-250` : null
      };
    });

    res.json(results);
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

module.exports = router;
