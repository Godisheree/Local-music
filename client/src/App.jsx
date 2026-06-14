import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { useAudio } from './hooks/useAudio'
import { useSpotify } from './hooks/useSpotify'
import { formatTime } from './utils/formatTime'
import Sidebar from './components/layout/Sidebar'
import TopNavBar from './components/layout/TopNavBar'
import BottomNav from './components/layout/BottomNav'
import MiniPlayer from './components/player/MiniPlayer'
import DesktopPlayer from './components/player/DesktopPlayer'
import NowPlayingFull from './components/player/NowPlayingFull'
import NowPlayingDesktop from './components/player/NowPlayingDesktop'
import HomePage from './components/pages/HomePage'
import LibraryPage from './components/pages/LibraryPage'
import SearchPage from './components/pages/SearchPage'
import TimerModal from './components/shared/TimerModal'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
if (API_BASE) axios.defaults.baseURL = API_BASE

function App() {
  const [songs, setSongs] = useState([])
  const [spotifySongs, setSpotifySongs] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [queue, setQueue] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [scanning, setScanning] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [sleepTimer, setSleepTimer] = useState(null)
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [activeTab, setActiveTab] = useState('library')
  const [npOpen, setNpOpen] = useState(false)
  const sleepTimerRef = useRef(null)

  const audio = useAudio()
  const spotify = useSpotify()

  const getStreamUrl = (songId) => `${API_BASE}/api/songs/${songId}/stream`

  const fetchSongs = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/songs')
      setSongs(data)
    } catch (err) { console.error('Failed to fetch songs:', err) }
  }, [])

  const fetchPlaylists = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/playlists')
      setPlaylists(data)
    } catch (err) { console.error('Failed to fetch playlists:', err) }
  }, [])

  useEffect(() => { fetchSongs(); fetchPlaylists() }, [fetchSongs, fetchPlaylists])

  useEffect(() => {
    const handleSongEnded = () => {
      if (audio.loopMode === 'one') {
        audio.repeatCurrentSong()
      } else {
        if (queue.length === 0 || !audio.currentSong) return
        const idx = queue.findIndex(s => s.id === audio.currentSong.id)
        if (idx < queue.length - 1) {
          const next = queue[idx + 1]
          audio.load(getStreamUrl(next.id), next, next.format || 'mp3')
        } else if (audio.loopMode === 'all' && queue.length > 0) {
          const first = queue[0]
          audio.load(getStreamUrl(first.id), first, first.format || 'mp3')
        }
      }
    }
    window.addEventListener('song-ended', handleSongEnded)
    return () => window.removeEventListener('song-ended', handleSongEnded)
  }, [queue, audio])

  useEffect(() => {
    if (!sleepTimer) {
      if (sleepTimerRef.current) { clearInterval(sleepTimerRef.current); sleepTimerRef.current = null }
      return
    }
    sleepTimerRef.current = setInterval(() => {
      setSleepTimer(prev => {
        if (!prev || prev <= 1) { audio.pause(); return null }
        return prev - 1
      })
    }, 1000)
    return () => { if (sleepTimerRef.current) { clearInterval(sleepTimerRef.current); sleepTimerRef.current = null } }
  }, [!!sleepTimer])

  const playSong = useCallback((song, songList = null) => {
    if (songList) setQueue(songList)
    else setQueue(songs)
    audio.load(getStreamUrl(song.id), song, song.format || 'mp3')
  }, [audio, songs])

  const playNext = useCallback(() => {
    if (queue.length === 0 || !audio.currentSong) return
    const idx = queue.findIndex(s => s.id === audio.currentSong.id)
    if (idx < queue.length - 1) playSong(queue[idx + 1], queue)
    else if (audio.loopMode === 'all') playSong(queue[0], queue)
  }, [queue, audio.currentSong, audio.loopMode, playSong])

  const playPrev = useCallback(() => {
    if (queue.length === 0 || !audio.currentSong) return
    const idx = queue.findIndex(s => s.id === audio.currentSong.id)
    if (idx > 0) playSong(queue[idx - 1], queue)
  }, [queue, audio.currentSong, playSong])

  const scanLibrary = async () => {
    setScanning(true)
    try {
      await axios.post('/api/songs/scan-library')
      await fetchSongs()
    } catch (err) { console.error('Scan failed:', err) }
    setScanning(false)
  }

  const createPlaylist = async (name) => {
    try { await axios.post('/api/playlists', { name, description: '' }); fetchPlaylists() }
    catch (err) { console.error('Failed to create playlist:', err) }
  }

  const addToPlaylist = async (playlistId, songId) => {
    try { await axios.post(`/api/playlists/${playlistId}/add-song`, { songId }); fetchPlaylists() }
    catch (err) { console.error('Failed to add song to playlist:', err) }
  }

  const removeFromPlaylist = async (playlistId, songId) => {
    try { await axios.delete(`/api/playlists/${playlistId}/remove-song/${songId}`); fetchPlaylists() }
    catch (err) { console.error('Failed to remove song from playlist:', err) }
  }

  const deletePlaylist = async (id) => {
    try {
      await axios.delete(`/api/playlists/${id}`)
      fetchPlaylists()
      if (selectedPlaylist?.id === id) setSelectedPlaylist(null)
    } catch (err) { console.error('Failed to delete playlist:', err) }
  }

  const setSleepTimerMinutes = (minutes) => { setSleepTimer(minutes * 60); setShowTimerModal(false) }
  const setSleepTimerCustom = (minutes) => { if (minutes > 0) { setSleepTimer(minutes * 60); setShowTimerModal(false) } }
  const cancelSleepTimer = () => { setSleepTimer(null); if (sleepTimerRef.current) clearInterval(sleepTimerRef.current) }
  const formatTimerDisplay = (seconds) => {
    if (!seconds) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage songs={songs} currentSong={audio.currentSong} isPlaying={audio.isPlaying} onPlay={playSong} />
      case 'search':
        return <SearchPage songs={songs} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onPlay={playSong} currentSong={audio.currentSong} isPlaying={audio.isPlaying} />
      case 'library':
      default:
        return (
          <LibraryPage
            songs={songs}
            playlists={playlists}
            currentSong={audio.currentSong}
            isPlaying={audio.isPlaying}
            onPlay={playSong}
            selectedPlaylist={selectedPlaylist}
            setSelectedPlaylist={setSelectedPlaylist}
            addToPlaylist={addToPlaylist}
            removeFromPlaylist={removeFromPlaylist}
            createPlaylist={createPlaylist}
            deletePlaylist={deletePlaylist}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-body">
      {/* Mobile Header */}
      <header className="md:hidden w-full sticky top-0 z-40 bg-background/80 backdrop-blur-xl flex items-center justify-between px-gutter-md h-touch-target-min">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">person</span>
          </div>
          <h1 className="text-headline-md text-headline-md text-primary font-bold">SoundScape</h1>
        </div>
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-95"
          onClick={scanLibrary}
          disabled={scanning}
        >
          <span className="material-symbols-outlined text-on-surface-variant">{scanning ? 'hourglass_empty' : 'settings'}</span>
        </button>
      </header>

      {/* Desktop Layout */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        playlists={playlists}
        createPlaylist={createPlaylist}
        deletePlaylist={deletePlaylist}
        scanLibrary={scanLibrary}
        scanning={scanning}
        selectedPlaylist={selectedPlaylist}
        setSelectedPlaylist={setSelectedPlaylist}
      />

      <TopNavBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        scanLibrary={scanLibrary}
        scanning={scanning}
      />

      {/* Main Content */}
      <main className="md:ml-64 md:pt-16 pb-32 md:pb-28">
        <div className="px-container-margin md:px-8 pt-4 md:pt-6 max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>

      {/* Desktop Now Playing Panel */}
      <NowPlayingDesktop currentSong={audio.currentSong} isPlaying={audio.isPlaying} />

      {/* Mobile Mini Player */}
      <MiniPlayer
        currentSong={audio.currentSong}
        isPlaying={audio.isPlaying}
        progress={progress}
        onPlayPause={() => audio.isPlaying ? audio.pause() : audio.play()}
        onNext={playNext}
        onClick={() => setNpOpen(true)}
      />

      {/* Desktop Player */}
      <DesktopPlayer
        isPlaying={audio.isPlaying}
        currentTime={audio.currentTime}
        duration={audio.duration}
        volume={audio.volume}
        onPlay={audio.play}
        onPause={audio.pause}
        onSeek={audio.seek}
        onEndSeek={audio.endSeek}
        onVolumeChange={audio.setVolume}
        onNext={playNext}
        onPrev={playPrev}
        hasSong={!!audio.currentSong}
        loopMode={audio.loopMode}
        onToggleLoop={audio.toggleLoopMode}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        currentSong={audio.currentSong}
        sleepTimer={sleepTimer}
        formatTimerDisplay={formatTimerDisplay}
        onOpenTimerModal={() => setShowTimerModal(true)}
      />

      {/* Mobile Bottom Nav */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTimerClick={() => setShowTimerModal(true)}
      />

      {/* Fullscreen Now Playing (Mobile) */}
      {npOpen && (
        <NowPlayingFull
          currentSong={audio.currentSong}
          isPlaying={audio.isPlaying}
          progress={progress}
          currentTime={audio.currentTime}
          duration={audio.duration}
          onPlayPause={() => audio.isPlaying ? audio.pause() : audio.play()}
          onNext={playNext}
          onPrev={playPrev}
          onSeek={audio.seek}
          loopMode={audio.loopMode}
          onToggleLoop={audio.toggleLoopMode}
          isShuffle={isShuffle}
          onToggleShuffle={() => setIsShuffle(!isShuffle)}
          onClose={() => setNpOpen(false)}
          playlistName={selectedPlaylist?.name}
          sleepTimer={sleepTimer}
          formatTimerDisplay={formatTimerDisplay}
        />
      )}

      {/* Timer Modal */}
      {showTimerModal && (
        <TimerModal
          sleepTimer={sleepTimer}
          onSetTimer={setSleepTimerMinutes}
          onSetCustomTimer={setSleepTimerCustom}
          onCancelTimer={cancelSleepTimer}
          formatTimerDisplay={formatTimerDisplay}
          onClose={() => setShowTimerModal(false)}
        />
      )}
    </div>
  )
}

export default App
