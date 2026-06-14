import { useState, useRef } from 'react'
import TrackList from '../shared/TrackList'
import ContextMenu from '../shared/ContextMenu'
import { formatTime } from '../../utils/formatTime'

function LibraryPage({ songs, playlists, currentSong, isPlaying, onPlay, selectedPlaylist, setSelectedPlaylist, addToPlaylist, removeFromPlaylist, createPlaylist, deletePlaylist, searchQuery, setSearchQuery }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [contextMenu, setContextMenu] = useState(null)
  const filters = ['All', 'Playlists', 'Artists', 'Albums']

  const filteredSongs = songs.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.album.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentSongList = selectedPlaylist ? selectedPlaylist.songs : filteredSongs

  const handleContextMenu = (e, song) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, song })
  }

  return (
    <div className="flex flex-col gap-section-stack">
      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {filters.map(f => (
            <button
              key={f}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-label-bold text-label-bold active:scale-95 transition-all ${
                activeFilter === f.toLowerCase()
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-background hover:bg-surface-variant'
              }`}
              onClick={() => setActiveFilter(f.toLowerCase())}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <h1 className="text-display-lg text-display-lg text-on-background mb-1">Your Library</h1>
        <p className="text-body-md text-body-md text-secondary-fixed-dim">{songs.length} Songs</p>
      </div>

      {/* Search (mobile) */}
      <div className="md:hidden">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary-fixed-dim text-[20px]">search</span>
          <input
            type="text"
            placeholder="Search songs, artists, albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container rounded-lg pl-10 pr-4 py-2.5 text-body-sm text-body-sm text-on-background placeholder:text-secondary-fixed-dim/50 border-none outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Mobile Section Header */}
      <div className="flex justify-between items-center md:hidden">
        <h2 className="text-title-sm text-title-sm text-on-background">
          {selectedPlaylist ? selectedPlaylist.name : 'Recently Added'}
        </h2>
        <div className="flex gap-4">
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">swap_vert</span>
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">grid_view</span>
          </button>
        </div>
      </div>

      {/* Desktop sidebar filters + content */}
      <div className="flex gap-8">
        {/* Desktop filter sidebar */}
        <div className="hidden lg:block w-48 shrink-0 sticky top-20 self-start">
          <p className="text-label-bold text-label-bold text-secondary-fixed-dim uppercase tracking-wider mb-3">Filter By</p>
          <div className="flex flex-col gap-1">
            {[
              { id: 'all', label: 'All Songs', icon: 'queue_music' },
              ...playlists.map(pl => ({ id: `pl-${pl.id}`, label: pl.name, icon: 'playlist_play', playlist: pl }))
            ].map(item => (
              <button
                key={item.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-body-sm text-body-sm transition-colors ${
                  (item.id === 'all' && !selectedPlaylist) || (item.playlist && selectedPlaylist?.id === item.playlist.id)
                    ? 'text-primary bg-primary/10'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-background'
                }`}
                onClick={() => {
                  if (item.playlist) {
                    setSelectedPlaylist(item.playlist)
                  } else {
                    setSelectedPlaylist(null)
                  }
                }}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: Card Track List */}
        <div className="flex-1 min-w-0 md:hidden">
          <TrackList
            songs={currentSongList}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={onPlay}
            playlists={playlists}
            addToPlaylist={addToPlaylist}
            removeFromPlaylist={removeFromPlaylist}
            selectedPlaylist={selectedPlaylist}
          />
        </div>

        {/* Desktop: Table Track List */}
        <div className="hidden md:block flex-1 min-w-0">
          {currentSongList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-[64px] text-secondary-fixed-dim/30 mb-4">library_music</span>
              <p className="text-title-sm text-title-sm text-secondary-fixed-dim">No songs found</p>
              <p className="text-body-sm text-body-sm text-secondary-fixed-dim/60 mt-1">Tap Scan Library to find music files</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/30 text-label-bold text-label-bold text-secondary-fixed-dim uppercase tracking-wider">
                  <th className="text-left py-3 px-2 w-10">#</th>
                  <th className="text-left py-3 px-2">Title</th>
                  <th className="text-left py-3 px-2 hidden lg:table-cell">Album</th>
                  <th className="text-right py-3 px-2 w-20">Duration</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {currentSongList.map((song, idx) => {
                  const isActive = currentSong?.id === song.id
                  return (
                    <tr
                      key={song.id}
                      className={`group cursor-pointer transition-colors border-b border-outline-variant/10 ${
                        isActive ? 'bg-primary/10' : 'hover:bg-surface-container-high'
                      }`}
                      onClick={() => onPlay(song, currentSongList)}
                      onContextMenu={(e) => handleContextMenu(e, song)}
                    >
                      <td className="py-2 px-2 w-10 text-center">
                        {isActive && isPlaying ? (
                          <div className="flex items-end justify-center h-4">
                            <span className="playing-bar" />
                            <span className="playing-bar" />
                            <span className="playing-bar" />
                            <span className="playing-bar" />
                          </div>
                        ) : (
                          <span className="text-label-sm text-label-sm text-secondary-fixed-dim group-hover:hidden">{idx + 1}</span>
                        )}
                        {!isActive && (
                          <span className="material-symbols-outlined text-[20px] text-on-background hidden group-hover:inline-block">play_arrow</span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-surface-variant flex items-center justify-center">
                            <span className="material-symbols-outlined text-secondary-fixed-dim text-[18px]">music_note</span>
                          </div>
                          <div className="min-w-0">
                            <p className={`text-body-md text-body-md truncate ${isActive ? 'text-primary' : 'text-on-background'}`}>{song.title}</p>
                            <p className="text-body-sm text-body-sm text-secondary truncate">{song.artist}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2 hidden lg:table-cell">
                        <span className="text-body-sm text-body-sm text-secondary truncate">{song.album}</span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className={`text-label-sm text-label-sm ${isActive ? 'text-primary' : 'text-secondary-fixed-dim'}`}>
                          {formatTime(song.duration)}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <button
                          className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); handleContextMenu(e, song) }}
                        >
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

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

export default LibraryPage
