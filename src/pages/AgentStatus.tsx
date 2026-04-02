const agents = [
  { id: 'wise',    label: 'Wise',    role: 'Orchestrator',      color: '#8b5cf6' },
  { id: 'scout',   label: 'Scout',   role: 'Research',          color: '#06b6d4' },
  { id: 'voice',   label: 'Voice',   role: 'Content',           color: '#f59e0b' },
  { id: 'strat',   label: 'Strat',   role: 'Social Media',      color: '#ec4899' },
  { id: 'dev',     label: 'Dev',     role: 'Development',       color: '#10b981' },
  { id: 'pilot',   label: 'Pilot',   role: 'Finance',           color: '#3b82f6' },
  { id: 'account', label: 'Account', role: 'Client Relations',  color: '#f97316' },
  { id: 'design',  label: 'Design',  role: 'UI/UX',             color: '#a78bfa' },
]

type AgentState = 'idle' | 'active' | 'offline'

// Placeholder statuses — will be driven by Supabase in a future step
const mockStatus: Record<string, AgentState> = {
  wise: 'active',
  scout: 'active',
  voice: 'idle',
  strat: 'idle',
  dev: 'active',
  pilot: 'offline',
  account: 'idle',
  design: 'idle',
}

const statusStyles: Record<AgentState, { dot: string; badge: string; label: string }> = {
  active:  { dot: 'bg-emerald-400 animate-pulse', badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20', label: 'Active'  },
  idle:    { dot: 'bg-amber-400',                 badge: 'bg-amber-400/10 text-amber-400 border-amber-400/20',       label: 'Idle'    },
  offline: { dot: 'bg-slate-600',                 badge: 'bg-slate-700/50 text-slate-400 border-slate-600/30',       label: 'Offline' },
}

export default function AgentStatus() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">Agent Status</h2>
        <p className="text-sm" style={{ color: '#64748b' }}>
          Real-time status of all MediaSpawn agents
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {agents.map((agent) => {
          const status = mockStatus[agent.id] ?? 'offline'
          const s = statusStyles[status]
          return (
            <div
              key={agent.id}
              className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: '#0d0e14',
                border: '1px solid #1e2030',
              }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: `${agent.color}22`, border: `1px solid ${agent.color}44` }}
                >
                  <span style={{ color: agent.color }}>
                    {agent.label.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s.badge}`}>
                  {s.label}
                </span>
              </div>

              {/* Info */}
              <div>
                <div className="text-sm font-semibold text-white capitalize">{agent.label}</div>
                <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{agent.role}</div>
              </div>

              {/* Status dot row */}
              <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: '1px solid #1e2030' }}>
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                <span className="text-xs" style={{ color: '#475569' }}>
                  {status === 'active' ? 'Running task' : status === 'idle' ? 'Waiting' : 'Unavailable'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
