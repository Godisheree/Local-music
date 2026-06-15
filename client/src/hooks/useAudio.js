import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Howl } from 'howler'

let ytReadyCallbacks = [];
let ytLoaded = false;

function loadYoutubeAPI(callback) {
  if (window.YT && window.YT.Player) {
    callback();
    return;
  }
  ytReadyCallbacks.push(callback);
  if (ytLoaded) return;
  ytLoaded = true;

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  window.onYouTubeIframeAPIReady = () => {
    ytReadyCallbacks.forEach(cb => cb());
    ytReadyCallbacks = [];
  };
}

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.7)
  const [currentSong, setCurrentSong] = useState(null)
  const [loopMode, setLoopMode] = useState('off') // 'off', 'all', 'one'
  
  const soundRef = useRef(null)
  const ytPlayerRef = useRef(null)
  const activePlayerRef = useRef(null) // 'howler' or 'youtube'
  const intervalRef = useRef(null)
  const seekingRef = useRef(false)
  const volumeRef = useRef(0.7) // Track volume via ref untuk avoid stale closure
  const ytIdCacheRef = useRef(new Map()) // Cache YouTube IDs tanpa mutasi song object

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
      if (activePlayerRef.current === 'howler' && soundRef.current && soundRef.current.playing()) {
        setCurrentTime(soundRef.current.seek() || 0)
      } else if (activePlayerRef.current === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        setCurrentTime(ytPlayerRef.current.getCurrentTime() || 0)
      }
    }, 250)
  }

  const load = useCallback(async (url, song, format = 'mp3') => {
    setLoading(true);

    // Stop current playbacks
    if (soundRef.current) {
      soundRef.current.unload()
      soundRef.current = null
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
      try {
        ytPlayerRef.current.stopVideo()
      } catch (e) {}
    }
    clearTimer()
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)

    const isYoutube = song.youtube_id || song.youtubeId || !song.filepath || song.filepath.startsWith('online:') || song.filepath.startsWith('youtube:');

    if (isYoutube) {
      activePlayerRef.current = 'youtube'
      setCurrentSong(song)

      let videoId = song.youtube_id || song.youtubeId;
      
      // Cek cache terlebih dahulu
      if (!videoId && ytIdCacheRef.current.has(song.mbid || song.id)) {
        videoId = ytIdCacheRef.current.get(song.mbid || song.id);
      }
      
      if (!videoId) {
        if (song.filepath?.startsWith('youtube:')) {
          videoId = song.filepath.split(':')[1];
        } else {
          try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || '';
            const res = await fetch(`${apiBase}/api/songs/get-youtube-id?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}`);
            const data = await res.json();
            videoId = data.videoId;
            // Cache via ref, JANGAN mutasi song object
            if (videoId && (song.mbid || song.id)) {
              ytIdCacheRef.current.set(song.mbid || song.id, videoId);
            }
          } catch (err) {
            console.error('Failed to get YouTube ID:', err)
            setLoading(false)
            return
          }
        }
      }

      if (!videoId) {
        console.error('No video ID resolved for:', song.title)
        setLoading(false)
        return
      }

      loadYoutubeAPI(() => {
        // Hapus existing element sebelum buat baru untuk hindari ID duplikat
        let container = document.getElementById('yt-player-placeholder');
        
        if (!ytPlayerRef.current) {
          // Buat container baru jika belum ada
          if (container) {
            container.remove();
          }
          container = document.createElement('div');
          container.id = 'yt-player-placeholder';
          container.style.position = 'absolute';
          container.style.top = '-9999px';
          container.style.left = '-9999px';
          container.style.width = '1px';
          container.style.height = '1px';
          container.style.pointerEvents = 'none';
          document.body.appendChild(container);

          ytPlayerRef.current = new window.YT.Player('yt-player-placeholder', {
            height: '1',
            width: '1',
            videoId: videoId,
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              modestbranding: 1,
              rel: 0,
              showinfo: 0
            },
            events: {
              onReady: (e) => {
                // Gunakan volumeRef untuk volume terkini, bukan stale closure
                e.target.setVolume(volumeRef.current * 100);
                e.target.playVideo();
                setLoading(false);
              },
              onStateChange: (e) => {
                // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED
                if (e.data === 1) {
                  setIsPlaying(true)
                  setLoading(false)
                  setDuration(e.target.getDuration() || 0)
                  startTimer()
                } else if (e.data === 2) {
                  setIsPlaying(false)
                  clearTimer()
                } else if (e.data === 0) {
                  setIsPlaying(false)
                  clearTimer()
                  setCurrentTime(0)
                  window.dispatchEvent(new CustomEvent('song-ended'))
                }
              },
              onError: (e) => {
                console.error('YouTube Player error:', e.data)
                setIsPlaying(false)
                setLoading(false)
              }
            }
          });
        } else {
          ytPlayerRef.current.loadVideoById({ videoId });
          ytPlayerRef.current.setVolume(volumeRef.current * 100);
        }
      });
    } else {
      activePlayerRef.current = 'howler'
      setCurrentSong(song)

      const sound = new Howl({
        src: [url],
        format: [format === 'mpeg' ? 'mp3' : format],
        html5: true,
        volume: volumeRef.current,
        onplay: () => {
          setIsPlaying(true)
          setDuration(sound.duration() || 0)
          startTimer()
          setLoading(false)
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
          setLoading(false)
        },
        onplayerror: (_id, err) => {
          console.error('Audio play error:', err)
          setIsPlaying(false)
          setLoading(false)
        }
      })

      soundRef.current = sound
      sound.play()
    }
  }, []) // Hapus volume dari deps — gunakan volumeRef

  const play = useCallback(() => {
    if (activePlayerRef.current === 'howler' && soundRef.current) {
      soundRef.current.play()
    } else if (activePlayerRef.current === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
      ytPlayerRef.current.playVideo()
    }
  }, [])

  const pause = useCallback(() => {
    if (activePlayerRef.current === 'howler' && soundRef.current) {
      soundRef.current.pause()
    } else if (activePlayerRef.current === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      ytPlayerRef.current.pauseVideo()
    }
  }, [])

  const seek = useCallback((time) => {
    seekingRef.current = true
    setCurrentTime(time)
    if (activePlayerRef.current === 'howler' && soundRef.current) {
      soundRef.current.seek(time)
    } else if (activePlayerRef.current === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(time, true)
    }
  }, [])

  const endSeek = useCallback(() => {
    seekingRef.current = false
  }, [])

  const setVolume = useCallback((vol) => {
    volumeRef.current = vol // Update ref untuk avoid stale closure
    setVolumeState(vol)
    if (activePlayerRef.current === 'howler' && soundRef.current) {
      soundRef.current.volume(vol)
    } else if (activePlayerRef.current === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(vol * 100)
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
    if (loopMode === 'one') {
      seek(0)
      play()
    }
  }, [loopMode, seek, play])

  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unload()
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try {
          ytPlayerRef.current.destroy()
        } catch (e) {}
      }
      clearTimer()
    }
  }, [])

  // useMemo untuk return object yang stabil — mencegah infinite re-render saat digunakan sebagai dependency
  return useMemo(() => ({
    isPlaying,
    loading,
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
  }), [isPlaying, loading, currentTime, duration, volume, currentSong, loopMode, load, play, pause, seek, endSeek, setVolume, toggleLoopMode, repeatCurrentSong])
}
