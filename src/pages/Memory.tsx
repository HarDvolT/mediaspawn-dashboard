export default function Memory() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">Memory</h2>
        <p className="text-sm" style={{ color: '#64748b' }}>
          Persistent agent memory and context store
        </p>
      </div>

      <div className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
        style={{ background: '#0d0e14', border: '1px dashed #1e2030' }}>
        <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center"
          style={{ background: 'rgba(139,92,246,0.1)' }}>
          <svg className="w-6 h-6" style={{ color: '#8b5cf6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-300 mb-1">Memory store empty</p>
        <p className="text-xs" style={{ color: '#475569' }}>
          Agent memory entries from Supabase will be displayed here.
        </p>
      </div>
    </div>
  )
}
