function ContextMenu({ x, y, song, playlists, onSelect, onRemove, selectedPlaylist, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      <div
        className="fixed z-[101] bg-surface-container-high rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.5)] border border-white/5 py-2 min-w-[180px]"
        style={{ top: Math.min(y, window.innerHeight - 200), left: Math.min(x, window.innerWidth - 200) }}
      >
        <div className="px-3 py-1.5 text-label-sm text-label-sm text-secondary-fixed-dim uppercase tracking-wider">
          Add to playlist
        </div>
        {playlists.map(pl => (
          <button
            key={pl.id}
            className="w-full text-left px-3 py-2 text-body-sm text-body-sm text-on-background hover:bg-surface-container-highest transition-colors"
            onClick={() => { onSelect(pl.id, song.id); onClose() }}
          >
            {pl.name}
          </button>
        ))}
        {selectedPlaylist && (
          <>
            <div className="border-t border-outline-variant my-1" />
            <button
              className="w-full text-left px-3 py-2 text-body-sm text-body-sm text-error hover:bg-surface-container-highest transition-colors"
              onClick={() => { onRemove(selectedPlaylist.id, song.id); onClose() }}
            >
              Remove from {selectedPlaylist.name}
            </button>
          </>
        )}
      </div>
    </>
  )
}

export default ContextMenu
