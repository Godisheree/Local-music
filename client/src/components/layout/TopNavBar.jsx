function TopNavBar({ searchQuery, setSearchQuery, scanLibrary, scanning }) {
  return (
    <header className="hidden md:flex fixed top-0 right-0 left-64 z-30 h-16 items-center justify-between px-6 bg-background/80 backdrop-blur-xl border-b border-outline-variant/20">
      <div className="flex items-center gap-4">
        <div className="relative search-glow rounded-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary-fixed-dim text-[20px]">search</span>
          <input
            type="text"
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80 bg-surface-container rounded-full pl-10 pr-4 py-2.5 text-body-sm text-body-sm text-on-background placeholder:text-secondary-fixed-dim/50 border-none outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors"
          onClick={scanLibrary}
          disabled={scanning}
        >
          <span className="material-symbols-outlined">{scanning ? 'hourglass_empty' : 'settings'}</span>
        </button>
      </div>
    </header>
  )
}

export default TopNavBar
