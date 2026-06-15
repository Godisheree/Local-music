import { useState, useEffect } from 'react'
import axios from 'axios'

function SearchPage({ songs, searchQuery, setSearchQuery, onPlay, currentSong, isPlaying, saveSongToLibrary }) {
  const [onlineSongs, setOnlineSongs] = useState([])
  const [loadingOnline, setLoadingOnline] = useState(false)
  const [addingSongId, setAddingSongId] = useState(null)

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

  // Search online & local when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setLoadingOnline(true)
      axios.get(`/api/songs/search-online?query=${encodeURIComponent(searchQuery)}`)
        .then(({ data }) => {
          setOnlineSongs(data)
          setLoadingOnline(false)
        })
        .catch(err => {
          console.error('Online search failed:', err)
          setLoadingOnline(false)
        })
    } else {
      setOnlineSongs([])
    }
  }, [searchQuery])

  const filteredLocalSongs = searchQuery.trim()
    ? songs.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.album.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const handleAddToLibrary = async (e, song) => {
    e.stopPropagation()
    setAddingSongId(song.mbid)
    try {
      await saveSongToLibrary(song)
    } catch (err) {
      console.error(err)
    } finally {
      setAddingSongId(null)
    }
  }

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
        <div className="flex flex-col gap-8">
          {/* Local Results */}
          {filteredLocalSongs.length > 0 && (
            <div>
              <h2 className="text-title-sm text-title-sm text-on-background mb-3">Your Library</h2>
              <div className="flex flex-col gap-2">
                {filteredLocalSongs.slice(0, 5).map(song => {
                  const isActive = currentSong?.id === song.id
                  return (
                    <div
                      key={song.id}
                      className={`flex items-center gap-4 p-2 rounded-lg cursor-pointer group transition-colors ${
                        isActive ? 'bg-primary/10' : 'hover:bg-surface-container'
                      }`}
                      onClick={() => onPlay(song, filteredLocalSongs)}
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-surface-variant flex items-center justify-center">
                        {song.cover_art_url ? (
                          <img src={song.cover_art_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-secondary-fixed-dim text-[20px]">music_note</span>
                        )}
                        {isActive && isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="material-symbols-outlined fill text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>equalizer</span>
                          </div>
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

          {/* Online Music Search Results */}
          <div>
            <h2 className="text-title-sm text-title-sm text-primary mb-3">Online Search Results</h2>
            {loadingOnline ? (
              <div className="flex items-center gap-3 py-6 justify-center text-secondary-fixed-dim text-body-sm">
                <span className="material-symbols-outlined animate-spin">sync</span>
                Searching the cloud...
              </div>
            ) : onlineSongs.length > 0 ? (
              <div className="flex flex-col gap-2">
                {onlineSongs.map(song => {
                  // Check if this online song already exists in local library
                  const isAlreadySaved = songs.some(s => s.mbid === song.mbid)
                  const isActive = currentSong?.mbid === song.mbid

                  return (
                    <div
                      key={song.mbid}
                      className={`flex items-center gap-4 p-2 rounded-lg cursor-pointer group transition-colors ${
                        isActive ? 'bg-primary/10' : 'hover:bg-surface-container'
                      }`}
                      onClick={() => onPlay(song, onlineSongs)}
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-surface-variant flex items-center justify-center">
                        {song.coverArtUrl ? (
                          <img
                            src={song.coverArtUrl}
                            alt={song.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'inline-block'
                            }}
                          />
                        ) : null}
                        <span 
                          className="material-symbols-outlined text-secondary-fixed-dim text-[20px]" 
                          style={{ display: song.coverArtUrl ? 'none' : 'inline-block' }}
                        >
                          music_note
                        </span>
                        {isActive && isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="material-symbols-outlined fill text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>equalizer</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-body-md text-body-md truncate ${isActive ? 'text-primary' : 'text-on-background'}`}>{song.title}</p>
                        <p className="text-body-sm text-body-sm text-secondary truncate">{song.artist}</p>
                      </div>
                      
                      {/* Action buttons */}
                      <button
                        onClick={(e) => handleAddToLibrary(e, song)}
                        disabled={isAlreadySaved || addingSongId === song.mbid}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isAlreadySaved 
                            ? 'bg-primary/10 text-primary cursor-default'
                            : 'bg-surface-container hover:bg-primary hover:text-on-primary text-on-background active:scale-90'
                        }`}
                        title={isAlreadySaved ? 'Added to Library' : 'Add to Library'}
                      >
                        {addingSongId === song.mbid ? (
                          <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                        ) : isAlreadySaved ? (
                          <span className="material-symbols-outlined text-[18px] fill" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">add</span>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-secondary-fixed-dim/60">
                <span className="material-symbols-outlined text-[32px] mb-2">cloud_off</span>
                <p className="text-body-sm">No online results found for "{searchQuery}"</p>
              </div>
            )}
          </div>
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
                onClick={() => setSearchQuery(genre.name)}
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
