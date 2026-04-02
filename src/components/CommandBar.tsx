import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Users,
  FileText,
  Settings,
  Activity,
  Brain,
  BarChart3,
  CheckSquare,
  Plus,
  Command,
  ArrowRight,
  Layers
} from 'lucide-react'

interface Command {
  id: string
  label: string
  shortcut?: string
  icon: React.ReactNode
  category: 'navigation' | 'action' | 'search'
  action: () => void
}

interface CommandBarProps {
  isOpen: boolean
  onClose: () => void
}

export default function CommandBar({ isOpen, onClose }: CommandBarProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const commands: Command[] = [
    // Navigation
    { id: 'nav-overview', label: 'Go to Overview', shortcut: 'g o', icon: <Activity className="w-4 h-4" />, category: 'navigation', action: () => navigate('/') },
    { id: 'nav-pipelines', label: 'Go to Pipelines', shortcut: 'g p', icon: <Layers className="w-4 h-4" />, category: 'navigation', action: () => navigate('/pipelines') },
    { id: 'nav-logs', label: 'Go to Agent Logs', shortcut: 'g l', icon: <FileText className="w-4 h-4" />, category: 'navigation', action: () => navigate('/logs') },
    { id: 'nav-approvals', label: 'Go to Approvals', shortcut: 'g a', icon: <CheckSquare className="w-4 h-4" />, category: 'navigation', action: () => navigate('/approvals') },
    { id: 'nav-clients', label: 'Go to Clients', shortcut: 'g c', icon: <Users className="w-4 h-4" />, category: 'navigation', action: () => navigate('/clients') },
    { id: 'nav-analytics', label: 'Go to Analytics', shortcut: 'g n', icon: <BarChart3 className="w-4 h-4" />, category: 'navigation', action: () => navigate('/analytics') },
    { id: 'nav-memory', label: 'Go to Memory', shortcut: 'g m', icon: <Brain className="w-4 h-4" />, category: 'navigation', action: () => navigate('/memory') },
    { id: 'nav-settings', label: 'Go to Settings', shortcut: 'g s', icon: <Settings className="w-4 h-4" />, category: 'navigation', action: () => navigate('/settings') },
    // Actions
    { id: 'action-new-pipeline', label: 'Create New Pipeline', icon: <Plus className="w-4 h-4" />, category: 'action', action: () => { navigate('/pipelines'); onClose() } },
    { id: 'action-new-client', label: 'Add New Client', icon: <Plus className="w-4 h-4" />, category: 'action', action: () => { navigate('/clients'); onClose() } },
  ]

  const filteredCommands = query
    ? commands.filter(cmd => 
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, Command[]>)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      if (isOpen) onClose()
      else {
        // This would be handled by parent
      }
    }
    if (!isOpen) return

    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault()
      filteredCommands[selectedIndex].action()
      onClose()
    }
  }, [isOpen, onClose, filteredCommands, selectedIndex])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Command Bar */}
      <div 
        className="relative w-full max-w-xl rounded-xl shadow-2xl overflow-hidden"
        style={{ background: '#13141a', border: '1px solid #1e2030' }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid #1e2030' }}>
          <Search className="w-5 h-5 text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500"
          />
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 rounded text-xs text-slate-500" style={{ background: '#0d0e14' }}>
              <Command className="w-3 h-3 inline mr-1" />
              K
            </kbd>
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category}>
              <div className="px-4 py-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  {category}
                </span>
              </div>
              {cmds.map((cmd) => {
                const globalIndex = filteredCommands.indexOf(cmd)
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action()
                      onClose()
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      globalIndex === selectedIndex
                        ? 'bg-violet-600/20 text-white'
                        : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className={globalIndex === selectedIndex ? 'text-violet-400' : 'text-slate-500'}>
                      {cmd.icon}
                    </span>
                    <span className="flex-1 text-sm">{cmd.label}</span>
                    {cmd.shortcut && (
                      <div className="flex items-center gap-1">
                        {cmd.shortcut.split(' ').map((key, i) => (
                          <span key={i}>
                            <kbd className="px-1.5 py-0.5 rounded text-xs text-slate-500" style={{ background: '#0d0e14' }}>
                              {key}
                            </kbd>
                            {i < cmd.shortcut!.split(' ').length - 1 && (
                              <span className="text-slate-600 mx-0.5">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    {globalIndex === selectedIndex && (
                      <ArrowRight className="w-4 h-4 text-violet-400" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
          
          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">
              No commands found for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 flex items-center gap-4 text-xs text-slate-500" style={{ borderTop: '1px solid #1e2030' }}>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded" style={{ background: '#0d0e14' }}>↑</kbd>
            <kbd className="px-1 py-0.5 rounded" style={{ background: '#0d0e14' }}>↓</kbd>
            to navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded" style={{ background: '#0d0e14' }}>↵</kbd>
            to select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded" style={{ background: '#0d0e14' }}>esc</kbd>
            to close
          </span>
        </div>
      </div>
    </div>
  )
}
