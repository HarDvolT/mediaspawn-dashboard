import { useEffect, useCallback } from 'react'
import { X, Command, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react'

interface ShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

const shortcuts = [
  { keys: ['Cmd', 'K'], description: 'Open command bar' },
  { keys: ['g', 'o'], description: 'Go to Overview' },
  { keys: ['g', 'p'], description: 'Go to Pipelines' },
  { keys: ['g', 'l'], description: 'Go to Agent Logs' },
  { keys: ['g', 'a'], description: 'Go to Approvals' },
  { keys: ['g', 'c'], description: 'Go to Clients' },
  { keys: ['g', 'n'], description: 'Go to Analytics' },
  { keys: ['g', 'm'], description: 'Go to Memory' },
  { keys: ['g', 's'], description: 'Go to Settings' },
  { keys: ['Esc'], description: 'Close modal / Cancel' },
]

export default function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose()
    }
    if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      // Shift + ? is captured by browser, we use regular ?
    }
  }, [isOpen, onClose])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
        style={{ background: '#13141a', border: '1px solid #1e2030' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1e2030' }}>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Command className="w-5 h-5 text-violet-400" />
            Keyboard Shortcuts
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, i) => (
                    <span key={i}>
                      <kbd 
                        className="px-2 py-1 rounded text-xs font-medium text-slate-300"
                        style={{ background: '#0d0e14', border: '1px solid #2d2f3d' }}
                      >
                        {key === 'Cmd' && navigator.platform.toLowerCase().includes('mac') ? '⌘' : key}
                      </kbd>
                      {i < shortcut.keys.length - 1 && (
                        <span className="text-slate-500 mx-0.5 text-xs">then</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4" style={{ borderTop: '1px solid #1e2030' }}>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ArrowUp className="w-3 h-3" />
            <ArrowDown className="w-3 h-3" />
            <span>navigate</span>
            <span className="mx-2">•</span>
            <CornerDownLeft className="w-3 h-3" />
            <span>select</span>
            <span className="mx-2">•</span>
            <kbd className="px-1.5 py-0.5 rounded" style={{ background: '#0d0e14' }}>Esc</kbd>
            <span>close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
