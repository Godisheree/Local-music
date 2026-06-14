import { useState, useRef, useCallback, useEffect } from 'react'
import { Howl } from 'howler'

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.7)
  const [currentSong, setCurrentSong] = useState(null)
  const [loopMode, setLoopMode] = useState('off') // 'off', 'all', 'one'
  const soundRef = useRef(null)
  const intervalRef = useRef(null)
  const seekingRef = useRef(false)

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const startTimer = () => {
    clearTimer()
    intervalRef.current = setInterval(() => {
      if (seekingRef.current) return
      if (soundRef.current && soundRef.current.playing()) {
        setCurrentTime(soundRef.current.seek() || 0)
      }
    }, 250)
  }

  const load = useCallback((url, song, format = 'mp3') => {
    if (soundRef.current) {
      soundRef.current.unload()
    }
    clearTimer()

    const sound = new Howl({
      src: [url],
      format: [format === 'mpeg' ? 'mp3' : format],
      html5: true,
      volume: volume,
      onplay: () => {
        setIsPlaying(true)
        setDuration(sound.duration() || 0)
        startTimer()
      },
      onpause: () => {
        setIsPlaying(false)
        clearTimer()
      },
      onstop: () => {
        setIsPlaying(false)
        clearTimer()
        setCurrentTime(0)
      },
      onend: () => {
        setIsPlaying(false)
        clearTimer()
        setCurrentTime(0)
        window.dispatchEvent(new CustomEvent('song-ended'))
      },
      onload: () => {
        setDuration(sound.duration() || 0)
      },
      onloaderror: (_id, err) => {
        console.error('Audio load error:', err)
        setIsPlaying(false)
      },
      onplayerror: (_id, err) => {
        console.error('Audio play error:', err)
        setIsPlaying(false)
      }
    })

    soundRef.current = sound
    setCurrentSong(song)
    sound.play()
  }, [volume])

  const play = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.play()
    }
  }, [])

  const pause = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.pause()
    }
  }, [])

  const seek = useCallback((time) => {
    if (soundRef.current) {
      seekingRef.current = true
      soundRef.current.seek(time)
      setCurrentTime(time)
    }
  }, [])

  const endSeek = useCallback(() => {
    seekingRef.current = false
  }, [])

  const setVolume = useCallback((vol) => {
    setVolumeState(vol)
    if (soundRef.current) {
      soundRef.current.volume(vol)
    }
  }, [])

  const toggleLoopMode = useCallback(() => {
    setLoopMode(prev => {
      const modes = ['off', 'all', 'one']
      const nextIdx = (modes.indexOf(prev) + 1) % modes.length
      return modes[nextIdx]
    })
  }, [])

  const repeatCurrentSong = useCallback(() => {
    if (soundRef.current && loopMode === 'one') {
      soundRef.current.seek(0)
      soundRef.current.play()
    }
  }, [loopMode])

  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unload()
      clearTimer()
    }
  }, [])

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    currentSong,
    loopMode,
    load,
    play,
    pause,
    seek,
    endSeek,
    setVolume,
    toggleLoopMode,
    repeatCurrentSong,
  }
}
