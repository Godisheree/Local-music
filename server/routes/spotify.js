const express = require('express');
const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

// Generate authorization URL
router.get('/login', (req, res) => {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-library-read',
    'playlist-read-private',
    'playlist-read-collaborative',
  ];
  
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'state');
  res.json({ url: authorizeURL });
});

// Handle callback and exchange code for token
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).json({ error: 'Authorization denied' });
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;

    spotifyApi.setAccessToken(access_token);
    if (refresh_token) {
      spotifyApi.setRefreshToken(refresh_token);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/?access_token=${access_token}&refresh_token=${refresh_token || ''}&expires_in=${expires_in}`;
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('Error during authorization:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/?error=authorization_failed`);
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    spotifyApi.setRefreshToken(refresh_token);
    const data = await spotifyApi.refreshAccessToken();
    const { access_token, expires_in } = data.body;

    res.json({ access_token, expires_in });
  } catch (err) {
    console.error('Error refreshing token:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Search tracks (with Spotify token)
router.get('/search/tracks', async (req, res) => {
  const { q, limit = 20 } = req.query;
  const { access_token } = req.headers;

  if (!q) {
    return res.status(400).json({ error: 'Search query required' });
  }

  try {
    if (access_token) {
      spotifyApi.setAccessToken(access_token);
    }

    const data = await spotifyApi.searchTracks(q, { limit });
    res.json(data.body.tracks.items);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  const { access_token } = req.headers;

  if (!access_token) {
    return res.status(400).json({ error: 'Access token required' });
  }

  try {
    spotifyApi.setAccessToken(access_token);
    const data = await spotifyApi.getMe();
    res.json(data.body);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
