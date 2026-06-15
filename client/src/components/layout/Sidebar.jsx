import { useState } from 'react'

function Sidebar({ activeTab, setActiveTab, playlists, createPlaylist, deletePlaylist, scanLibrary, scanning, enrichLibrary, enriching, enrichmentStatus, selectedPlaylist, setSelectedPlaylist }) {
  const [newName, setNewName] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleCreate = () => {
    if (newName.trim()) {
      createPlaylist(newName.trim())
      setNewName('')
      setShowInput(false)
    }
  }

  return (
    <aside className="hidden md:flex md:flex-col fixed left-0 top-0 bottom-24 w-64 bg-surface-container-low border-r border-outline-variant/30 z-40">
      {/* Brand */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-title-sm text-title-sm text-primary font-bold">Sonic Obsidian</h1>
        <p className="text-label-sm text-label-sm text-secondary-fixed-dim mt-0.5">Premium Audio</p>
      </div>

      {/* Nav Links */}
      <nav className="px-3 flex flex-col gap-1">
        {[
          { id: 'home', icon: 'home', label: 'Home' },
          { id: 'search', icon: 'search', label: 'Search' },
          { id: 'library', icon: 'library_music', label: 'Library' },
        ].map(item => (
          <button
            key={item.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors active:scale-95 ${
              activeTab === item.id
                ? 'text-primary bg-secondary-container/10'
                : 'text-on-surface-variant hover:text-on-background hover:bg-surface-container'
            }`}
            onClick={() => setActiveTab(item.id)}
          >
            <span
              className="material-symbols-outlined"
              style={activeTab === item.id ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
            <span className="text-body-md text-body-md">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Create Playlist */}
      <div className="px-3 mt-6">
        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-primary text-on-primary text-label-bold text-label-bold active:scale-95 transition-transform hover:bg-primary/90"
          onClick={() => setShowInput(!showInput)}
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Create Playlist
        </button>

        {showInput && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Playlist name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
              className="flex-1 bg-surface-container rounded-lg px-3 py-2 text-body-sm text-body-sm text-on-background placeholder:text-secondary-fixed-dim/50 border-none outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              className="px-3 py-2 rounded-lg bg-primary text-on-primary text-label-bold text-label-bold active:scale-95 transition-transform"
              onClick={handleCreate}
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* Playlists */}
      <div className="flex-1 overflow-y-auto px-3 mt-4">
        <p className="px-3 text-label-bold text-label-bold text-secondary-fixed-dim uppercase tracking-wider mb-2">
          Your Collection
        </p>
        {playlists.map(pl => (
          <div
            key={pl.id}
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group transition-colors ${
              selectedPlaylist?.id === pl.id ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-background'
            }`}
            onClick={() => { setSelectedPlaylist(pl); setActiveTab('library') }}
          >
            <span className="text-body-sm text-body-sm truncate">{pl.name}</span>
            <button
              className="w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-error/20 text-secondary-fixed-dim hover:text-error transition-all"
              onClick={(e) => { e.stopPropagation(); deletePlaylist(pl.id) }}
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto px-3 pb-4 border-t border-outline-variant/30 pt-4 flex flex-col gap-1">
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors active:scale-95"
          onClick={scanLibrary}
          disabled={scanning}
        >
          <span className="material-symbols-outlined text-[20px]">
            {scanning ? 'hourglass_empty' : 'refresh'}
          </span>
          <span className="text-body-sm text-body-sm">{scanning ? 'Scanning...' : 'Scan Library'}</span>
        </button>
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors active:scale-95"
          onClick={enrichLibrary}
          disabled={enriching}
        >
          <span className="material-symbols-outlined text-[20px]">
            {enriching ? 'hourglass_empty' : 'travel_explore'}
          </span>
          <span className="text-body-sm text-body-sm">
            {enriching ? `Enriching... ${enrichmentStatus.enriched}/${enrichmentStatus.total}` : 'Enrich Metadata'}
          </span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
