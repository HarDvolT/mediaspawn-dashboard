import { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, Clock, GitBranch, Activity, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface NotificationStats {
  pendingActions: number
  blockedRequests: number
  activePipelines: number
}

interface AgentActivity {
  id: string
  agent_name: string
  task: string
  status: string
  created_at: string
}

export default function NotificationsCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [stats, setStats] = useState<NotificationStats>({
    pendingActions: 0,
    blockedRequests: 0,
    activePipelines: 0,
  })
  const [activities, setActivities] = useState<AgentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch notifications data
  const fetchNotifications = async () => {
    try {
      const [pendingRes, blockedRes, pipelinesRes, logsRes] = await Promise.all([
        supabase.from('staged_actions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('input_requests').select('id', { count: 'exact', head: true }).eq('status', 'blocked'),
        supabase.from('pipeline_runs').select('id', { count: 'exact', head: true }).eq('status', 'running'),
        supabase.from('agent_logs').select('id, agent_name, task, status, created_at').order('created_at', { ascending: false }).limit(5),
      ])

      setStats({
        pendingActions: pendingRes.count || 0,
        blockedRequests: blockedRes.count || 0,
        activePipelines: pipelinesRes.count || 0,
      })
      setActivities(logsRes.data || [])
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const totalPending = stats.pendingActions + stats.blockedRequests

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {totalPending > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
            {totalPending > 99 ? '99+' : totalPending}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl z-50"
          style={{
            background: '#0d0e14',
            border: '1px solid #1e2030',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#1e2030' }}>
            <h3 className="text-white font-semibold">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-800 rounded w-3/4" />
                    <div className="h-2 bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Stats Section */}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.2)' }}>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Pending Approvals</p>
                    <p className="text-xs text-gray-500">Staged actions awaiting review</p>
                  </div>
                  <span className="text-lg font-bold text-amber-400">{stats.pendingActions}</span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Blocked Requests</p>
                    <p className="text-xs text-gray-500">Input requests requiring attention</p>
                  </div>
                  <span className="text-lg font-bold text-red-400">{stats.blockedRequests}</span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
                    <GitBranch className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Active Pipelines</p>
                    <p className="text-xs text-gray-500">Currently running workflows</p>
                  </div>
                  <span className="text-lg font-bold text-violet-400">{stats.activePipelines}</span>
                </div>
              </div>

              {/* Recent Activity Section */}
              <div className="border-t" style={{ borderColor: '#1e2030' }}>
                <div className="px-4 py-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Recent Agent Activity</p>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {activities.length === 0 ? (
                    <div className="px-4 py-3 text-center text-gray-500 text-sm">
                      No recent activity
                    </div>
                  ) : (
                    activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800/50 transition-colors"
                      >
                        <Activity className={`w-4 h-4 ${
                          activity.status === 'completed' ? 'text-emerald-400' :
                          activity.status === 'running' ? 'text-violet-400' :
                          activity.status === 'failed' ? 'text-red-400' :
                          'text-amber-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-300 truncate">{activity.agent_name}</p>
                          <p className="text-xs text-gray-500 truncate">{activity.task}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          activity.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                          activity.status === 'running' ? 'bg-violet-500/20 text-violet-400' :
                          activity.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
