# Local Music

A self-hosted music streaming web application built with React, Express, and SQLite. Stream your personal music library from any device on your local network — desktop, tablet, or phone.

![Dark Theme UI](https://img.shields.io/badge/theme-dark-%23121414)
![React](https://img.shields.io/badge/React-18-61dafb)
![Express](https://img.shields.io/badge/Express-4-000000)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

---

## Features

- **Music Library Scanning** — Automatically scans designated folders for audio files (MP3, FLAC, WAV, OGG, M4A, AAC, WMA) and extracts metadata (title, artist, album, duration)
- **Full Playback Controls** — Play, pause, skip, shuffle, repeat (off/all/one), seek, and volume control
- **Playlist Management** — Create, delete, and organize playlists. Add or remove songs via right-click context menu
- **Spotify Integration** — Connect your Spotify account to search millions of tracks and discover new music alongside your local library
- **Sleep Timer** — Set a countdown timer to auto-pause playback (preset or custom duration)
- **Responsive Design** — Optimized for desktop (sidebar + table layout) and mobile (bottom nav + card layout) with glassmorphic dark theme
- **PWA Ready** — Install as a standalone app on mobile devices with service worker support
- **LAN Access** — Access from any device on the same WiFi network

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v4 |
| Audio Engine | Howler.js (HTML5 Audio streaming) |
| Backend | Express.js, sql.js (SQLite) |
| Metadata | music-metadata (audio tag parsing) |
| Icons | Material Symbols Outlined |
| Font | Hanken Grotesk |
| Auth | Spotify OAuth 2.0 |

## Project Structure

```
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/      # Sidebar, TopNavBar, BottomNav
│   │   │   ├── player/      # MiniPlayer, DesktopPlayer, NowPlaying views
│   │   │   ├── pages/       # HomePage, LibraryPage, SearchPage
│   │   │   └── shared/      # TrackList, ContextMenu, TimerModal
│   │   ├── hooks/
│   │   │   ├── useAudio.js  # Howler.js audio engine wrapper
│   │   │   └── useSpotify.js # Spotify OAuth & search hook
│   │   ├── utils/           # Shared utilities (formatTime)
│   │   ├── styles/          # Tailwind CSS entry + custom utilities
│   │   ├── App.jsx          # Root component & state management
│   │   └── main.jsx         # Entry point
│   └── public/              # Static assets, manifest, service worker
│
├── server/                  # Express backend
│   ├── routes/
│   │   ├── songs.js         # Song CRUD + library scanning
│   │   ├── playlists.js     # Playlist CRUD + song management
│   │   └── spotify.js       # Spotify OAuth + search proxy
│   ├── database.js          # SQLite initialization & helpers
│   └── server.js            # Express app setup
```

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A folder with audio files (MP3, FLAC, WAV, etc.)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Godisheree/Local-music.git
   cd Local-music
   ```

2. **Install server dependencies**

   ```bash
   cd server
   npm install
   ```

3. **Configure the server**

   Create a `.env` file in the `server/` directory:

   ```env
   PORT=3001
   HOST=0.0.0.0

   # Spotify integration (optional)
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:3001/api/spotify/callback
   FRONTEND_URL=http://localhost:3001
   ```

4. **Start the server**

   ```bash
   node server.js
   ```

5. **Install client dependencies**

   ```bash
   cd ../client
   npm install
   ```

6. **Configure the client**

   Create a `.env` file in the `client/` directory:

   ```env
   VITE_API_BASE_URL=http://localhost:3001
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:3001/api/spotify/callback
   ```

7. **Start the development server**

   ```bash
   npx vite --host
   ```

8. **Open the app** at `http://localhost:3000`

### Scanning Your Music Library

Once the app is running, click the **Settings** icon (or **Scan Library** in the sidebar) to scan for audio files. The server scans these directories by default:

- `server/music/` — Place audio files here for testing
- Your custom music folder (configurable in `server/routes/songs.js`)

After scanning, all detected songs will appear in the Library view.

## Accessing from Mobile Devices

To use the app on your phone or tablet:

1. Make sure your phone and PC are on the **same WiFi network**
2. Find your PC's local IP address:
   - Windows: `ipconfig` → look for IPv4 Address
   - Mac/Linux: `ifconfig` or `ip addr`
3. Update `client/.env`:
   ```env
   VITE_API_BASE_URL=http://YOUR_PC_IP:3001
   ```
4. Start the Vite dev server with `--host`:
   ```bash
   npx vite --host 0.0.0.0
   ```
5. Open `http://YOUR_PC_IP:3000` on your phone's browser

## API Endpoints

### Songs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/songs` | List all songs |
| GET | `/api/songs/:id` | Get a single song |
| GET | `/api/songs/:id/stream` | Stream audio file (supports Range requests) |
| POST | `/api/songs/scan-library` | Scan folders for new audio files |

### Playlists

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/playlists` | List all playlists with songs |
| POST | `/api/playlists` | Create a new playlist |
| DELETE | `/api/playlists/:id` | Delete a playlist |
| POST | `/api/playlists/:id/add-song` | Add a song to a playlist |
| DELETE | `/api/playlists/:id/remove-song/:songId` | Remove a song from a playlist |

### Spotify (Optional)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/spotify/login` | Get Spotify authorization URL |
| GET | `/api/spotify/callback` | Handle Spotify OAuth callback |
| POST | `/api/spotify/refresh` | Refresh Spotify access token |
| GET | `/api/spotify/search/tracks` | Search Spotify tracks |
| GET | `/api/spotify/me` | Get authenticated Spotify user profile |

## Design System

The UI follows the **Sonic Obsidian** design system:

- **Color scheme**: High-contrast dark mode (`#121414` base) with green primary accent (`#53e076`)
- **Typography**: Hanken Grotesk font family with 7 weight/size tokens
- **Glassmorphism**: Backdrop blur (40px) on navigation bars and player controls
- **Elevation**: Tonal layering instead of traditional shadows
- **Shapes**: Consistently rounded corners (sound wave metaphor)
- **Animations**: Playing indicator equalizer bars, hover-reveal play buttons, press scale effects

## Spotify Integration Setup

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy the **Client ID** and **Client Secret**
4. In your app settings, add these **Web** redirect URIs:
   - `http://127.0.0.1:3001/api/spotify/callback` (for desktop)
   - `http://YOUR_PC_IP:3001/api/spotify/callback` (for mobile, optional)
5. Add the credentials to your `.env` files as shown above
6. In the app, go to the **Search** tab and click **Connect Spotify**

## Build for Production

```bash
cd client
npm run build
```

The built files will be in `client/dist/`. You can serve them with any static file server or configure the Express backend to serve them directly.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Change `PORT` in `server/.env` or kill the process using that port |
| Can't access from phone | Ensure both devices are on the same WiFi. Check firewall settings. |
| Spotify Connect fails | Verify redirect URIs match exactly in Spotify Dashboard (use `127.0.0.1` not `localhost` for HTTP) |
| No songs found | Click Scan Library. Ensure your music folder path is correct in `server/routes/songs.js` |
| Audio won't play | Check browser console for CORS errors. Ensure `VITE_API_BASE_URL` is correct. |

## License

This project is for personal use. Feel free to fork and modify for your own needs.
