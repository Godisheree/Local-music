function NowPlayingDesktop({ currentSong, isPlaying }) {
  if (!currentSong) return null

  return (
    <div className="hidden xl:flex xl:flex-col fixed right-0 top-16 bottom-24 w-80 bg-surface-container-low border-l border-outline-variant/20 p-6 z-30">
      {/* Album Art */}
      <div className="w-full aspect-square rounded-2xl overflow-hidden album-glow bg-surface-variant flex items-center justify-center mb-6">
        {currentSong.cover_art_url ? (
          <img src={currentSong.cover_art_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-secondary-fixed-dim text-[80px]">library_music</span>
        )}
      </div>

      {/* Track Info */}
      <div className="flex flex-col">
        <h2 className="text-headline-md text-headline-md text-on-background truncate">{currentSong.title}</h2>
        <p className="text-title-sm text-title-sm text-secondary-fixed-dim mt-1">{currentSong.artist}</p>
        {currentSong.album && currentSong.album !== 'Unknown Album' && (
          <p className="text-body-sm text-body-sm text-secondary mt-1">{currentSong.album}</p>
        )}
      </div>

      {/* Playing indicator */}
      {isPlaying && (
        <div className="flex items-center gap-2 mt-4">
          <div className="flex items-end h-5">
            <span className="playing-bar" />
            <span className="playing-bar" />
            <span className="playing-bar" />
            <span className="playing-bar" />
          </div>
          <span className="text-label-sm text-label-sm text-primary">Now Playing</span>
        </div>
      )}
    </div>
  )
}

export default NowPlayingDesktop
