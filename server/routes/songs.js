const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { parseFile } = require('music-metadata');
const { getDb, queryAll, queryGet, queryRun } = require('../database');

const MUSIC_DIRS = [
  path.join(__dirname, '..', 'music'),
  'C:/Users/Win 10/Music/music jir'
];

router.get('/', async (req, res) => {
  try {
    await getDb();
    const songs = queryAll('SELECT id, title, artist, album, duration, filesize, filepath, createdAt FROM songs ORDER BY title ASC');
    const result = songs.map(s => ({ ...s, format: path.extname(s.filepath).toLowerCase().replace('.', '') }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    await getDb();
    const song = queryGet('SELECT id, title, artist, album, duration, filesize, createdAt FROM songs WHERE id = ?', [+req.params.id]);
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/stream', async (req, res) => {
  try {
    await getDb();
    const song = queryGet('SELECT filepath FROM songs WHERE id = ?', [+req.params.id]);
    if (!song) return res.status(404).json({ error: 'Song not found' });

    const filePath = song.filepath;
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = { '.mp3': 'audio/mpeg', '.flac': 'audio/flac', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.mp4': 'audio/mp4', '.mpeg': 'audio/mpeg' };
    const contentType = mimeMap[ext] || 'audio/mpeg';
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': contentType,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function scanDirectory(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, files);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.wma', '.mp4', '.mpeg'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

router.post('/scan-library', async (req, res) => {
  try {
    await getDb();

    let audioFiles = [];
    for (const dir of MUSIC_DIRS) {
      audioFiles = audioFiles.concat(scanDirectory(dir));
    }
    let added = 0, skipped = 0, errors = 0;

    for (const filePath of audioFiles) {
      const existing = queryGet('SELECT id FROM songs WHERE filepath = ?', [filePath]);
      if (existing) { skipped++; continue; }

      try {
        const metadata = await parseFile(filePath);
        const title = metadata.common.title || path.basename(filePath, path.extname(filePath));
        const artist = metadata.common.artist || 'Unknown Artist';
        const album = metadata.common.album || 'Unknown Album';
        const duration = Math.round(metadata.format.duration || 0);
        const stat = fs.statSync(filePath);

        queryRun(
          'INSERT OR IGNORE INTO songs (title, artist, album, duration, filepath, filesize) VALUES (?, ?, ?, ?, ?, ?)',
          [title, artist, album, duration, filePath, stat.size]
        );
        added++;
      } catch (err) {
        console.error(`Error scanning ${filePath}:`, err.message);
        errors++;
      }
    }

    const totalRow = queryGet('SELECT COUNT(*) as count FROM songs');
    res.json({ message: 'Scan complete', added, skipped, errors, total: totalRow?.count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
