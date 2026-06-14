import { useState } from 'react'

function TimerModal({ sleepTimer, onSetTimer, onSetCustomTimer, onCancelTimer, formatTimerDisplay, onClose }) {
  const [customMinutes, setCustomMinutes] = useState('')

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-surface-container-high rounded-xl p-6 w-[90%] max-w-[360px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-headline-md text-headline-md text-on-background">Sleep Timer</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest text-secondary-fixed-dim"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[10, 20, 30, 40, 50, 60].map(min => (
            <button
              key={min}
              className="py-3 rounded-lg bg-surface-container text-on-background text-body-md text-body-md hover:bg-surface-container-highest active:scale-95 transition-all"
              onClick={() => onSetTimer(min)}
            >
              {min} min
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="number"
            min="1"
            max="999"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            placeholder="Custom minutes"
            className="flex-1 bg-surface-container rounded-lg px-4 py-3 text-body-md text-body-md text-on-background placeholder:text-secondary-fixed-dim/50 border-none outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            className="px-5 py-3 rounded-lg bg-primary text-on-primary text-label-bold text-label-bold active:scale-95 transition-transform"
            onClick={() => {
              const mins = parseInt(customMinutes)
              if (!isNaN(mins) && mins > 0) {
                onSetCustomTimer(mins)
                setCustomMinutes('')
              }
            }}
          >
            Set
          </button>
        </div>

        {sleepTimer && (
          <div className="bg-primary/10 rounded-lg p-4 flex flex-col items-center gap-2">
            <p className="text-body-sm text-body-sm text-primary">
              Timer: {formatTimerDisplay(sleepTimer)} remaining
            </p>
            <button
              className="px-4 py-2 rounded-lg bg-error/20 text-error text-label-bold text-label-bold active:scale-95 transition-transform"
              onClick={onCancelTimer}
            >
              Cancel Timer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TimerModal
