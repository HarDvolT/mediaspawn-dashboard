import { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  Clock,
  Bot,
  LineChart,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react'
import {
  LineChart as RechartsLine,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { supabase } from '../lib/supabase'

// Types
interface AnalyticsStats {
  revenueThisMonth: number
  pipelineSuccessRate: number
  avgPipelineDuration: number
  tokenCost: number
}

interface RevenueData {
  date: string
  revenue: number
}

interface TokenCostByAgent {
  agent_name: string
  total_cost: number
}

interface PipelineStatus {
  status: string
  count: number
}

interface TasksPerDay {
  date: string
  tasks: number
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

// Loading Skeleton
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
  value: string
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

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<AnalyticsStats>({
    revenueThisMonth: 0,
    pipelineSuccessRate: 0,
    avgPipelineDuration: 0,
    tokenCost: 0,
  })
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [tokenCostByAgent, setTokenCostByAgent] = useState<TokenCostByAgent[]>([])
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus[]>([])
  const [tasksPerDay, setTasksPerDay] = useState<TasksPerDay[]>([])

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)

        // Fetch revenue this month
        const revenueRes = await supabase.rpc('get_revenue_this_month')
        const revenueThisMonth = revenueRes.data || 0

        // Fetch pipeline success rate
        const totalPipelinesRes = await supabase
          .from('pipeline_runs')
          .select('id', { count: 'exact', head: true })
        const completedPipelinesRes = await supabase
          .from('pipeline_runs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed')

        const totalPipelines = totalPipelinesRes.count || 0
        const completedPipelines = completedPipelinesRes.count || 0
        const pipelineSuccessRate =
          totalPipelines > 0 ? Math.round((completedPipelines / totalPipelines) * 100) : 0

        // Fetch average pipeline duration
        const pipelinesForDuration = await supabase
          .from('pipeline_runs')
          .select('created_at, completed_at')
          .not('completed_at', 'is', null)

        let avgDuration = 0
        if (pipelinesForDuration.data && pipelinesForDuration.data.length > 0) {
          const durations = pipelinesForDuration.data.map((p) => {
            const start = new Date(p.created_at).getTime()
            const end = new Date(p.completed_at!).getTime()
            return (end - start) / (1000 * 60) // minutes
          })
          avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        }

        // Fetch token cost this month
        const tokenRes = await supabase
          .from('agent_logs')
          .select('token_cost')
          .gte('started_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

        let tokenCost = 0
        if (tokenRes.data) {
          tokenCost = tokenRes.data.reduce((sum, log) => sum + (log.token_cost || 0), 0)
        }

        setStats({
          revenueThisMonth,
          pipelineSuccessRate,
          avgPipelineDuration: avgDuration,
          tokenCost,
        })

        // Fetch revenue over time (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const revenueOverTimeRes = await supabase
          .from('pipeline_runs')
          .select('created_at, revenue')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .eq('status', 'completed')

        // Group by date
        const revenueByDate: Record<string, number> = {}
        if (revenueOverTimeRes.data) {
          revenueOverTimeRes.data.forEach((p) => {
            const date = new Date(p.created_at).toISOString().split('T')[0]
            revenueByDate[date] = (revenueByDate[date] || 0) + (p.revenue || 0)
          })
        }

        const revenueArr: RevenueData[] = []
        for (let i = 29; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          revenueArr.push({
            date: dateStr.slice(5), // MM-DD format
            revenue: revenueByDate[dateStr] || 0,
          })
        }
        setRevenueData(revenueArr)

        // Fetch token cost by agent
        const tokenByAgentRes = await supabase
          .from('agent_logs')
          .select('agent_name, token_cost')
          .gte('started_at', thirtyDaysAgo.toISOString())

        const tokenByAgent: Record<string, number> = {}
        if (tokenByAgentRes.data) {
          tokenByAgentRes.data.forEach((log) => {
            tokenByAgent[log.agent_name] =
              (tokenByAgent[log.agent_name] || 0) + (log.token_cost || 0)
          })
        }

        const tokenArr: TokenCostByAgent[] = Object.entries(tokenByAgent)
          .map(([agent_name, total_cost]) => ({ agent_name, total_cost }))
          .sort((a, b) => b.total_cost - a.total_cost)
          .slice(0, 10)
        setTokenCostByAgent(tokenArr)

        // Fetch pipeline status distribution
        const statusRes = await supabase
          .from('pipeline_runs')
          .select('status')

        const statusCounts: Record<string, number> = {
          running: 0,
          completed: 0,
          failed: 0,
          blocked: 0,
        }
        if (statusRes.data) {
          statusRes.data.forEach((p) => {
            if (statusCounts[p.status] !== undefined) {
              statusCounts[p.status]++
            }
          })
        }

        const statusArr: PipelineStatus[] = Object.entries(statusCounts)
          .filter(([_, count]) => count > 0)
          .map(([status, count]) => ({ status, count }))
        setPipelineStatus(statusArr)

        // Fetch tasks completed per day (last 14 days)
        const fourteenDaysAgo = new Date()
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

        const tasksRes = await supabase
          .from('agent_logs')
          .select('started_at')
          .gte('started_at', fourteenDaysAgo.toISOString())
          .eq('status', 'completed')

        const tasksByDate: Record<string, number> = {}
        if (tasksRes.data) {
          tasksRes.data.forEach((log) => {
            const date = new Date(log.started_at).toISOString().split('T')[0]
            tasksByDate[date] = (tasksByDate[date] || 0) + 1
          })
        }

        const tasksArr: TasksPerDay[] = []
        for (let i = 13; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          tasksArr.push({
            date: dateStr.slice(5),
            tasks: tasksByDate[dateStr] || 0,
          })
        }
        setTasksPerDay(tasksArr)

        setError(null)
      } catch (err) {
        console.error('Failed to load analytics:', err)
        setError('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  const formatTokens = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toString()
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
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
              icon={DollarSign}
              label="Revenue This Month"
              value={formatCurrency(stats.revenueThisMonth)}
              accentColor="#10b981"
            />
            <StatCard
              icon={TrendingUp}
              label="Pipeline Success Rate"
              value={`${stats.pipelineSuccessRate}%`}
              accentColor="#8b5cf6"
            />
            <StatCard
              icon={Clock}
              label="Avg Pipeline Duration"
              value={formatDuration(stats.avgPipelineDuration)}
              accentColor="#06b6d4"
            />
            <StatCard
              icon={Bot}
              label="Token Cost This Month"
              value={formatTokens(stats.tokenCost)}
              accentColor="#f59e0b"
            />
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <LineChart className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-semibold text-white">Revenue Over Time</h3>
          </div>
          {loading ? (
            <SkeletonCard className="h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <RechartsLine data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: '#8b5cf6' }}
                />
              </RechartsLine>
            </ResponsiveContainer>
          )}
        </div>

        {/* Token Cost by Agent */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Token Cost by Agent</h3>
          </div>
          {loading ? (
            <SkeletonCard className="h-64" />
          ) : tokenCostByAgent.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No token data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={tokenCostByAgent} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={formatTokens} />
                <YAxis
                  type="category"
                  dataKey="agent_name"
                  stroke="#9ca3af"
                  fontSize={11}
                  width={80}
                  tickFormatter={(v) => (v.length > 10 ? v.slice(0, 10) + '...' : v)}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value) => [`${value}`, 'Tokens']}
                />
                <Bar dataKey="total_cost" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Status Distribution */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Pipeline Status Distribution</h3>
          </div>
          {loading ? (
            <SkeletonCard className="h-64" />
          ) : pipelineStatus.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No pipeline data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPie>
                <Pie
                  data={pipelineStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="status"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {pipelineStatus.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tasks Completed Per Day */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Tasks Completed Per Day</h3>
          </div>
          {loading ? (
            <SkeletonCard className="h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={tasksPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value) => [value, 'Tasks']}
                />
                <Area
                  type="monotone"
                  dataKey="tasks"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}