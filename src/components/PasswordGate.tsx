import { useState, useEffect, type FormEvent } from 'react'

interface PasswordGateProps {
  children: React.ReactNode
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if already authenticated in this session
    const authenticated = sessionStorage.getItem('dashboard_authenticated')
    if (authenticated === 'true') {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const dashboardPassword = import.meta.env.VITE_DASHBOARD_PASSWORD || 'mediaspawn2025'
    
    if (password === dashboardPassword) {
      setIsAuthenticated(true)
      sessionStorage.setItem('dashboard_authenticated', 'true')
      setError(false)
    } else {
      setError(true)
      setTimeout(() => setError(false), 500)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0b0f' }}>
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0b0f' }}>
        <div className={`max-w-sm w-full transition-transform ${error ? 'animate-shake' : ''}`}>
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white">MediaSpawn Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">Enter password to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm text-center">Incorrect password</p>
              )}
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
              >
                Enter Dashboard
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
