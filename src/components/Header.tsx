import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
  isMobile?: boolean
}

export default function Header({ title, onMenuClick, isMobile }: HeaderProps) {
  const [connected, setConnected] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from('agent_registry').select('id').limit(1)
        setConnected(!error)
      } catch {
        setConnected(false)
      }
    }
    checkConnection()
  }, [])

  return (
    <header 
      className="flex items-center justify-between px-4 md:px-6 py-4" 
      style={{ borderBottom: '1px solid #1e2030', background: '#0d0e14' }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile hamburger menu */}
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors -ml-2"
          >
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Gateway status badge */}
        <div 
          className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: connected === true ? 'rgba(16,185,129,0.1)' : connected === false ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)',
            border: `1px solid ${
              connected === true ? 'rgba(16,185,129,0.3)' : connected === false ? 'rgba(239,68,68,0.3)' : 'rgba(100,116,139,0.3)'
            }`,
            color: connected === true ? '#34d399' : connected === false ? '#f87171' : '#94a3b8',
          }}
        >
          <span 
            className={`w-1.5 h-1.5 rounded-full ${
              connected === true ? 'bg-emerald-400 animate-pulse' : connected === false ? 'bg-red-400' : 'bg-slate-400'
            }`} 
          />
          <span className="hidden sm:inline">
            Gateway {connected === true ? 'Connected' : connected === false ? 'Disconnected' : 'Checking...'}
          </span>
        </div>

        {/* Avatar placeholder */}
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          MS
        </div>
      </div>
    </header>
  )
}
