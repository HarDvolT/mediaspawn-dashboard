import { useEffect, useState, useRef } from 'react'
import { Search, Bell, Lock, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
  isMobile?: boolean
}

interface Notification {
  id: string
  type: string
  message: string
  created_at: string
  read: boolean
}

export default function Header({ title, onMenuClick, isMobile }: HeaderProps) {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Check connection status
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

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const { data } = await supabase
          .from('agent_logs')
          .select('id, event_type, task_description, created_at')
          .in('event_type', ['error', 'rate_limit', 'milestone'])
          .order('created_at', { ascending: false })
          .limit(10)

        if (data) {
          const notifs: Notification[] = data.map((log) => ({
            id: log.id,
            type: log.event_type,
            message: log.task_description,
            created_at: log.created_at,
            read: false,
          }))
          setNotifications(notifs)
          setUnreadCount(notifs.filter((n) => !n.read).length)
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
      }
    }
    fetchNotifications()
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_logs' }, (payload) => {
        if (payload.new && ['error', 'rate_limit', 'milestone'].includes(payload.new.event_type)) {
          const newNotif: Notification = {
            id: payload.new.id,
            type: payload.new.event_type,
            message: payload.new.task_description,
            created_at: payload.new.created_at,
            read: false,
          }
          setNotifications((prev) => [newNotif, ...prev].slice(0, 10))
          setUnreadCount((prev) => prev + 1)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLock = () => {
    localStorage.removeItem('dashboard_auth')
    window.location.reload()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '🔴'
      case 'rate_limit':
        return '⚠️'
      case 'milestone':
        return '✅'
      default:
        return '📢'
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 py-3"
      style={{ borderBottom: '1px solid #1e2030', background: '#0d0e14' }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile hamburger menu */}
        {isMobile && (
          <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-gray-700 transition-colors -ml-2">
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search */}
        <div ref={searchRef} className="relative">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            style={{ color: '#94a3b8' }}
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
          
          {searchOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 z-50">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search agents, pipelines..."
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none"
                  style={{ background: '#1e2030', border: '1px solid #2d2f3d' }}
                  autoFocus
                />
              </form>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors relative"
            style={{ color: '#94a3b8' }}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl z-50" style={{ background: '#13141a', border: '1px solid #1e2030' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e2030' }}>
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No notifications
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="px-4 py-3 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getNotificationIcon(notif.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{notif.message}</p>
                          <p className="text-xs" style={{ color: '#64748b' }}>{formatTime(notif.created_at)}</p>
                        </div>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-violet-500 mt-1.5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lock button */}
        <button
          onClick={handleLock}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          style={{ color: '#94a3b8' }}
          title="Lock dashboard"
        >
          <Lock className="w-5 h-5" />
        </button>

        {/* Gateway status badge */}
        <div
          className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: connected === true ? 'rgba(16,185,129,0.1)' : connected === false ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)',
            border: `1px solid ${connected === true ? 'rgba(16,185,129,0.3)' : connected === false ? 'rgba(239,68,68,0.3)' : 'rgba(100,116,139,0.3)'}`,
            color: connected === true ? '#34d399' : connected === false ? '#f87171' : '#94a3b8',
          }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              connected === true ? 'bg-emerald-400 animate-pulse' : connected === false ? 'bg-red-400' : 'bg-slate-400'
            }`}
          />
          <span className="hidden md:inline">
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