const express = require('express');
const router = express.Router();
const { queryAll, queryGet, queryRun, queryRunBatch } = require('../database');

const MB_API = 'https://musicbrainz.org/ws/2';
const CAA_API = 'https://coverartarchive.org';
const USER_AGENT = 'LocalMusicPlayer/1.5 (godhumanv11@gmail.com)';
const RATE_LIMIT_MS = 1100;

let progress = {
  running: false,
  total: 0,
  enriched: 0,
  pending: 0,
  current: null,
  errors: 0,
};

async function mbFetch(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
    });
    if (res.status === 503) {
      await sleep(10000);
      const retry = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      });
      if (!retry.ok) return null;
      return retry.json();
    }
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error('mbFetch error:', err.message);
    return null;
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function escapeQuery(str) {
  if (!str) return '';
  return str.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, ' ').trim();
}

function cleanTitle(title, artist) {
  if (!title || !artist) return title;
  let cleaned = title;
  const dashIdx = cleaned.indexOf(' - ' + artist);
  if (dashIdx > 0) cleaned = cleaned.substring(0, dashIdx);
  cleaned = cleaned.replace(/\s*[\(\[].*?(Official|Lyrics|Audio|Visualizer|Music Video|Remix|Slowed|Reverb|Bootleg).*?[\)\]]/gi, '').trim();
  return cleaned || title;
}

async function searchMusicBrainz(artist, title) {
  const cleaned = cleanTitle(title, artist);
  const queries = [];

  if (artist && artist !== 'Unknown Artist') {
    queries.push(`artist:"${escapeQuery(artist)}" AND recording:"${escapeQuery(cleaned)}"`);
  }
  queries.push(`recording:"${escapeQuery(cleaned)}"`);

  if (cleaned !== title && artist && artist !== 'Unknown Artist') {
    queries.push(`artist:"${escapeQuery(artist)}" AND recording:"${escapeQuery(title)}"`);
  }

  for (const q of queries) {
    const url = `${MB_API}/recording?query=${encodeURIComponent(q)}&fmt=json&limit=5`;
    const data = await mbFetch(url);
    if (!data || !data.recordings || data.recordings.length === 0) continue;

    const best = data.recordings[0];
    if (!best.id) continue;

    const release = best.releases?.[0];
    let year = null;
    if (release?.date || best['first-release-date']) {
      const dateStr = release?.date || best['first-release-date'] || '';
      const match = dateStr.match(/^(\d{4})/);
      if (match) year = parseInt(match[1]);
    }

    let genre = null;
    if (best.genres?.length > 0) {
      genre = best.genres.sort((a, b) => b.count - a.count)[0].name;
    } else if (best.tags?.length > 0) {
      genre = best.tags.sort((a, b) => b.count - a.count)[0].name;
    }

    return {
      mbid: best.id,
      release_mbid: release?.id || null,
      year,
      genre,
    };
  }

  return null;
}

async function fetchCoverArt(releaseMbid) {
  if (!releaseMbid) return null;
  try {
    const url = `${CAA_API}/release/${releaseMbid}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      if (res.status === 307 || res.status === 302) {
        const location = res.headers.get('location');
        if (location) {
          const imgRes = await fetch(location);
          if (imgRes.ok) return location;
        }
      }
      return null;
    }
    const data = await res.json();
    if (data.images?.length > 0) {
      const front = data.images.find(i => i.front) || data.images[0];
      return front.thumbnails?.['250'] || front.image;
    }
  } catch {
    return null;
  }
  return null;
}

async function enrichSong(song) {
  const mbData = await searchMusicBrainz(song.artist, song.title);
  if (!mbData) return null;

  await sleep(200);
  const coverUrl = await fetchCoverArt(mbData.release_mbid);

  return {
    mbid: mbData.mbid,
    release_mbid: mbData.release_mbid,
    year: mbData.year,
    genre: mbData.genre,
    cover_art_url: coverUrl,
    enriched: 1,
    enriched_at: new Date().toISOString(),
  };
}

// Reset all enriched flags
router.post('/reset', async (req, res) => {
  await queryRun('UPDATE songs SET enriched = 0, enriched_at = NULL');
  progress = { running: false, total: 0, enriched: 0, pending: 0, current: null, errors: 0 };
  res.json({ message: 'Enrichment reset' });
});

router.post('/start', async (req, res) => {
  if (progress.running) {
    return res.json({ message: 'Enrichment already running', ...progress });
  }

  const songs = await queryAll(
    'SELECT id, title, artist FROM songs WHERE enriched = 0 OR enriched IS NULL'
  );

  if (songs.length === 0) {
    return res.json({ message: 'All songs already enriched', total: 0, enriched: 0, pending: 0 });
  }

  progress = { running: true, total: songs.length, enriched: 0, pending: songs.length, current: null, errors: 0 };
  res.json({ message: 'Enrichment started', ...progress });

  (async () => {
    const batchSize = 10;
    for (let i = 0; i < songs.length; i += batchSize) {
      const batch = songs.slice(i, i + batchSize);
      const ops = [];

      for (const song of batch) {
        progress.current = `${song.artist} - ${song.title}`;
        try {
          const data = await enrichSong(song);
          if (data) {
            ops.push({
              sql: 'UPDATE songs SET mbid=?, release_mbid=?, year=?, genre=?, cover_art_url=?, enriched=1, enriched_at=? WHERE id=?',
              params: [data.mbid, data.release_mbid, data.year, data.genre, data.cover_art_url, data.enriched_at, song.id],
            });
            progress.enriched++;
          } else {
            progress.errors++;
          }
        } catch (err) {
          console.error(`Enrichment error for ${song.title}:`, err.message);
          progress.errors++;
        }
        progress.pending = songs.length - progress.enriched - progress.errors;
        await sleep(RATE_LIMIT_MS);
      }

      if (ops.length > 0) {
        await queryRunBatch(ops);
      }
    }

    progress.running = false;
    progress.current = null;
    console.log(`Enrichment complete: ${progress.enriched} enriched, ${progress.errors} not found`);
  })();
});

router.get('/status', (req, res) => {
  res.json(progress);
});

router.post('/song/:id', async (req, res) => {
  const song = await queryGet('SELECT id, title, artist FROM songs WHERE id = ?', [req.params.id]);
  if (!song) return res.status(404).json({ error: 'Song not found' });

  try {
    const data = await enrichSong(song);
    if (data) {
      await queryRun(
        'UPDATE songs SET mbid=?, release_mbid=?, year=?, genre=?, cover_art_url=?, enriched=1, enriched_at=? WHERE id=?',
        [data.mbid, data.release_mbid, data.year, data.genre, data.cover_art_url, data.enriched_at, song.id]
      );
      res.json({ message: 'Song enriched', data });
    } else {
      res.json({ message: 'No MusicBrainz data found', data: null });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
