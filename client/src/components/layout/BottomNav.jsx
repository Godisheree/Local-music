function BottomNav({ activeTab, setActiveTab, onTimerClick }) {
  const tabs = [
    { id: 'home', icon: 'home', filledIcon: 'home', label: 'Home' },
    { id: 'search', icon: 'search', filledIcon: 'search', label: 'Search' },
    { id: 'library', icon: 'library_music', filledIcon: 'library_music', label: 'Library' },
    { id: 'timer', icon: 'timer', filledIcon: 'timer', label: 'Timer' },
  ]

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-glass-nav flex justify-around items-center h-20 px-4 md:hidden border-none">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-transform duration-200 active:scale-90 ${
            activeTab === tab.id
              ? 'text-primary font-bold'
              : 'text-secondary-fixed-dim hover:text-primary/80'
          }`}
          onClick={() => tab.id === 'timer' ? onTimerClick() : setActiveTab(tab.id)}
        >
          <span
            className="material-symbols-outlined"
            style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            {activeTab === tab.id ? tab.filledIcon : tab.icon}
          </span>
          <span className="text-label-sm text-label-sm">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default BottomNav
