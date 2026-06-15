function HomePage({ songs, currentSong, isPlaying, onPlay }) {
  const recentSongs = songs.slice(0, 8)
  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="flex flex-col gap-section-stack">
      {/* Hero Greeting */}
      <h1 className="text-display-lg text-display-lg text-on-background">{getGreeting()}</h1>

      {/* Quick Access - Bento Grid */}
      <div>
        <h2 className="text-title-sm text-title-sm text-on-background mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {recentSongs.slice(0, 8).map((song, idx) => {
            const isActive = currentSong?.id === song.id
            return (
              <div
                key={song.id}
                className={`relative rounded-xl overflow-hidden cursor-pointer group active:scale-[0.98] transition-transform ${
                  isActive ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-surface-container hover:bg-surface-container-high'
                }`}
                onClick={() => onPlay(song, recentSongs)}
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-surface-variant flex items-center justify-center">
                    {song.cover_art_url ? (
                      <img src={song.cover_art_url} alt="" className="w-full h-full object-cover" />
                    ) : isActive && isPlaying ? (
                      <div className="flex items-end h-4">
                        <span className="playing-bar" />
                        <span className="playing-bar" />
                        <span className="playing-bar" />
                      </div>
                    ) : (
                      <span className="material-symbols-outlined text-secondary-fixed-dim text-[20px]">music_note</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-body-sm text-body-sm truncate ${isActive ? 'text-primary' : 'text-on-background'}`}>{song.title}</p>
                    <p className="text-label-sm text-label-sm text-secondary truncate">{song.artist}</p>
                  </div>
                </div>
                {/* Hover play button */}
                <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.3)] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                  <span className="material-symbols-outlined fill text-on-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isActive && isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recently Played */}
      {recentSongs.length > 0 && (
        <div>
          <h2 className="text-title-sm text-title-sm text-on-background mb-4">Recently Played</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {recentSongs.map(song => {
              const isActive = currentSong?.id === song.id
              return (
                <div
                  key={song.id}
                  className="min-w-[140px] md:min-w-[160px] flex flex-col gap-2 cursor-pointer group active:scale-[0.98] transition-transform"
                  onClick={() => onPlay(song, recentSongs)}
                >
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-surface-variant flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.5)] group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)] transition-shadow">
                    {song.cover_art_url ? (
                      <img src={song.cover_art_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        {isActive && isPlaying ? (
                          <div className="flex items-end h-8">
                            <span className="playing-bar" />
                            <span className="playing-bar" />
                            <span className="playing-bar" />
                            <span className="playing-bar" />
                          </div>
                        ) : (
                          <span className="material-symbols-outlined text-secondary-fixed-dim text-[40px]">library_music</span>
                        )}
                      </>
                    )}
                    <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.3)] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                      <span className="material-symbols-outlined fill text-on-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </div>
                  </div>
                  <p className={`text-body-sm text-body-sm truncate ${isActive ? 'text-primary' : 'text-on-background'}`}>{song.title}</p>
                  <p className="text-label-sm text-label-sm text-secondary truncate">{song.artist}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {songs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-[80px] text-secondary-fixed-dim/30 mb-4">library_music</span>
          <p className="text-title-sm text-title-sm text-secondary-fixed-dim">Your library is empty</p>
          <p className="text-body-sm text-body-sm text-secondary-fixed-dim/60 mt-1">Scan your music library to get started</p>
        </div>
      )}
    </div>
  )
}

export default HomePage
