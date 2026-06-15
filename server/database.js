const { createClient } = require('@libsql/client');
require('dotenv').config();

let client = null;

function getDb() {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL is not set in environment variables.");
  }

  client = createClient({
    url,
    authToken
  });

  return client;
}

async function queryAll(sql, params = []) {
  const db = getDb();
  const res = await db.execute({ sql, args: params });
  return res.rows;
}

async function queryGet(sql, params = []) {
  const db = getDb();
  const res = await db.execute({ sql, args: params });
  return res.rows[0] || null;
}

async function queryRun(sql, params = []) {
  const db = getDb();
  const res = await db.execute({ sql, args: params });
  return {
    lastInsertRowid: res.lastInsertRowid ? Number(res.lastInsertRowid) : null,
    changes: res.rowsAffected
  };
}

async function queryRunBatch(operations) {
  const db = getDb();
  for (const { sql, params } of operations) {
    await db.execute({ sql, args: params || [] });
  }
  return { changes: 0 };
}

async function initDatabase() {
  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT DEFAULT 'Unknown Artist',
      album TEXT DEFAULT 'Unknown Album',
      duration INTEGER DEFAULT 0,
      filepath TEXT UNIQUE NOT NULL,
      filesize INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      mbid TEXT,
      release_mbid TEXT,
      year INTEGER,
      genre TEXT,
      cover_art_url TEXT,
      enriched INTEGER DEFAULT 0,
      enriched_at TEXT,
      youtube_id TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS playlist_songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playlistId INTEGER NOT NULL,
      songId INTEGER NOT NULL,
      position INTEGER DEFAULT 0,
      FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (songId) REFERENCES songs(id) ON DELETE CASCADE,
      UNIQUE(playlistId, songId)
    )
  `);
}

module.exports = { getDb, queryAll, queryGet, queryRun, queryRunBatch, initDatabase };
