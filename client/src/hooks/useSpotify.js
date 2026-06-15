import { useCallback, useEffect, useState, useRef } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export function useSpotify() {
  const [accessToken, setAccessToken] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const refreshTimerRef = useRef(null)

  // Helper: refresh token via API
  const refreshAccessToken = useCallback(async (refreshToken) => {
    try {
      const { data } = await axios.post(`${API_BASE}/api/spotify/refresh`, {
        refresh_token: refreshToken
      })
      if (data.access_token) {
        setAccessToken(data.access_token)
        localStorage.setItem('spotify_token', data.access_token)
        
        // Schedule next refresh (refresh 1 menit sebelum expired)
        const expiresIn = data.expires_in || 3600
        const refreshMs = (expiresIn - 60) * 1000
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = setTimeout(() => {
          const rt = localStorage.getItem('spotify_refresh_token')
          if (rt) refreshAccessToken(rt)
        }, refreshMs)
        
        // Simpan expiry time
        localStorage.setItem('spotify_token_expiry', String(Date.now() + expiresIn * 1000))
        return data.access_token
      }
    } catch (err) {
      console.error('Token refresh failed:', err)
      // Token refresh gagal — logout
      setAccessToken(null)
      setIsLoggedIn(false)
      localStorage.removeItem('spotify_token')
      localStorage.removeItem('spotify_refresh_token')
      localStorage.removeItem('spotify_token_expiry')
    }
    return null
  }, [])

  // Check if user is returning from Spotify callback
  // Support hash fragment (#) karena server redirect pakai hash
  useEffect(() => {
    // Parse hash fragment ATAU query params
    const hashStr = window.location.hash.substring(1) // hapus #
    const searchStr = window.location.search.substring(1) // hapus ?
    const params = new URLSearchParams(hashStr || searchStr)
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
      // Simpan expiry time
      if (expiresIn) {
        const expiryMs = Date.now() + parseInt(expiresIn) * 1000
        localStorage.setItem('spotify_token_expiry', String(expiryMs))
        
        // Schedule auto refresh (1 menit sebelum expired)
        const refreshMs = (parseInt(expiresIn) - 60) * 1000
        if (refreshMs > 0) {
          refreshTimerRef.current = setTimeout(() => {
            const rt = localStorage.getItem('spotify_refresh_token')
            if (rt) refreshAccessToken(rt)
          }, refreshMs)
        }
      }
      // Clear URL hash/params
      window.history.replaceState({}, document.title, window.location.pathname)
    } else {
      // Try to load from localStorage
      const savedToken = localStorage.getItem('spotify_token')
      const expiry = localStorage.getItem('spotify_token_expiry')
      const savedRefreshToken = localStorage.getItem('spotify_refresh_token')
      
      if (savedToken) {
        // Cek apakah token masih valid
        if (expiry && Date.now() > parseInt(expiry)) {
          // Token expired — coba refresh
          if (savedRefreshToken) {
            refreshAccessToken(savedRefreshToken)
          } else {
            // Tidak ada refresh token, hapus semua
            localStorage.removeItem('spotify_token')
            localStorage.removeItem('spotify_token_expiry')
          }
        } else {
          setAccessToken(savedToken)
          setIsLoggedIn(true)
          
          // Schedule refresh jika expiry diketahui
          if (expiry && savedRefreshToken) {
            const timeUntilExpiry = parseInt(expiry) - Date.now() - 60000 // 1 menit sebelum
            if (timeUntilExpiry > 0) {
              refreshTimerRef.current = setTimeout(() => {
                refreshAccessToken(savedRefreshToken)
              }, timeUntilExpiry)
            } else {
              // Hampir expired, refresh sekarang
              refreshAccessToken(savedRefreshToken)
            }
          }
        }
      }
    }

    // Cleanup timer saat unmount
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [refreshAccessToken])

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
    localStorage.removeItem('spotify_token_expiry')
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
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
