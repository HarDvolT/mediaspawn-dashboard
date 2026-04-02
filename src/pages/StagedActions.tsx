export default function StagedActions() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">Staged Actions</h2>
        <p className="text-sm" style={{ color: '#64748b' }}>
          Actions pending review and approval
        </p>
      </div>

      <div className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
        style={{ background: '#0d0e14', border: '1px dashed #1e2030' }}>
        <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center"
          style={{ background: 'rgba(16,185,129,0.1)' }}>
          <svg className="w-6 h-6" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-300 mb-1">No staged actions</p>
        <p className="text-xs" style={{ color: '#475569' }}>
          Pending agent actions awaiting approval will appear here.
        </p>
      </div>
    </div>
  )
}
