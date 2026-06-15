import { formatTime } from '../../utils/formatTime'

function NowPlayingFull({ currentSong, isPlaying, progress, currentTime, duration, onPlayPause, onNext, onPrev, onSeek, loopMode, onToggleLoop, isShuffle, onToggleShuffle, isAutoplay, onToggleAutoplay, onClose, playlistName, sleepTimer, formatTimerDisplay }) {
  return (
    <div className="fixed inset-0 z-[60] bg-player-gradient flex flex-col md:hidden">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-gutter-md h-touch-target-min pt-4">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-95 text-on-background"
          onClick={onClose}
        >
          <span className="material-symbols-outlined">keyboard_arrow_down</span>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-label-sm text-label-sm text-secondary-fixed-dim uppercase tracking-widest">Now Playing</span>
          <span className="text-title-sm text-title-sm text-on-background">{playlistName || 'Current Playlist'}</span>
        </div>
        <div className="w-10 h-10" />
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-container-margin">
        {/* Album Art */}
        <div className="w-full max-w-[320px] aspect-square rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-8 bg-surface-variant flex items-center justify-center">
          {currentSong?.cover_art_url ? (
            <img src={currentSong.cover_art_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-secondary-fixed-dim text-[80px]">library_music</span>
          )}
        </div>

        {/* Track Info */}
        <div className="w-full max-w-[320px] flex justify-between items-center mb-6">
          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="text-headline-md text-headline-md text-on-background truncate pr-4">{currentSong?.title || 'No Track'}</h1>
            <p className="text-body-md text-body-md text-secondary-fixed-dim">{currentSong?.artist || 'Unknown'}</p>
          </div>
          <button className="w-10 h-10 flex items-center justify-center text-primary hover:scale-110 transition-transform shrink-0">
            <span className="material-symbols-outlined fill" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-[320px] mb-8">
          <div
            className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden relative cursor-pointer group"
            onMouseDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
              onSeek(pct * duration)
            }}
            onTouchStart={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pct = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width))
              onSeek(pct * duration)
            }}
          >
            <div className="h-full bg-primary rounded-full transition-[width] duration-250" style={{ width: `${progress}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-on-background rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, marginLeft: '-6px' }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-label-sm text-label-sm text-secondary-fixed-dim">{formatTime(currentTime)}</span>
            <span className="text-label-sm text-label-sm text-secondary-fixed-dim">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-[320px] flex justify-between items-center">
          <button
            className={`w-12 h-12 flex items-center justify-center transition-colors active:scale-90 ${isShuffle ? 'text-primary' : 'text-secondary-fixed-dim hover:text-on-background'}`}
            onClick={onToggleShuffle}
          >
            <span className="material-symbols-outlined">shuffle</span>
          </button>
          <button className="w-14 h-14 flex items-center justify-center text-on-background hover:text-on-background/80 active:scale-90 transition-colors" onClick={onPrev}>
            <span className="material-symbols-outlined text-[32px]">skip_previous</span>
          </button>
          <button
            className="w-20 h-20 flex items-center justify-center bg-primary rounded-full text-on-primary-fixed shadow-[0_0_20px_rgba(83,224,118,0.2)] hover:scale-105 active:scale-95 transition-all duration-200"
            onClick={onPlayPause}
          >
            <span className="material-symbols-outlined fill text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button className="w-14 h-14 flex items-center justify-center text-on-background hover:text-on-background/80 active:scale-90 transition-colors" onClick={onNext}>
            <span className="material-symbols-outlined text-[32px]">skip_next</span>
          </button>
          <button
            className={`w-12 h-12 flex items-center justify-center transition-colors active:scale-90 ${loopMode !== 'off' ? 'text-primary' : 'text-secondary-fixed-dim hover:text-on-background'}`}
            onClick={onToggleLoop}
          >
            <span className="material-symbols-outlined">{loopMode === 'one' ? 'repeat_one' : 'repeat'}</span>
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="w-full max-w-[320px] flex justify-between items-center mt-8 px-2">
          <button
            className={`flex items-center gap-2 transition-colors ${isAutoplay ? 'text-primary' : 'text-secondary-fixed-dim hover:text-on-background'}`}
            onClick={onToggleAutoplay}
            title="Auto-play (Radio Mode)"
          >
            <span className="material-symbols-outlined text-[24px]">all_inclusive</span>
          </button>
          {sleepTimer && (
            <span className="text-label-sm text-label-sm text-primary">{formatTimerDisplay(sleepTimer)}</span>
          )}
          <button className="flex items-center gap-2 text-secondary-fixed-dim hover:text-on-background transition-colors">
            <span className="material-symbols-outlined text-[20px]">lyrics</span>
          </button>
        </div>
      </main>
    </div>
  )
}

export default NowPlayingFull
