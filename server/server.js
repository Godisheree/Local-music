require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getDb } = require('./database');
const songsRouter = require('./routes/songs');
const playlistsRouter = require('./routes/playlists');
const spotifyRouter = require('./routes/spotify');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());
app.use('/api/songs', songsRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/spotify', spotifyRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

getDb().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`Server jalan di http://${HOST}:${PORT}`);
    if (HOST === '0.0.0.0') {
      const os = require('os');
      const nets = os.networkInterfaces();
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`  -> LAN: http://${net.address}:${PORT}`);
          }
        }
      }
    }
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
