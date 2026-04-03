import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import NotificationsCenter from './NotificationsCenter'

export default function Header({ title }: { title: string }) {
  const [connected, setConnected] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from('agents').select('id').limit(1)
        setConnected(!error)
      } catch {
        setConnected(false)
      }
    }
    checkConnection()
  }, [])

  return (
    <header 
      className="flex items-center justify-between px-6 py-4" 
      style={{ borderBottom: '1px solid #1e2030', background: '#0d0e14' }}
    >
      <h1 className="text-lg font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-4">
        {/* Notifications Center */}
        <NotificationsCenter />
        
        {/* Gateway status badge */}
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: connected === true 
              ? 'rgba(16,185,129,0.1)' 
              : connected === false 
                ? 'rgba(239,68,68,0.1)' 
                : 'rgba(100,116,139,0.1)',
            border: `1px solid ${
              connected === true 
                ? 'rgba(16,185,129,0.3)' 
                : connected === false 
                  ? 'rgba(239,68,68,0.3)' 
                  : 'rgba(100,116,139,0.3)'
            }`,
            color: connected === true 
              ? '#34d399' 
              : connected === false 
                ? '#f87171' 
                : '#94a3b8',
          }}
        >
          <span 
            className={`w-1.5 h-1.5 rounded-full ${
              connected === true 
                ? 'bg-emerald-400 animate-pulse' 
                : connected === false 
                  ? 'bg-red-400' 
                  : 'bg-slate-400'
            }`} 
          />
          Gateway {connected === true ? 'Connected' : connected === false ? 'Disconnected' : 'Checking...'}
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
