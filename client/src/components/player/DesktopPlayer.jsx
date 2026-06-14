import { useRef, useEffect } from 'react'
import { formatTime } from '../../utils/formatTime'

function DesktopPlayer({ isPlaying, currentTime, duration, volume, onPlay, onPause, onSeek, onEndSeek, onVolumeChange, onNext, onPrev, hasSong, loopMode, onToggleLoop, isShuffle, onToggleShuffle, currentSong, sleepTimer, formatTimerDisplay, onOpenTimerModal }) {
  const progressRef = useRef(null)
  const volumeRef = useRef(null)
  const draggingRef = useRef(null)
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  useEffect(() => {
    const handleMove = (e) => {
      if (!draggingRef.current) return
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const { type, rect } = draggingRef.current
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      if (type === 'seek') onSeek(pct * duration)
      else if (type === 'volume') onVolumeChange(pct)
    }
    const handleUp = () => {
      if (draggingRef.current?.type === 'seek') onEndSeek()
      draggingRef.current = null
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    document.addEventListener('touchmove', handleMove, { passive: true })
    document.addEventListener('touchend', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleUp)
    }
  }, [duration, onSeek, onEndSeek, onVolumeChange])

  const startDragSeek = (e) => {
    e.preventDefault()
    const rect = progressRef.current.getBoundingClientRect()
    draggingRef.current = { type: 'seek', rect }
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    onSeek(pct * duration)
  }

  const startDragVolume = (e) => {
    e.preventDefault()
    const rect = volumeRef.current.getBoundingClientRect()
    draggingRef.current = { type: 'volume', rect }
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    onVolumeChange(pct)
  }

  return (
    <div className="hidden md:flex fixed bottom-0 left-64 right-0 z-50 bg-glass-strong h-24 items-center px-4 border-t border-white/5">
      {/* Progress bar on top edge */}
      <div
        className="absolute top-0 left-0 w-full h-[4px] bg-surface-variant cursor-pointer group"
        ref={progressRef}
        onMouseDown={startDragSeek}
        onTouchStart={startDragSeek}
      >
        <div className="h-full bg-primary transition-[width] duration-250" style={{ width: `${progress}%` }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-on-background rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progress}%`, marginLeft: '-6px' }}
        />
      </div>

      {/* Left: Track info */}
      <div className="flex items-center gap-3 w-56 shrink-0">
        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-surface-variant flex items-center justify-center">
          <span className="material-symbols-outlined text-secondary-fixed-dim">music_note</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-body-md text-body-md text-on-background truncate">{currentSong?.title || 'No Track'}</p>
          <p className="text-body-sm text-body-sm text-secondary truncate">{currentSong?.artist || 'Unknown'}</p>
        </div>
      </div>

      {/* Center: Controls + timestamps */}
      <div className="flex-1 flex flex-col items-center gap-1 max-w-[500px] mx-auto">
        <div className="flex items-center gap-4">
          <button
            className={`w-8 h-8 flex items-center justify-center transition-colors active:scale-90 ${isShuffle ? 'text-primary' : 'text-on-surface-variant hover:text-on-background'}`}
            onClick={onToggleShuffle}
            disabled={!hasSong}
          >
            <span className="material-symbols-outlined text-[20px]">shuffle</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-on-background hover:text-on-background/80 active:scale-90 transition-all" onClick={onPrev} disabled={!hasSong}>
            <span className="material-symbols-outlined text-[28px]">skip_previous</span>
          </button>
          <button
            className="w-14 h-14 flex items-center justify-center bg-on-background rounded-full text-background shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all"
            onClick={isPlaying ? onPause : onPlay}
            disabled={!hasSong}
          >
            <span className="material-symbols-outlined fill text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-on-background hover:text-on-background/80 active:scale-90 transition-all" onClick={onNext} disabled={!hasSong}>
            <span className="material-symbols-outlined text-[28px]">skip_next</span>
          </button>
          <button
            className={`w-8 h-8 flex items-center justify-center transition-colors active:scale-90 ${loopMode !== 'off' ? 'text-primary' : 'text-on-surface-variant hover:text-on-background'}`}
            onClick={onToggleLoop}
            disabled={!hasSong}
          >
            <span className="material-symbols-outlined text-[20px]">{loopMode === 'one' ? 'repeat_one' : 'repeat'}</span>
          </button>
        </div>
        <div className="flex items-center gap-2 w-full">
          <span className="text-label-sm text-label-sm text-secondary-fixed-dim w-10 text-right">{formatTime(currentTime)}</span>
          <div className="flex-1 h-1 bg-surface-variant rounded-full" />
          <span className="text-label-sm text-label-sm text-secondary-fixed-dim w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Volume + extras */}
      <div className="flex items-center gap-3 w-56 justify-end shrink-0">
        <button
          className={`w-8 h-8 flex items-center justify-center transition-colors ${sleepTimer ? 'text-primary' : 'text-on-surface-variant hover:text-on-background'}`}
          onClick={onOpenTimerModal}
        >
          <span className="material-symbols-outlined text-[20px]">timer</span>
          {sleepTimer && <span className="text-label-sm text-label-sm text-primary ml-1">{formatTimerDisplay(sleepTimer)}</span>}
        </button>
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
          {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
        </span>
        <div
          className="w-24 h-1.5 bg-surface-variant rounded-full cursor-pointer"
          ref={volumeRef}
          onMouseDown={startDragVolume}
          onTouchStart={startDragVolume}
        >
          <div className="h-full bg-on-surface-variant rounded-full" style={{ width: `${volume * 100}%` }} />
        </div>
      </div>
    </div>
  )
}

export default DesktopPlayer
