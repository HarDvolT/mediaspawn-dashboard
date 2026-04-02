import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

// Types
interface SpawnedAgent {
  id: string
  name: string
  type: string
  status: 'active' | 'idle' | 'completed' | 'failed'
  template_id: string | null
  template_name: string | null
  model: string
  lifetime_tasks: number
  lifetime_revenue: number
  token_cost: number
  created_at: string
  last_seen: string | null
  completed_at: string | null
}

interface TemplateUsage {
  template_id: string
  template_name: string
  usage_count: number
}

// Loading Skeleton
function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-700 animate-pulse rounded-xl ${className}`} />
}

// Progress Bar Component
function ProgressBar({ value, max }: { value: number; max: number }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-violet-500 transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

// Agent Card Component
function AgentCard({ agent }: { agent: SpawnedAgent }) {
  const statusStyles = {
    active: 'bg-violet-500/20 text-violet-400',
    idle: 'bg-gray-700 text-gray-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-red-500/20 text-red-400',
  }

  const lastSeenText = agent.last_seen
    ? formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true })
    : agent.completed_at
    ? `Completed ${formatDistanceToNow(new Date(agent.completed_at), { addSuffix: true })}`
    : 'Never'

  return (
    <div className="bg-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{agent.name}</h3>
            <p className="text-gray-500 text-xs">{agent.model}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[agent.status]}`}>
          {agent.status}
        </span>
      </div>

      {agent.template_name && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-gray-400">Template:</span>
          <span className="text-white">{agent.template_name}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
        <div>
          <p className="text-gray-500 text-xs">Tasks</p>
          <p className="text-white font-medium">{agent.lifetime_tasks}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Revenue</p>
          <p className="text-emerald-400 font-medium">${agent.lifetime_revenue.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Token Cost</p>
          <p className="text-amber-400 font-medium">{agent.token_cost.toLocaleString()}</p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">Lifetime Progress</span>
          <span className="text-gray-400">{agent.lifetime_tasks} tasks</span>
        </div>
        <ProgressBar value={agent.lifetime_tasks} max={100} />
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Clock className="w-3 h-3" />
        <span>{lastSeenText}</span>
      </div>
    </div>
  )
}

// Archived Agent Row Component
function ArchivedAgentRow({ agent }: { agent: SpawnedAgent }) {
  return (
    <tr className="border-b border-gray-800">
      <td className="py-3 px-4 text-white">{agent.name}</td>
      <td className="py-3 px-4 text-gray-400">{agent.model}</td>
      <td className="py-3 px-4">
        <span className="text-emerald-400">{agent.lifetime_tasks}</span>
      </td>
      <td className="py-3 px-4">
        <span className="text-emerald-400">${agent.lifetime_revenue.toLocaleString()}</span>
      </td>
      <td className="py-3 px-4 text-gray-500 text-sm">
        {agent.completed_at
          ? formatDistanceToNow(new Date(agent.completed_at), { addSuffix: true })
          : '-'}
      </td>
    </tr>
  )
}

export default function SpawnedAgents() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeAgents, setActiveAgents] = useState<SpawnedAgent[]>([])
  const [archivedAgents, setArchivedAgents] = useState<SpawnedAgent[]>([])
  const [templateUsage, setTemplateUsage] = useState<TemplateUsage[]>([])
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    async function fetchAgents() {
      try {
        setLoading(true)

        // Fetch active spawned agents
        const activeRes = await supabase
          .from('spawned_agents')
          .select('*')
          .in('status', ['active', 'idle'])
          .order('created_at', { ascending: false })

        if (activeRes.error) throw activeRes.error
        setActiveAgents(activeRes.data || [])

        // Fetch archived spawned agents
        const archivedRes = await supabase
          .from('spawned_agents')
          .select('*')
          .in('status', ['completed', 'failed'])
          .order('completed_at', { ascending: false })
          .limit(20)

        if (archivedRes.error) throw archivedRes.error
        setArchivedAgents(archivedRes.data || [])

        // Calculate template usage from active agents
        const templateCounts: Record<string, { name: string; count: number }> = {}
        ;(activeRes.data || []).forEach((agent) => {
          if (agent.template_id) {
            if (!templateCounts[agent.template_id]) {
              templateCounts[agent.template_id] = {
                name: agent.template_name || 'Unknown',
                count: 0,
              }
            }
            templateCounts[agent.template_id].count++
          }
        })

        const usageArr: TemplateUsage[] = Object.entries(templateCounts)
          .map(([template_id, { name, count }]) => ({
            template_id,
            template_name: name,
            usage_count: count,
          }))
          .filter((t) => t.usage_count >= 3)
          .sort((a, b) => b.usage_count - a.usage_count)

        setTemplateUsage(usageArr)

        setError(null)
      } catch (err) {
        console.error('Failed to load spawned agents:', err)
        setError('Failed to load spawned agents data')
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [])

  const templatesNeedingPromotion = templateUsage.filter((t) => t.usage_count >= 3)

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Promotion Suggestion Banner */}
      {templatesNeedingPromotion.length > 0 && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-violet-400 mt-0.5" />
            <div>
              <h4 className="text-white font-medium">Template Promotion Suggestion</h4>
              <p className="text-gray-400 text-sm mt-1">
                The following templates have been used {''}
                <span className="text-violet-400 font-medium">3+ times</span> and may be good
                candidates for promoting to a core agent:
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {templatesNeedingPromotion.map((template) => (
                  <span
                    key={template.template_id}
                    className="bg-violet-500/20 text-violet-300 text-sm px-3 py-1 rounded-full"
                  >
                    {template.template_name} ({template.usage_count} uses)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Spawned Agents */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Active Spawned Agents</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} className="h-48" />
            ))}
          </div>
        ) : activeAgents.length === 0 ? (
          <div className="text-gray-500 text-center py-12 bg-gray-800/30 rounded-xl">
            No active spawned agents
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>

      {/* Archived Agents Accordion */}
      <div className="bg-gray-800/30 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gray-400" />
            <h3 className="text-white font-medium">Archived Agents</h3>
            <span className="text-gray-500 text-sm">({archivedAgents.length})</span>
          </div>
          {showArchived ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showArchived && (
          <div className="border-t border-gray-800">
            {archivedAgents.length === 0 ? (
              <div className="p-8 text-gray-500 text-center">No archived agents</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Model</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Tasks</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Revenue</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedAgents.map((agent) => (
                      <ArchivedAgentRow key={agent.id} agent={agent} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}