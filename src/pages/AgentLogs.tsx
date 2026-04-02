import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { AgentLog } from '../types'
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Hourglass
} from 'lucide-react'

const statusIcons: Record<string, React.ReactNode> = {
  processing: <Hourglass className="w-4 h-4 text-amber-400" />,
  completed: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
  blocked: <AlertCircle className="w-4 h-4 text-orange-400" />,
  waiting: <Clock className="w-4 h-4 text-blue-400" />
}

const statusColors: Record<string, string> = {
  processing: 'text-amber-400',
  completed: 'text-emerald-400',
  failed: 'text-red-400',
  blocked: 'text-orange-400',
  waiting: 'text-blue-400'
}

export default function AgentLogs() {
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [liveMode, setLiveMode] = useState(false)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [agents, setAgents] = useState<string[]>([])
  const liveIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    let query = supabase
      .from('agent_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (selectedAgent !== 'all') {
      query = query.eq('agent_name', selectedAgent)
    }
    if (selectedType !== 'all') {
      query = query.eq('event_type', selectedType)
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59')
    }
    if (searchQuery) {
      query = query.ilike('task_description', `%${searchQuery}%`)
    }

    const { data } = await query
    setLogs(data || [])
    setLoading(false)
  }, [selectedAgent, selectedType, dateFrom, dateTo, searchQuery])

  // Fetch unique agents
  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await supabase
        .from('agent_logs')
        .select('agent_name')
      
      if (data) {
        const uniqueAgents = [...new Set(data.map(l => l.agent_name))]
        setAgents(uniqueAgents)
      }
    }
    fetchAgents()
  }, [])

  // Initial fetch
  useEffect(() => {
    setLoading(true)
    fetchLogs()
  }, [fetchLogs])

  // Live mode
  useEffect(() => {
    if (liveMode) {
      liveIntervalRef.current = setInterval(fetchLogs, 5000)
    } else {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current)
      }
    }
    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current)
      }
    }
  }, [liveMode, fetchLogs])

  // Export CSV
  const exportCSV = () => {
    const headers = ['Timestamp', 'Agent', 'Type', 'Task', 'Status', 'Pipeline', 'Duration (ms)']
    const rows = logs.map(log => [
      new Date(log.created_at).toISOString(),
      log.agent_name,
      log.event_type,
      `"${log.task_description.replace(/"/g, '""')}"`,
      log.status,
      log.pipeline_run_id || '',
      log.duration_ms?.toString() || ''
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Format duration
  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Agent Logs</h2>
          <p className="text-slate-400 text-sm mt-1">
            Monitor agent activity and task execution
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setLiveMode(!liveMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              liveMode 
                ? 'bg-emerald-600 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            Live {liveMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg"
            style={{ background: '#13141a', border: '1px solid #1e2030', color: '#fff' }}
          />
        </div>
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg"
          style={{ background: '#13141a', border: '1px solid #1e2030', color: '#fff' }}
        >
          <option value="all">All Agents</option>
          {agents.map(agent => (
            <option key={agent} value={agent}>{agent}</option>
          ))}
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg"
          style={{ background: '#13141a', border: '1px solid #1e2030', color: '#fff' }}
        >
          <option value="all">All Types</option>
          <option value="task_start">Task Start</option>
          <option value="task_complete">Task Complete</option>
          <option value="milestone">Milestone</option>
          <option value="error">Error</option>
          <option value="rate_limit">Rate Limit</option>
          <option value="input_request">Input Request</option>
          <option value="notification">Notification</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="From"
          className="px-3 py-2 text-sm rounded-lg"
          style={{ background: '#13141a', border: '1px solid #1e2030', color: '#fff' }}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="To"
          className="px-3 py-2 text-sm rounded-lg"
          style={{ background: '#13141a', border: '1px solid #1e2030', color: '#fff' }}
        />
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse rounded-lg p-4" style={{ background: '#13141a' }}>
              <div className="flex gap-4">
                <div className="h-4 bg-slate-700 rounded w-32" />
                <div className="h-4 bg-slate-700 rounded w-20" />
                <div className="h-4 bg-slate-700 rounded flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length > 0 ? (
        <div className="rounded-xl overflow-hidden" style={{ background: '#13141a', border: '1px solid #1e2030' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2030' }}>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-400 w-44">Timestamp</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-400 w-28">Agent</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-400 w-28">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Task</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-400 w-24">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-400 w-20">Duration</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <>
                    <tr 
                      key={log.id}
                      className="border-t border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-white font-medium">{log.agent_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">
                          {log.event_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-300 line-clamp-1">
                          {log.task_description}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 text-sm ${statusColors[log.status]}`}>
                          {statusIcons[log.status]}
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {formatDuration(log.duration_ms)}
                      </td>
                      <td className="px-4 py-3">
                        {expandedLog === log.id ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr key={`${log.id}-detail`} className="bg-slate-800/30">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="space-y-3">
                            <div>
                              <span className="text-xs text-slate-500 uppercase">Full Description</span>
                              <p className="text-sm text-white mt-1">{log.task_description}</p>
                            </div>
                            {log.output_summary && (
                              <div>
                                <span className="text-xs text-slate-500 uppercase">Output Summary</span>
                                <p className="text-sm text-slate-300 mt-1">{log.output_summary}</p>
                              </div>
                            )}
                            <div className="flex gap-6 text-sm">
                              <div>
                                <span className="text-slate-500">Pipeline ID: </span>
                                <span className="text-slate-300">{log.pipeline_run_id || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Tokens: </span>
                                <span className="text-slate-300">{log.tokens_used?.toLocaleString() || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Rate Limited: </span>
                                <span className="text-slate-300">{log.rpm_limited ? 'Yes' : 'No'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: '#13141a' }}
          >
            <Filter className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400">No logs found</p>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}

      {/* Live indicator */}
      {liveMode && (
        <div 
          className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg"
          style={{ background: '#13141a', border: '1px solid #1e2030' }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-emerald-400 font-medium">Live</span>
        </div>
      )}
    </div>
  )
}
