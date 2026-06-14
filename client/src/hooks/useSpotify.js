import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export function useSpotify() {
  const [accessToken, setAccessToken] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check if user is returning from Spotify callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const expiresIn = params.get('expires_in')

    if (token) {
      setAccessToken(token)
      setIsLoggedIn(true)
      localStorage.setItem('spotify_token', token)
      if (refreshToken) {
        localStorage.setItem('spotify_refresh_token', refreshToken)
      }
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname)
    } else {
      // Try to load from localStorage
      const savedToken = localStorage.getItem('spotify_token')
      if (savedToken) {
        setAccessToken(savedToken)
        setIsLoggedIn(true)
      }
    }
  }, [])

  const login = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`${API_BASE}/api/spotify/login`)
      window.location.href = data.url
    } catch (err) {
      console.error('Login failed:', err)
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setAccessToken(null)
    setIsLoggedIn(false)
    localStorage.removeItem('spotify_token')
    localStorage.removeItem('spotify_refresh_token')
  }, [])

  const searchTracks = useCallback(
    async (query, limit = 20) => {
      if (!query) return []
      try {
        const { data } = await axios.get(`${API_BASE}/api/spotify/search/tracks`, {
          params: { q: query, limit },
          headers: { access_token: accessToken },
        })
        return data
      } catch (err) {
        console.error('Search failed:', err)
        return []
      }
    },
    [accessToken]
  )

  const getCurrentUser = useCallback(async () => {
    if (!accessToken) return null
    try {
      const { data } = await axios.get(`${API_BASE}/api/spotify/me`, {
        headers: { access_token: accessToken },
      })
      return data
    } catch (err) {
      console.error('Failed to fetch user:', err)
      return null
    }
  }, [accessToken])

  return {
    accessToken,
    isLoggedIn,
    loading,
    login,
    logout,
    searchTracks,
    getCurrentUser,
  }
}
