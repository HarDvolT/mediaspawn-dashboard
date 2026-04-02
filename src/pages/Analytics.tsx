import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import { Calendar } from 'lucide-react'

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e']

type DateRangeOption = '7d' | '30d' | '90d'

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d')
  const [loading, setLoading] = useState(true)
  const [agentActivity, setAgentActivity] = useState<{ agent: string; tasks: number }[]>([])
  const [tokenUsage, setTokenUsage] = useState<{ date: string; tokens: number }[]>([])
  const [pipelineSuccess, setPipelineSuccess] = useState<{ name: string; value: number }[]>([])
  const [tasksCompleted, setTasksCompleted] = useState<{ date: string; tasks: number }[]>([])
  const [stagedByType, setStagedByType] = useState<{ name: string; value: number }[]>([])
  const [revenueTrend, setRevenueTrend] = useState<{ month: string; revenue: number }[]>([])
  const [clientsByStatus, setClientsByStatus] = useState<{ status: string; count: number }[]>([])

  // Calculate date range
  const getDateFilter = () => {
    const now = new Date()
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const start = new Date(now)
    start.setDate(start.getDate() - days)
    return start.toISOString()
  }

  // Fetch analytics data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const startDate = getDateFilter()

      // Agent Activity
      const { data: logs } = await supabase
        .from('agent_logs')
        .select('agent_name')
        .gte('created_at', startDate)
        .eq('event_type', 'task_complete')

      if (logs) {
        const activity: Record<string, number> = {}
        logs.forEach(log => {
          activity[log.agent_name] = (activity[log.agent_name] || 0) + 1
        })
        setAgentActivity(
          Object.entries(activity)
            .map(([agent, tasks]) => ({ agent, tasks }))
            .sort((a, b) => b.tasks - a.tasks)
            .slice(0, 10)
        )
      }

      // Token Usage (daily)
      const { data: tokenLogs } = await supabase
        .from('agent_logs')
        .select('created_at, tokens_used')
        .gte('created_at', startDate)
        .not('tokens_used', 'is', null)

      if (tokenLogs) {
        const dailyTokens: Record<string, number> = {}
        tokenLogs.forEach(log => {
          if (log.tokens_used) {
            const date = new Date(log.created_at).toISOString().split('T')[0]
            dailyTokens[date] = (dailyTokens[date] || 0) + log.tokens_used
          }
        })
        setTokenUsage(
          Object.entries(dailyTokens)
            .map(([date, tokens]) => ({ date: date.slice(5), tokens }))
            .sort((a, b) => a.date.localeCompare(b.date))
        )
      }

      // Pipeline Success
      const { data: pipelines } = await supabase
        .from('pipeline_runs')
        .select('status')
        .gte('created_at', startDate)

      if (pipelines) {
        const success = pipelines.filter(p => p.status === 'completed').length
        const failed = pipelines.filter(p => p.status === 'failed').length
        setPipelineSuccess([
          { name: 'Completed', value: success },
          { name: 'Failed', value: failed }
        ])
      }

      // Tasks Completed (daily)
      const { data: completedLogs } = await supabase
        .from('agent_logs')
        .select('created_at')
        .gte('created_at', startDate)
        .eq('event_type', 'task_complete')

      if (completedLogs) {
        const dailyTasks: Record<string, number> = {}
        completedLogs.forEach(log => {
          const date = new Date(log.created_at).toISOString().split('T')[0]
          dailyTasks[date] = (dailyTasks[date] || 0) + 1
        })
        setTasksCompleted(
          Object.entries(dailyTasks)
            .map(([date, tasks]) => ({ date: date.slice(5), tasks }))
            .sort((a, b) => a.date.localeCompare(b.date))
        )
      }

      // Staged Actions by Type
      const { data: staged } = await supabase
        .from('staged_actions')
        .select('action_type')
        .gte('created_at', startDate)

      if (staged) {
        const typeCounts: Record<string, number> = {}
        staged.forEach(s => {
          typeCounts[s.action_type] = (typeCounts[s.action_type] || 0) + 1
        })
        setStagedByType(
          Object.entries(typeCounts)
            .map(([name, value]) => ({ name, value }))
        )
      }

      // Revenue Trend (monthly)
      const { data: invoices } = await supabase
        .from('invoices')
        .select('paid_at, amount')
        .eq('status', 'paid')
        .not('paid_at', 'is', null)
        .order('paid_at', { ascending: true })
        .limit(12)

      if (invoices) {
        const monthlyRevenue: Record<string, number> = {}
        invoices.forEach(inv => {
          if (inv.paid_at && inv.amount) {
            const month = inv.paid_at.slice(0, 7)
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + inv.amount
          }
        })
        setRevenueTrend(
          Object.entries(monthlyRevenue)
            .map(([month, revenue]) => ({ month: month.slice(5) + '/' + month.slice(2, 4), revenue }))
        )
      }

      // Clients by Status
      const { data: clients } = await supabase
        .from('clients')
        .select('status')

      if (clients) {
        const statusCounts: Record<string, number> = {}
        clients.forEach(c => {
          statusCounts[c.status] = (statusCounts[c.status] || 0) + 1
        })
        setClientsByStatus(
          Object.entries(statusCounts)
            .map(([status, count]) => ({ status, count }))
        )
      }

      setLoading(false)
    }

    fetchData()
  }, [dateRange])

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="px-3 py-2 rounded-lg text-sm" style={{ background: '#1e2030', border: '1px solid #2e3040', color: '#fff' }}>
          <p className="font-medium">{label}</p>
          <p className="text-slate-400">{payload[0].value.toLocaleString()}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics</h2>
          <p className="text-slate-400 text-sm mt-1">
            Overview of system performance and metrics
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <div className="flex rounded-lg overflow-hidden" style={{ background: '#13141a' }}>
            {(['7d', '30d', '90d'] as DateRangeOption[]).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 text-sm font-medium transition-all ${dateRange === range ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Last {range === '7d' ? '7' : range === '30d' ? '30' : '90'} days
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse rounded-xl p-6" style={{ background: '#13141a' }}>
              <div className="h-4 bg-slate-700 rounded w-1/4 mb-4" />
              <div className="h-48 bg-slate-700/50 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Activity */}
          <div className="rounded-xl p-6" style={{ background: '#13141a', border: '1px solid #1e2030' }}>
            <h3 className="text-sm font-medium text-slate-300 mb-4">Agent Activity</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentActivity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2030" />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis type="category" dataKey="agent" stroke="#64748b" width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="tasks" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Token Usage */}
          <div className="rounded-xl p-6" style={{ background: '#13141a', border: '1px solid #1e2030' }}>
            <h3 className="text-sm font-medium text-slate-300 mb-4">Token Usage (Daily)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tokenUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2030" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="tokens" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pipeline Success */}
          <div className="rounded-xl p-6" style={{ background: '#13141a', border: '1px solid #1e2030' }}>
            <h3 className="text-sm font-medium text-slate-300 mb-4">Pipeline Success Rate</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pipelineSuccess} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-slate-300">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tasks Completed */}
          <div className="rounded-xl p-6" style={{ background: '#13141a', border: '1px solid #1e2030' }}>
            <h3 className="text-sm font-medium text-slate-300 mb-4">Tasks Completed (Daily)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tasksCompleted}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2030" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="tasks" stroke="#10b981" fill="#10b98120" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Staged Actions by Type */}
          <div className="rounded-xl p-6" style={{ background: '#13141a', border: '1px solid #1e2030' }}>
            <h3 className="text-sm font-medium text-slate-300 mb-4">Staged Actions by Type</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stagedByType} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                    {stagedByType.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-slate-300">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Trend */}
          <div className="rounded-xl p-6" style={{ background: '#13141a', border: '1px solid #1e2030' }}>
            <h3 className="text-sm font-medium text-slate-300 mb-4">Revenue Trend (Monthly)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2030" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Clients by Status - Full width */}
          <div className="rounded-xl p-6 lg:col-span-2" style={{ background: '#13141a', border: '1px solid #1e2030' }}>
            <h3 className="text-sm font-medium text-slate-300 mb-4">Clients by Status</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2030" />
                  <XAxis dataKey="status" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {clientsByStatus.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
