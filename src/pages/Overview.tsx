import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  GitBranch,
  Clock,
  Bot,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  FileText,
  Database,
  Mail,
  Code,
  BarChart3,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useRealtime } from '../hooks/useRealtime'
import QuickActions from '../components/QuickActions'

// Types
interface StatCards {
  activePipelines: number
  pendingApprovals: number
  agentsActive: number
  revenueThisMonth: number
}

interface Agent {
  id: string
  name: string
  type: 'core' | 'spawned'
  status: 'active' | 'idle' | 'stalled'
  model: string
  last_task: string | null
  last_seen: string | null
}

interface PipelineRun {
  id: string
  pipeline_name: string
  client_name: string | null
  status: 'running' | 'blocked' | 'completed' | 'failed'
  created_at: string
  progress: number
}

interface StagedAction {
  id: string
  type: string
  summary: string
  agent_name: string
  status: string
  created_at: string
}

interface AgentLog {
  id: string
  agent_name: string
  task: string
  status: 'completed' | 'failed' | 'blocked' | 'running'
  pipeline_name: string | null
  started_at: string
  completed_at: string | null
}

// Loading Skeleton Component
function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-700 animate-pulse rounded-xl ${className}`} />
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  accentColor,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  accentColor: string
}) {
  return (
    <div
      className="bg-gray-800 rounded-xl p-6 relative overflow-hidden"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-white text-3xl font-bold mt-1">{value}</p>
        </div>
        <span style={{ color: accentColor }}>
          <Icon className="w-8 h-8 opacity-50" />
        </span>
      </div>
    </div>
  )
}

// Agent Card Component
function AgentCard({ agent }: { agent: Agent }) {
  const typeBadgeStyle =
    agent.type === 'core' ? 'bg-gray-600 text-gray-200' : 'bg-violet-600 text-white'

  const statusStyles = {
    active: 'bg-violet-500/20 text-violet-400',
    idle: 'bg-gray-700 text-gray-400',
    stalled: 'bg-amber-500/20 text-amber-400',
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-white font-semibold">{agent.name}</h3>
        <div className="flex gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadgeStyle}`}>
            {agent.type}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[agent.status]}`}>
            {agent.status}
          </span>
        </div>
      </div>
      <p className="text-gray-500 text-xs truncate mb-1">{agent.model}</p>
      {agent.last_task && (
        <p className="text-gray-400 text-sm line-clamp-2 mb-2">{agent.last_task}</p>
      )}
      {agent.last_seen && (
        <p className="text-gray-500 text-xs">
          Last seen: {formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true })}
        </p>
      )}
    </div>
  )
}

// Pipeline Row Component
function PipelineRow({ pipeline }: { pipeline: PipelineRun }) {
  const statusColors = {
    running: 'bg-violet-500',
    blocked: 'bg-amber-500',
    completed: 'bg-emerald-500',
    failed: 'bg-red-500',
  }

  const elapsed = formatDistanceToNow(new Date(pipeline.created_at), { addSuffix: false })

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{pipeline.pipeline_name}</p>
        <p className="text-gray-500 text-xs truncate">{pipeline.client_name || 'No client'}</p>
      </div>
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          pipeline.status === 'running'
            ? 'bg-violet-500/20 text-violet-400'
            : 'bg-amber-500/20 text-amber-400'
        }`}
      >
        {pipeline.status}
      </span>
      <span className="text-gray-400 text-sm w-16 text-right">{elapsed}</span>
      <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${statusColors[pipeline.status]} transition-all`}
          style={{ width: `${pipeline.progress || 0}%` }}
        />
      </div>
    </div>
  )
}

// Staged Action Row Component
function StagedActionRow({ action }: { action: StagedAction }) {
  const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    db_migration: Database,
    email: Mail,
    script: Code,
    report: BarChart3,
    deployment: Zap,
    default: FileText,
  }

  const Icon = typeIcons[action.type] || typeIcons.default
  const timePending = formatDistanceToNow(new Date(action.created_at), { addSuffix: true })

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-300 text-sm truncate">{action.summary}</p>
        <p className="text-gray-500 text-xs">{action.agent_name}</p>
      </div>
      <span className="text-gray-400 text-xs">{timePending}</span>
    </div>
  )
}

// Activity Log Row Component
function ActivityLogRow({ log }: { log: AgentLog }) {
  const statusConfig = {
    completed: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: CheckCircle },
    failed: { color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle },
    blocked: { color: 'text-amber-400', bg: 'bg-amber-500/20', icon: AlertTriangle },
    running: { color: 'text-violet-400', bg: 'bg-violet-500/20', icon: Activity },
  }

  const config = statusConfig[log.status]
  const duration = log.completed_at
    ? formatDistanceToNow(new Date(log.started_at), { addSuffix: false })
    : 'In progress'

  return (
    <tr className="border-b border-gray-800">
      <td className="py-3 px-4 text-gray-300 text-sm">{log.agent_name}</td>
      <td className="py-3 px-4 text-gray-400 text-sm truncate max-w-xs">{log.task}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {log.status === 'running' && (
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          )}
          <config.icon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
            {log.status}
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-gray-500 text-sm">{log.pipeline_name || '-'}</td>
      <td className="py-3 px-4 text-gray-400 text-sm">{duration}</td>
    </tr>
  )
}

export default function Overview() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<StatCards>({
    activePipelines: 0,
    pendingApprovals: 0,
    agentsActive: 0,
    revenueThisMonth: 0,
  })
  const [agents, setAgents] = useState<Agent[]>([])
  const [pipelines, setPipelines] = useState<PipelineRun[]>([])
  const [stagedActions, setStagedActions] = useState<StagedAction[]>([])
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([])

  // Fetch all data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch stats
        const [activePipelinesRes, pendingApprovalsRes, agentsActiveRes, revenueRes] =
          await Promise.all([
            supabase.from('pipeline_runs').select('id', { count: 'exact', head: true }).eq('status', 'running'),
            supabase.from('staged_actions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('agent_registry').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.rpc('get_revenue_this_month'),
          ])

        setStats({
          activePipelines: activePipelinesRes.count || 0,
          pendingApprovals: pendingApprovalsRes.count || 0,
          agentsActive: agentsActiveRes.count || 0,
          revenueThisMonth: revenueRes.data || 0,
        })

        // Fetch agents
        const { data: agentsData, error: agentsError } = await supabase
          .from('agent_registry')
          .select('*')
          .order('type', { ascending: true })
          .order('name', { ascending: true })

        if (agentsError) throw agentsError
        setAgents(agentsData || [])

        // Fetch pipelines
        const { data: pipelinesData, error: pipelinesError } = await supabase
          .from('pipeline_runs')
          .select('*')
          .in('status', ['running', 'blocked'])
          .order('created_at', { ascending: false })
          .limit(5)

        if (pipelinesError) throw pipelinesError
        setPipelines(pipelinesData || [])

        // Fetch staged actions
        const { data: actionsData, error: actionsError } = await supabase
          .from('staged_actions')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(5)

        if (actionsError) throw actionsError
        setStagedActions(actionsData || [])

        // Fetch agent logs
        const { data: logsData, error: logsError } = await supabase
          .from('agent_logs')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(10)

        if (logsError) throw logsError
        setAgentLogs(logsData || [])

        setError(null)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Realtime subscriptions
  useRealtime<Agent>('agent_registry', ({ eventType, new: newAgent, old }) => {
    setAgents((prev) => {
      if (eventType === 'INSERT') return [...prev, newAgent].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
      if (eventType === 'UPDATE') return prev.map((a) => (a.id === newAgent.id ? newAgent : a))
      if (eventType === 'DELETE') return prev.filter((a) => a.id !== old.id)
      return prev
    })
  })

  useRealtime<PipelineRun>('pipeline_runs', ({ eventType, new: newPipeline, old }) => {
    setPipelines((prev) => {
      if (eventType === 'INSERT' && ['running', 'blocked'].includes(newPipeline.status)) {
        return [newPipeline, ...prev].slice(0, 5)
      }
      if (eventType === 'UPDATE') {
        const filtered = prev.filter((p) => p.id !== newPipeline.id)
        return ['running', 'blocked'].includes(newPipeline.status)
          ? [newPipeline, ...filtered].slice(0, 5)
          : filtered
      }
      if (eventType === 'DELETE') return prev.filter((p) => p.id !== old.id)
      return prev
    })
  })

  useRealtime<StagedAction>('staged_actions', ({ eventType, new: newAction, old }) => {
    setStagedActions((prev) => {
      if (eventType === 'INSERT' && newAction.status === 'pending') {
        return [...prev, newAction].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).slice(0, 5)
      }
      if (eventType === 'UPDATE') {
        const filtered = prev.filter((a) => a.id !== newAction.id)
        return newAction.status === 'pending'
          ? [...filtered, newAction].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).slice(0, 5)
          : filtered
      }
      if (eventType === 'DELETE') return prev.filter((a) => a.id !== old.id)
      return prev
    })
  })

  useRealtime<AgentLog>('agent_logs', ({ eventType, new: newLog, old }) => {
    setAgentLogs((prev) => {
      if (eventType === 'INSERT') return [newLog, ...prev].slice(0, 10)
      if (eventType === 'UPDATE') return prev.map((l) => (l.id === newLog.id ? newLog : l))
      if (eventType === 'DELETE') return prev.filter((l) => l.id !== old.id)
      return prev
    })
  })

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* SECTION 1: Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonCard className="h-24" />
            <SkeletonCard className="h-24" />
            <SkeletonCard className="h-24" />
            <SkeletonCard className="h-24" />
          </>
        ) : (
          <>
            <StatCard
              icon={GitBranch}
              label="Active Pipelines"
              value={stats.activePipelines}
              accentColor="#8b5cf6"
            />
            <StatCard
              icon={Clock}
              label="Pending Approvals"
              value={stats.pendingApprovals}
              accentColor="#f59e0b"
            />
            <StatCard
              icon={Bot}
              label="Agents Active"
              value={stats.agentsActive}
              accentColor="#06b6d4"
            />
            <StatCard
              icon={DollarSign}
              label="Revenue This Month"
              value={`$${stats.revenueThisMonth.toLocaleString()}`}
              accentColor="#10b981"
            />
          </>
        )}
      </div>

      {/* SECTION 1.5: Quick Actions */}
      <QuickActions
        pendingApprovals={stats.pendingApprovals}
        onApproveAll={() => {
          setStats(prev => ({ ...prev, pendingApprovals: 0 }))
          setStagedActions([])
        }}
      />

      {/* SECTION 2: Agent Status Grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Agent Status</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} className="h-32" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No agents registered</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Middle Row (60/40) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Active Pipelines (60%) */}
        <div className="lg:col-span-3">
          <h2 className="text-lg font-semibold text-white mb-4">Active Pipelines</h2>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} className="h-16" />
              ))}
            </div>
          ) : pipelines.length === 0 ? (
            <div className="text-gray-500 text-center py-8 bg-gray-800/30 rounded-lg">
              No active pipelines
            </div>
          ) : (
            <div className="space-y-2">
              {pipelines.map((pipeline) => (
                <PipelineRow key={pipeline.id} pipeline={pipeline} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Pending Approvals (40%) */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Pending Approvals</h2>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} className="h-16" />
              ))}
            </div>
          ) : stagedActions.length === 0 ? (
            <div className="text-gray-500 text-center py-8 bg-gray-800/30 rounded-lg">
              No pending approvals
            </div>
          ) : (
            <div className="space-y-2">
              {stagedActions.map((action) => (
                <StagedActionRow key={action.id} action={action} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        {loading ? (
          <SkeletonCard className="h-64" />
        ) : agentLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-8 bg-gray-800/30 rounded-lg">
            No recent activity
          </div>
        ) : (
          <div className="bg-gray-800/30 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Agent</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Task</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Pipeline</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {agentLogs.map((log) => (
                  <ActivityLogRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
