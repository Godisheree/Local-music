import { useSpotify } from '../../hooks/useSpotify'
import { useEffect, useState } from 'react'

function SearchPage({ songs, searchQuery, setSearchQuery, onPlay, currentSong, isPlaying }) {
  const spotify = useSpotify()
  const [spotifySongs, setSpotifySongs] = useState([])
  const [loadingSpotify, setLoadingSpotify] = useState(false)

  const genres = [
    { name: 'Pop', gradient: 'from-[#E13300] to-[#801D00]' },
    { name: 'Hip-Hop', gradient: 'from-[#BA5D07] to-[#713804]' },
    { name: 'Rock', gradient: 'from-[#E8115B] to-[#8C0A37]' },
    { name: 'Electronic', gradient: 'from-[#1E3264] to-[#0E172F]' },
    { name: 'Indie', gradient: 'from-[#8D67AB] to-[#4B375C]' },
    { name: 'Jazz', gradient: 'from-[#118A43] to-[#084421]' },
    { name: 'Classical', gradient: 'from-[#8e9eab] to-[#4a5568]' },
    { name: 'R&B', gradient: 'from-[#654ea3] to-[#3b2d6b]' },
  ]

  // Search Spotify when query changes
  useEffect(() => {
    if (searchQuery.trim() && spotify.isLoggedIn) {
      setLoadingSpotify(true)
      spotify.searchTracks(searchQuery).then(results => {
        setSpotifySongs(results)
        setLoadingSpotify(false)
      })
    } else {
      setSpotifySongs([])
    }
  }, [searchQuery, spotify.isLoggedIn])

  const filteredSongs = searchQuery.trim()
    ? songs.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.album.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  return (
    <div className="flex flex-col gap-section-stack">
      {/* Mobile Header */}
      <div className="md:hidden">
        <h1 className="text-display-lg text-display-lg text-primary">Search</h1>
      </div>

      {/* Search Input (mobile) */}
      <div className="md:hidden sticky top-[4.5rem] z-10">
        <div className="relative search-glow rounded-lg">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary-fixed-dim text-[20px]">search</span>
          <input
            type="text"
            placeholder="What do you want to listen to?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container rounded-lg pl-10 pr-4 py-3 text-body-md text-body-md text-on-background placeholder:text-secondary-fixed-dim/50 border-none outline-none"
          />
        </div>
      </div>

      {/* Search Results (when query exists) */}
      {searchQuery.trim() && (
        <div className="flex flex-col gap-6">
          {/* Local Results */}
          {filteredSongs.length > 0 && (
            <div>
              <h2 className="text-title-sm text-title-sm text-on-background mb-3">Your Library</h2>
              <div className="flex flex-col gap-2">
                {filteredSongs.slice(0, 5).map(song => {
                  const isActive = currentSong?.id === song.id
                  return (
                    <div
                      key={song.id}
                      className={`flex items-center gap-4 p-2 rounded-lg cursor-pointer group transition-colors ${
                        isActive ? 'bg-primary/10' : 'hover:bg-surface-container'
                      }`}
                      onClick={() => onPlay(song, filteredSongs)}
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-surface-variant flex items-center justify-center">
                        {isActive && isPlaying ? (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="material-symbols-outlined fill text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>equalizer</span>
                          </div>
                        ) : (
                          <span className="material-symbols-outlined text-secondary-fixed-dim text-[20px]">music_note</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-body-md text-body-md truncate ${isActive ? 'text-primary' : 'text-on-background'}`}>{song.title}</p>
                        <p className="text-body-sm text-body-sm text-secondary truncate">{song.artist}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Spotify Results */}
          {spotify.isLoggedIn && spotifySongs.length > 0 && (
            <div>
              <h2 className="text-title-sm text-title-sm text-on-background mb-3">Spotify</h2>
              <div className="flex flex-col gap-2">
                {spotifySongs.map(track => (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-surface-container transition-colors"
                  >
                    {track.album?.images?.[0] && (
                      <img
                        src={track.album.images[0].url}
                        alt={track.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-body-md text-body-md truncate text-on-background">{track.name}</p>
                      <p className="text-body-sm text-body-sm text-secondary truncate">
                        {track.artists?.map(a => a.name).join(', ')}
                      </p>
                    </div>
                    <a
                      href={track.external_urls?.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-full bg-primary text-primary-text text-body-sm hover:opacity-90 transition-opacity"
                    >
                      Open
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Login Prompt - always show when not logged in */}
          {!spotify.isLoggedIn && (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-surface-container/50 rounded-xl border border-outline-variant/20">
              <span className="material-symbols-outlined text-[48px] text-primary/40 mb-3">album</span>
              <p className="text-title-sm text-title-sm text-on-background mb-2">Find more music on Spotify</p>
              <p className="text-body-sm text-body-sm text-secondary-fixed-dim mb-4">Connect your account to search millions of songs</p>
              <button
                onClick={() => spotify.login()}
                disabled={spotify.loading}
                className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-bold text-body-sm hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-95"
              >
                {spotify.loading ? 'Connecting...' : 'Connect Spotify'}
              </button>
            </div>
          )}

          {/* Spotify loading indicator */}
          {spotify.isLoggedIn && loadingSpotify && (
            <div className="flex items-center justify-center py-4">
              <p className="text-body-sm text-body-sm text-secondary-fixed-dim">Searching Spotify...</p>
            </div>
          )}

          {/* No Results - only show when logged in or when both sources have no results */}
          {spotify.isLoggedIn && filteredSongs.length === 0 && spotifySongs.length === 0 && !loadingSpotify && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-[64px] text-secondary-fixed-dim/30 mb-4">search_off</span>
              <p className="text-title-sm text-title-sm text-secondary-fixed-dim">No results found</p>
              <p className="text-body-sm text-body-sm text-secondary-fixed-dim/60 mt-1">Try a different search term</p>
            </div>
          )}

          {/* No local results but not logged in - show hint */}
          {!spotify.isLoggedIn && filteredSongs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="material-symbols-outlined text-[48px] text-secondary-fixed-dim/20 mb-3">library_music</span>
              <p className="text-body-sm text-body-sm text-secondary-fixed-dim/60">No results in your library</p>
            </div>
          )}
        </div>
      )}

      {!searchQuery.trim() && (
        <div>
          <h2 className="text-title-sm text-title-sm text-on-background mb-4">Browse All</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {genres.map(genre => (
              <div
                key={genre.name}
                className={`relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br ${genre.gradient} cursor-pointer group active:scale-[0.98] hover:scale-[0.98] transition-transform`}
              >
                <p className="absolute top-4 left-4 text-title-sm text-title-sm text-white font-bold z-10">{genre.name}</p>
                {/* Decorative rotated thumbnail */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-lg bg-white/10 rotate-12 group-hover:rotate-[15deg] transition-transform shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white/60 text-[32px]">music_note</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchPage
