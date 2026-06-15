const express = require('express');
const router = express.Router();
const { getDb, queryAll, queryGet, queryRun } = require('../database');

router.get('/', async (req, res) => {
  try {
    const playlists = await queryAll('SELECT * FROM playlists ORDER BY createdAt DESC');
    for (const pl of playlists) {
      pl.songs = await queryAll(`
        SELECT s.id, s.title, s.artist, s.album, s.duration, ps.position, s.cover_art_url, s.youtube_id, s.filepath
        FROM playlist_songs ps
        JOIN songs s ON ps.songId = s.id
        WHERE ps.playlistId = ?
        ORDER BY ps.position ASC
      `, [pl.id]);
    }
    res.json(playlists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description = '' } = req.body;
    if (!name) return res.status(400).json({ error: 'Playlist name is required' });

    const result = await queryRun('INSERT INTO playlists (name, description) VALUES (?, ?)', [name, description]);
    const playlist = await queryGet('SELECT * FROM playlists WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await queryRun('DELETE FROM playlists WHERE id = ?', [+req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Playlist not found' });
    res.json({ message: 'Playlist deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/add-song', async (req, res) => {
  try {
    const { songId } = req.body;
    if (!songId) return res.status(400).json({ error: 'songId is required' });

    const playlistId = +req.params.id;
    
    // Cek apakah lagu sudah ada di playlist
    const existing = await queryGet('SELECT id FROM playlist_songs WHERE playlistId = ? AND songId = ?', [playlistId, +songId]);
    if (existing) {
      return res.status(200).json({ message: 'Song already in playlist', duplicate: true });
    }

    const maxPos = await queryGet('SELECT MAX(position) as maxPos FROM playlist_songs WHERE playlistId = ?', [playlistId]);
    const position = (maxPos?.maxPos || 0) + 1;

    await queryRun('INSERT INTO playlist_songs (playlistId, songId, position) VALUES (?, ?, ?)', [playlistId, +songId, position]);
    res.json({ message: 'Song added to playlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/remove-song/:songId', async (req, res) => {
  try {
    const result = await queryRun('DELETE FROM playlist_songs WHERE playlistId = ? AND songId = ?', [+req.params.id, +req.params.songId]);
    if (result.changes === 0) return res.status(404).json({ error: 'Song not found in playlist' });
    res.json({ message: 'Song removed from playlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
