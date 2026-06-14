function MiniPlayer({ currentSong, isPlaying, progress, onPlayPause, onNext, onClick }) {
  if (!currentSong) return null

  return (
    <div
      className="fixed bottom-20 left-0 right-0 z-40 mx-container-margin md:hidden w-[calc(100%-2.5rem)] bg-glass rounded-lg p-2 flex items-center gap-3 border border-white/5 shadow-lg cursor-pointer"
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 bg-surface-variant flex items-center justify-center">
        <span className="material-symbols-outlined text-secondary-fixed-dim text-[20px]">music_note</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-label-bold text-label-bold text-on-background truncate">{currentSong.title}</p>
        <p className="text-label-sm text-label-sm text-secondary truncate">{currentSong.artist}</p>
      </div>

      <div className="flex items-center gap-2 pr-2">
        <button
          className="w-8 h-8 flex items-center justify-center text-on-background hover:text-primary transition-colors"
          onClick={(e) => { e.stopPropagation(); onPlayPause() }}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center text-on-background hover:text-primary transition-colors"
          onClick={(e) => { e.stopPropagation(); onNext() }}
        >
          <span className="material-symbols-outlined">skip_next</span>
        </button>
      </div>

      {/* Progress bar line at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-surface-variant rounded-b-lg overflow-hidden">
        <div className="h-full bg-primary transition-[width] duration-250" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export default MiniPlayer
