import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, CheckCheck, GitBranch, Lock, Unlock } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface QuickActionsProps {
  pendingApprovals?: number
  onApproveAll?: () => void
}

export default function QuickActions({ pendingApprovals = 0, onApproveAll }: QuickActionsProps) {
  const navigate = useNavigate()
  const [isLocked, setIsLocked] = useState(false)
  const [approving, setApproving] = useState(false)

  const handleApproveAll = async () => {
    if (pendingApprovals === 0) return
    if (!confirm(`Approve all ${pendingApprovals} pending actions?`)) return

    try {
      setApproving(true)

      const { data: pending, error: fetchError } = await supabase
        .from('staged_actions')
        .select('id')
        .eq('status', 'pending')

      if (fetchError) throw fetchError

      if (pending && pending.length > 0) {
        const { error: updateError } = await supabase
          .from('staged_actions')
          .update({
            status: 'approved',
            approved_by: 'dashboard_user',
            updated_at: new Date().toISOString()
          })
          .in('id', pending.map(p => p.id))

        if (updateError) throw updateError

        await supabase.from('agent_logs').insert({
          agent_name: 'dashboard',
          event_type: 'notification',
          task_description: `Approved ${pending.length} staged actions via Quick Actions`,
          status: 'completed',
        })

        if (onApproveAll) onApproveAll()
      }
    } catch (err) {
      console.error('Failed to approve all:', err)
    } finally {
      setApproving(false)
    }
  }

  const handleToggleLock = () => {
    setIsLocked(!isLocked)
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* New Pipeline */}
        <button
          onClick={() => navigate('/pipelines')}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200 group bg-indigo-500/10 hover:bg-indigo-500/20 border border-transparent hover:border-indigo-400"
        >
          <GitBranch className="w-6 h-6 text-indigo-400 transition-transform group-hover:scale-110" />
          <div className="text-center">
            <p className="text-white text-sm font-medium">New Pipeline</p>
            <p className="text-gray-500 text-xs">Start a workflow</p>
          </div>
        </button>

        {/* New Client */}
        <button
          onClick={() => navigate('/clients')}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200 group bg-emerald-500/10 hover:bg-emerald-500/20 border border-transparent hover:border-emerald-400"
        >
          <Users className="w-6 h-6 text-emerald-400 transition-transform group-hover:scale-110" />
          <div className="text-center">
            <p className="text-white text-sm font-medium">New Client</p>
            <p className="text-gray-500 text-xs">Add a client</p>
          </div>
        </button>

        {/* Approve All */}
        <button
          onClick={handleApproveAll}
          disabled={pendingApprovals === 0 || approving}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed border border-transparent"
          style={{
            background: pendingApprovals > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(100,116,139,0.1)',
          }}
        >
          {approving ? (
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCheck className={`w-6 h-6 transition-transform group-hover:scale-110 ${pendingApprovals > 0 ? 'text-amber-400' : 'text-gray-500'}`} />
          )}
          <div className="text-center">
            <p className="text-white text-sm font-medium">Approve All</p>
            <p className="text-gray-500 text-xs">
              {pendingApprovals > 0 ? `${pendingApprovals} pending` : 'No pending'}
            </p>
          </div>
        </button>

        {/* Lock Dashboard */}
        <button
          onClick={handleToggleLock}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200 group border border-transparent"
          style={{
            background: isLocked ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)',
          }}
        >
          {isLocked ? (
            <Lock className="w-6 h-6 text-red-400 transition-transform group-hover:scale-110" />
          ) : (
            <Unlock className="w-6 h-6 text-gray-500 transition-transform group-hover:scale-110" />
          )}
          <div className="text-center">
            <p className="text-white text-sm font-medium">{isLocked ? 'Unlock' : 'Lock'}</p>
            <p className="text-gray-500 text-xs">{isLocked ? 'Dashboard locked' : 'Lock dashboard'}</p>
          </div>
        </button>
      </div>
    </div>
  )
}
