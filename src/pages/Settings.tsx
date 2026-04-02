import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { AgentRegistry, CronJob } from '../types'
import { 
  Settings as SettingsIcon, 
  Server, 
  Database, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Save
} from 'lucide-react'

interface SystemStatus {
  gateway: 'online' | 'offline' | 'unknown'
  supabase: 'connected' | 'disconnected' | 'unknown'
  lastCron: string | null
}

interface AppSettings {
  timezone: string
  dateFormat: string
  notifications: {
    email: boolean
    browser: boolean
    slack: boolean
  }
}

export default function Settings() {
  const [agents, setAgents] = useState<AgentRegistry[]>([])
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    gateway: 'unknown',
    supabase: 'unknown',
    lastCron: null
  })
  const [settings, setSettings] = useState<AppSettings>({
    timezone: 'Africa/Lagos',
    dateFormat: 'DD/MM/YYYY',
    notifications: {
      email: true,
      browser: true,
      slack: false
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Fetch agents
      const { data: agentData } = await supabase
        .from('agent_registry')
        .select('*')
        .order('name')

      if (agentData) setAgents(agentData)

      // Fetch cron jobs
      const { data: cronData } = await supabase
        .from('cron_jobs')
        .select('*')
        .order('name')

      if (cronData) setCronJobs(cronData)

      // Test Supabase connection
      const { error } = await supabase.from('agent_registry').select('id').limit(1)
      setSystemStatus(prev => ({
        ...prev,
        supabase: error ? 'disconnected' : 'connected'
      }))

      // Fetch last cron run
      const { data: lastCronLog } = await supabase
        .from('agent_logs')
        .select('created_at')
        .eq('event_type', 'notification')
        .order('created_at', { ascending: false })
        .limit(1)

      if (lastCronLog && lastCronLog.length > 0) {
        setSystemStatus(prev => ({
          ...prev,
          lastCron: lastCronLog[0].created_at
        }))
      }

      // Load settings from localStorage
      const savedSettings = localStorage.getItem('dashboard_settings')
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings))
        } catch {
          // Use defaults
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  // Save settings
  const handleSaveSettings = () => {
    setSaving(true)
    localStorage.setItem('dashboard_settings', JSON.stringify(settings))
    setTimeout(() => setSaving(false), 500)
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: 'online' | 'connected' | 'offline' | 'disconnected' | 'unknown' }) => {
    const config = {
      online: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: <CheckCircle2 className="w-4 h-4" /> },
      connected: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: <CheckCircle2 className="w-4 h-4" /> },
      offline: { color: 'text-red-400', bg: 'bg-red-500/20', icon: <XCircle className="w-4 h-4" /> },
      disconnected: { color: 'text-red-400', bg: 'bg-red-500/20', icon: <XCircle className="w-4 h-4" /> },
      unknown: { color: 'text-slate-400', bg: 'bg-slate-500/20', icon: <AlertTriangle className="w-4 h-4" /> }
    }
    const { color, bg, icon } = config[status]

    return (
      <span className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${bg} ${color}`}>
        {icon}
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-slate-400 text-sm mt-1">
          System configuration and agent management
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse rounded-xl p-6" style={{ background: '#13141a' }}>
              <div className="h-4 bg-slate-700 rounded w-1/4 mb-4" />
              <div className="space-y-3">
                <div className="h-3 bg-slate-700 rounded w-1/2" />
                <div className="h-3 bg-slate-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* System Status */}
          <div 
            className="rounded-xl p-6"
            style={{ background: '#13141a', border: '1px solid #1e2030' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Server className="w-5 h-5 text-violet-400" />
              <h3 className="text-sm font-medium text-white">System Status</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className="p-4 rounded-lg"
                style={{ background: '#0d0e14' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Gateway</span>
                  <StatusBadge status={systemStatus.gateway} />
                </div>
                <p className="text-xs text-slate-500">OpenClaw Gateway Service</p>
              </div>

              <div 
                className="p-4 rounded-lg"
                style={{ background: '#0d0e14' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Supabase</span>
                  <StatusBadge status={systemStatus.supabase} />
                </div>
                <p className="text-xs text-slate-500">Database Connection</p>
              </div>

              <div 
                className="p-4 rounded-lg"
                style={{ background: '#0d0e14' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Last Cron</span>
                  <span className="text-xs text-slate-300">
                    {systemStatus.lastCron 
                      ? new Date(systemStatus.lastCron).toLocaleString()
                      : 'Never'
                    }
                  </span>
                </div>
                <p className="text-xs text-slate-500">Automated Tasks</p>
              </div>
            </div>
          </div>

          {/* Agent Registry */}
          <div 
            className="rounded-xl p-6"
            style={{ background: '#13141a', border: '1px solid #1e2030' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-5 h-5 text-violet-400" />
              <h3 className="text-sm font-medium text-white">Agent Registry</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e2030' }}>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Agent</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Version</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.length > 0 ? (
                    agents.map(agent => (
                      <tr key={agent.id} className="border-t border-slate-800">
                        <td className="px-4 py-3 text-sm text-white font-medium">{agent.name}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs bg-violet-500/20 text-violet-400">
                            v{agent.version}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            agent.status === 'active' 
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : agent.status === 'idle'
                              ? 'bg-amber-500/20 text-amber-400'
                              : agent.status === 'error'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {agent.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {new Date(agent.last_seen).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-500">
                        No agents registered
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* App Settings */}
          <div 
            className="rounded-xl p-6"
            style={{ background: '#13141a', border: '1px solid #1e2030' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <SettingsIcon className="w-5 h-5 text-violet-400" />
              <h3 className="text-sm font-medium text-white">App Settings</h3>
            </div>

            <div className="space-y-6">
              {/* Timezone */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full md:w-64 px-4 py-2 text-sm rounded-lg"
                  style={{ background: '#0d0e14', border: '1px solid #1e2030', color: '#fff' }}
                >
                  <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>

              {/* Date Format */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Date Format</label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                  className="w-full md:w-64 px-4 py-2 text-sm rounded-lg"
                  style={{ background: '#0d0e14', border: '1px solid #1e2030', color: '#fff' }}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              {/* Notifications */}
              <div>
                <label className="block text-sm text-slate-300 mb-4">Notifications</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, email: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-slate-600 text-violet-500 focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-400">Email notifications</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.browser}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, browser: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-slate-600 text-violet-500 focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-400">Browser notifications</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.slack}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, slack: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-slate-600 text-violet-500 focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-400">Slack notifications</span>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Cron Jobs */}
          {cronJobs.length > 0 && (
            <div 
              className="rounded-xl p-6"
              style={{ background: '#13141a', border: '1px solid #1e2030' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-5 h-5 text-violet-400" />
                <h3 className="text-sm font-medium text-white">Cron Jobs</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e2030' }}>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Name</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Agent</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Schedule</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Next Run</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cronJobs.map(job => (
                      <tr key={job.id} className="border-t border-slate-800">
                        <td className="px-4 py-3 text-sm text-white">{job.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{job.agent_name}</td>
                        <td className="px-4 py-3">
                          <code className="text-xs text-violet-400 bg-slate-800 px-2 py-0.5 rounded">
                            {job.schedule}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            job.status === 'active' 
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : job.status === 'error'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {job.next_run 
                            ? new Date(job.next_run).toLocaleString()
                            : '-'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
