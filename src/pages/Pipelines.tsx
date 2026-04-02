import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { PipelineRun } from '../types'
import { Search, Filter, Play, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  pending: { icon: <Clock className="w-4 h-4" />, color: 'text-slate-400', bg: 'bg-slate-500/20' },
  active: { icon: <Play className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  completed: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  failed: { icon: <XCircle className="w-4 h-4" />, color: 'text-red-400', bg: 'bg-red-500/20' },
  blocked: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-orange-400', bg: 'bg-orange-500/20' }
}

export default function Pipelines() {
  const [pipelines, setPipelines] = useState<PipelineRun[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [agentFilter, setAgentFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null)
  const [agents, setAgents] = useState<string[]>([])
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, number>>({})
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch pipelines
  const fetchPipelines = useCallback(async () => {
    let query = supabase
      .from('pipeline_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }
    if (agentFilter !== 'all') {
      query = query.eq('agent_id', agentFilter)
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59')
    }
    if (searchQuery) {
      query = query.ilike('task_brief', `%${searchQuery}%`)
    }

    const { data } = await query
    setPipelines(data || [])
    setLoading(false)
  }, [statusFilter, agentFilter, dateFrom, dateTo, searchQuery])

  // Fetch unique agents
  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await supabase
        .from('pipeline_runs')
        .select('agent_id')
      if (data) {
        const uniqueAgents = [...new Set(data.map(p => p.agent_id))]
        setAgents(uniqueAgents)
      }
    }
    fetchAgents()
  }, [])

  // Initial fetch
  useEffect(() => {
    setLoading(true)
    fetchPipelines()
  }, [fetchPipelines])

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('pipelines-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_runs' }, () => fetchPipelines())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPipelines])

  // Update elapsed times for running pipelines
  useEffect(() => {
    const updateElapsed = () => {
      const now = Date.now()
      const newElapsed: Record<string, number> = {}
      pipelines.forEach(p => {
        if (p.status === 'active' && p.started_at) {
          newElapsed[p.id] = now - new Date(p.started_at).getTime()
        }
      })
      setElapsedTimes(newElapsed)
    }

    updateElapsed()
    elapsedIntervalRef.current = setInterval(updateElapsed, 1000)

    return () => {
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current)
      }
    }
  }, [pipelines])

  // Format elapsed time
  const formatElapsed = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    }
    return `${seconds}s`
  }

  // Calculate progress percentage
  const getProgress = (pipeline: PipelineRun) => {
    if (pipeline.status === 'completed') return 100
    if (!pipeline.total_steps) return 0
    return Math.round(((pipeline.completed_steps || 0) / pipeline.total_steps) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Pipelines</h2>
          <p className="text-slate-400 text-sm mt-1">
            Monitor active and historical pipeline executions
          </p>
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
            placeholder="Search pipelines..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg"
            style={{ background: '#13141a', border: '1px solid #1e2030', color: '#fff' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg"
          style={{ background: '#13141a', border: '1px solid #1e2030', color: '#fff' }}
        >
          <option value="all">All Status</option>
          <option value="active">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="blocked">Blocked</option>
          <option value="pending">Pending</option>
        </select>

        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg"
          style={{ background: '#13141a', border: '1px solid #1e2030', color: '#fff' }}
        >
          <option value="all">All Agents</option>
          {agents.map(agent => (
            <option key={agent} value={agent}>{agent}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg"
          style={{ background: '#13141a', border: '1px solid #1e2030', color: '#fff' }}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg"
          style={{ background: '#13141a', border: '1px solid #1e2030', color: '#fff' }}
        />
      </div>

      {/* Pipeline Cards */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse rounded-xl p-4" style={{ background: '#13141a' }}>
              <div className="flex justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-700 rounded w-1/4" />
                </div>
                <div className="w-20 h-6 bg-slate-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : pipelines.length > 0 ? (
        <div className="space-y-3">
          {pipelines.map(pipeline => {
            const config = statusConfig[pipeline.status] || statusConfig.pending
            const progress = getProgress(pipeline)
            const isExpanded = expandedPipeline === pipeline.id

            return (
              <div
                key={pipeline.id}
                className="rounded-xl transition-all"
                style={{ background: '#13141a', border: '1px solid #1e2030' }}
              >
                {/* Card Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedPipeline(isExpanded ? null : pipeline.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                          {config.icon}
                          {pipeline.status}
                        </span>
                        {pipeline.status === 'active' && elapsedTimes[pipeline.id] && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {formatElapsed(elapsedTimes[pipeline.id])}
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-medium mt-2 truncate">
                        {pipeline.task_brief || `Pipeline ${pipeline.id.slice(0, 8)}`}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2 text-sm text-slate-400">
                        <span>Agent: {pipeline.agent_id}</span>
                        {pipeline.client_id && (
                          <>
                            <span>•</span>
                            <span>Client: {pipeline.client_id}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(pipeline.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <div className="text-slate-400">Progress</div>
                        <div className="text-white font-medium">{progress}%</div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: '#1e2030' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: pipeline.status === 'failed' ? '#ef4444' : pipeline.status === 'active' ? '#10b981' : '#3b82f6'
                      }}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-800">
                    {/* Step Timeline */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Agents Involved</h4>
                      {pipeline.agents_involved && pipeline.agents_involved.length > 0 ? (
                        <div className="space-y-2">
                          {pipeline.agents_involved.map((agent, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                                style={{
                                  background: idx < (pipeline.completed_steps || 0) ? '#3b82f6' : '#1e2030',
                                  color: idx < (pipeline.completed_steps || 0) ? '#fff' : '#64748b'
                                }}
                              >
                                {idx + 1}
                              </div>
                              <span className="text-sm text-slate-300">{agent}</span>
                              {idx < (pipeline.completed_steps || 0) && (
                                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No agents recorded</p>
                      )}
                    </div>

                    {/* Pipeline Details */}
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Started:</span>
                        <span className="text-slate-300 ml-2">
                          {pipeline.started_at ? new Date(pipeline.started_at).toLocaleString() : 'Not started'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Completed:</span>
                        <span className="text-slate-300 ml-2">
                          {pipeline.completed_at ? new Date(pipeline.completed_at).toLocaleString() : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Current Step:</span>
                        <span className="text-slate-300 ml-2">
                          {pipeline.current_step || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Steps:</span>
                        <span className="text-slate-300 ml-2">
                          {pipeline.completed_steps || 0} / {pipeline.total_steps || '?'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: '#13141a' }}
          >
            <Filter className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400">No pipelines found</p>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  )
}
