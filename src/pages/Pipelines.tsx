export default function Pipelines() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">Pipelines</h2>
        <p className="text-sm" style={{ color: '#64748b' }}>
          Active and scheduled agent pipelines
        </p>
      </div>

      <div className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
        style={{ background: '#0d0e14', border: '1px dashed #1e2030' }}>
        <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.1)' }}>
          <svg className="w-6 h-6" style={{ color: '#6366f1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-300 mb-1">No pipelines yet</p>
        <p className="text-xs" style={{ color: '#475569' }}>
          Pipeline data will appear here once connected to Supabase.
        </p>
      </div>
    </div>
  )
}
