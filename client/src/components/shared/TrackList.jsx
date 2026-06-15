import { useState, useRef } from 'react'
import ContextMenu from './ContextMenu'
import { formatTime } from '../../utils/formatTime'

function TrackList({ songs, currentSong, isPlaying, onPlay, playlists, addToPlaylist, removeFromPlaylist, selectedPlaylist, showIndex = true }) {
  const [contextMenu, setContextMenu] = useState(null)
  const longPressTimer = useRef(null)
  const longPressTriggered = useRef(false)

  const handleContextMenu = (e, song) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, song })
  }

  const handleTouchStart = (e, song) => {
    longPressTriggered.current = false
    const touch = e.touches[0]
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      setContextMenu({ x: touch.clientX, y: touch.clientY, song })
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleClick = (song) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false
      return
    }
    onPlay(song, songs)
  }

  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-[64px] text-secondary-fixed-dim/30 mb-4">library_music</span>
        <p className="text-title-sm text-title-sm text-secondary-fixed-dim">No songs found</p>
        <p className="text-body-sm text-body-sm text-secondary-fixed-dim/60 mt-1">Tap Scan Library to find music files</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {songs.map((song, idx) => {
        const isActive = currentSong?.id === song.id
        return (
          <div
            key={song.id}
            className={`flex items-center gap-4 p-2 rounded-lg cursor-pointer group transition-colors ${
              isActive
                ? 'bg-primary/10'
                : 'hover:bg-surface-container'
            }`}
            onClick={() => handleClick(song)}
            onContextMenu={(e) => handleContextMenu(e, song)}
            onTouchStart={(e) => handleTouchStart(e, song)}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
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

            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className={`text-body-md text-body-md truncate ${isActive ? 'text-primary' : 'text-on-background'}`}>
                {song.title}
              </p>
              <p className="text-body-sm text-body-sm text-secondary truncate">
                {song.artist}
              </p>
            </div>

            <span className="text-label-sm text-label-sm text-secondary-fixed-dim hidden sm:block">
              {formatTime(song.duration)}
            </span>

            <button
              className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              onClick={(e) => { e.stopPropagation(); handleContextMenu(e, song) }}
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        )
      })}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          song={contextMenu.song}
          playlists={playlists}
          onSelect={addToPlaylist}
          onRemove={removeFromPlaylist}
          selectedPlaylist={selectedPlaylist}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

export default TrackList
