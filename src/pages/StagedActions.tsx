import { useState, useEffect } from 'react'
import { Check, X, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { StagedAction } from '../types'

const actionTypeLabels: Record<string, string> = {
  email: '📧 Email',
  invoice: '💰 Invoice',
  post: '📱 Social Post',
  document: '📄 Document',
  db_migration: '🗄️ DB Migration',
  script: '⚡ Script',
  other: '📌 Other',
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: 'rgba(245,158,11,0.1)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  approved: { bg: 'rgba(16,185,129,0.1)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
  rejected: { bg: 'rgba(239,68,68,0.1)', text: '#f87171', border: 'rgba(239,68,68,0.3)' },
  executed: { bg: 'rgba(99,102,241,0.1)', text: '#a5b4fc', border: 'rgba(99,102,241,0.3)' },
}

export default function StagedActions() {
  const [actions, setActions] = useState<StagedAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'executed'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchActions()
    
    const channel = supabase
      .channel('staged_actions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staged_actions' }, () => {
        fetchActions()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchActions() {
    try {
      const { data, error: fetchError } = await supabase
        .from('staged_actions')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setActions(data || [])
    } catch (err) {
      console.error('Failed to fetch staged actions:', err)
      setError('Failed to load staged actions')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string) {
    setProcessingId(id)
    try {
      const { error: updateError } = await supabase
        .from('staged_actions')
        .update({ 
          status: 'approved', 
          approved_by: 'dashboard_user',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) throw updateError
      
      await supabase.from('agent_logs').insert({
        agent_name: 'dashboard',
        event_type: 'notification',
        task_description: `Approved staged action: ${id.slice(0, 8)}`,
        status: 'completed',
      })
      
      await fetchActions()
    } catch (err) {
      console.error('Failed to approve action:', err)
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) return
    
    setProcessingId(id)
    try {
      const { error: updateError } = await supabase
        .from('staged_actions')
        .update({ 
          status: 'rejected', 
          rejection_reason: rejectReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) throw updateError
      await fetchActions()
      setShowRejectModal(null)
      setRejectReason('')
    } catch (err) {
      console.error('Failed to reject action:', err)
    } finally {
      setProcessingId(null)
    }
  }

  const filteredActions = actions.filter(action => 
    filter === 'all' ? true : action.status === filter
  )

  const stats = {
    total: actions.length,
    pending: actions.filter(a => a.status === 'pending').length,
    approved: actions.filter(a => a.status === 'approved').length,
    executed: actions.filter(a => a.status === 'executed').length,
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-1">Staged Actions</h2>
          <p className="text-sm" style={{ color: '#64748b' }}>Actions pending review and approval</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">Staged Actions</h2>
        <p className="text-sm" style={{ color: '#64748b' }}>Actions pending review and approval</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-xs" style={{ color: '#64748b' }}>Total</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4" style={{ borderLeft: '3px solid #f59e0b' }}>
          <p className="text-xs" style={{ color: '#64748b' }}>Pending</p>
          <p className="text-2xl font-bold" style={{ color: '#fbbf24' }}>{stats.pending}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4" style={{ borderLeft: '3px solid #10b981' }}>
          <p className="text-xs" style={{ color: '#64748b' }}>Approved</p>
          <p className="text-2xl font-bold" style={{ color: '#34d399' }}>{stats.approved}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4" style={{ borderLeft: '3px solid #6366f1' }}>
          <p className="text-xs" style={{ color: '#64748b' }}>Executed</p>
          <p className="text-2xl font-bold" style={{ color: '#a5b4fc' }}>{stats.executed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected', 'executed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize"
            style={{
              background: filter === f ? 'rgba(99,102,241,0.2)' : '#1e2030',
              color: filter === f ? '#a5b4fc' : '#94a3b8',
              border: `1px solid ${filter === f ? 'rgba(99,102,241,0.4)' : '#2d2f3d'}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Actions List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredActions.length === 0 ? (
        <div
          className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
          style={{ background: '#0d0e14', border: '1px dashed #1e2030' }}
        >
          <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <Check className="w-6 h-6" style={{ color: '#10b981' }} />
          </div>
          <p className="text-sm font-medium text-slate-300 mb-1">No staged actions</p>
          <p className="text-xs" style={{ color: '#475569' }}>
            Pending agent actions awaiting approval will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActions.map((action) => {
            const colors = statusColors[action.status] || statusColors.pending
            const isExpanded = expandedId === action.id
            const isProcessing = processingId === action.id

            return (
              <div
                key={action.id}
                className="rounded-xl overflow-hidden transition-all"
                style={{ background: '#13141a', border: `1px solid ${colors.border}` }}
              >
                {/* Main row */}
                <div className="p-4 flex items-center gap-4">
                  {/* Status indicator */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: colors.bg }}
                  >
                    {action.status === 'pending' && <Clock className="w-5 h-5" style={{ color: colors.text }} />}
                    {action.status === 'approved' && <Check className="w-5 h-5" style={{ color: colors.text }} />}
                    {action.status === 'rejected' && <X className="w-5 h-5" style={{ color: colors.text }} />}
                    {action.status === 'executed' && <AlertTriangle className="w-5 h-5" style={{ color: colors.text }} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: colors.bg, color: colors.text }}>
                        {action.status.toUpperCase()}
                      </span>
                      <span className="text-xs" style={{ color: '#64748b' }}>
                        {actionTypeLabels[action.action_type] || action.action_type}
                      </span>
                    </div>
                    <p className="text-sm text-white truncate">{action.summary}</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>
                      by {action.agent_name} • {new Date(action.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {action.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(action.id)}
                          disabled={isProcessing}
                          className="p-2 rounded-lg transition-colors disabled:opacity-50"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}
                          title="Approve"
                        >
                          {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => setShowRejectModal(action.id)}
                          disabled={isProcessing}
                          className="p-2 rounded-lg transition-colors disabled:opacity-50"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                          title="Reject"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : action.id)}
                      className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                      style={{ color: '#64748b' }}
                      title="View details"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0" style={{ borderTop: '1px solid #1e2030' }}>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>Action Data</p>
                        <pre className="text-xs text-gray-300 bg-gray-900 rounded-lg p-3 overflow-x-auto">
                          {JSON.stringify(action.action_data, null, 2)}
                        </pre>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>Agent</p>
                          <p className="text-sm text-white">{action.agent_name}</p>
                        </div>
                        {action.client_id && (
                          <div>
                            <p className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>Client ID</p>
                            <p className="text-sm text-white">{action.client_id}</p>
                          </div>
                        )}
                        {action.approved_by && (
                          <div>
                            <p className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>Approved By</p>
                            <p className="text-sm text-white">{action.approved_by}</p>
                          </div>
                        )}
                        {action.rejection_reason && (
                          <div>
                            <p className="text-xs font-medium mb-1" style={{ color: '#f87171' }}>Rejection Reason</p>
                            <p className="text-sm text-red-300">{action.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-xl" style={{ background: '#13141a', border: '1px solid #1e2030' }}>
            <div className="p-4" style={{ borderBottom: '1px solid #1e2030' }}>
              <h3 className="text-lg font-semibold text-white">Reject Action</h3>
              <p className="text-sm" style={{ color: '#64748b' }}>Provide a reason for rejection</p>
            </div>
            <div className="p-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full h-24 px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none resize-none"
                style={{ background: '#0d0e14', border: '1px solid #2d2f3d' }}
                autoFocus
              />
            </div>
            <div className="p-4 flex justify-end gap-3">
              <button
                onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: '#1e2030', color: '#94a3b8' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal as string)}
                disabled={!rejectReason.trim() || !!processingId}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}
              >
                {processingId ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}