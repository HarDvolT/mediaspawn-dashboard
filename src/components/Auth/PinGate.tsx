import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'

interface PinGateProps {
  children: React.ReactNode
}

const AUTH_KEY = 'dashboard_auth'
const AUTH_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

interface AuthData {
  authenticated: boolean
  timestamp: number
}

export default function PinGate({ children }: PinGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if already authenticated with valid TTL
    try {
      const stored = localStorage.getItem(AUTH_KEY)
      if (stored) {
        const authData: AuthData = JSON.parse(stored)
        const now = Date.now()
        if (authData.authenticated && (now - authData.timestamp) < AUTH_TTL_MS) {
          setIsAuthenticated(true)
        } else {
          // TTL expired, clear storage
          localStorage.removeItem(AUTH_KEY)
        }
      }
    } catch {
      localStorage.removeItem(AUTH_KEY)
    }
    setLoading(false)
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const correctPin = import.meta.env.VITE_DASHBOARD_PIN || '1234'
    
    if (pin === correctPin) {
      const authData: AuthData = {
        authenticated: true,
        timestamp: Date.now()
      }
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
      setIsAuthenticated(true)
      setError(false)
    } else {
      setError(true)
      setTimeout(() => setError(false), 600)
    }
  }

  const handlePinChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPin(value)
    if (error) setError(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0b0f' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Initializing Dashboard...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0b0f' }}>
        {/* Full-screen dark overlay */}
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className={`max-w-sm w-full transition-all duration-300 ${error ? 'animate-shake' : ''}`}
            style={{
              background: '#13141a',
              border: error ? '2px solid #ef4444' : '1px solid #1e2030',
              borderRadius: '1rem',
              padding: '2rem'
            }}
          >
            {/* Logo */}
            <div className="text-center mb-8">
              <div 
                className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white">MediaSpawn Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">Enter 4-digit PIN to access</p>
            </div>

            {/* PIN Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="w-12 h-14 flex items-center justify-center rounded-lg text-xl font-bold"
                    style={{
                      background: '#0d0e14',
                      border: `1px solid ${error ? '#ef4444' : index < pin.length ? '#6366f1' : '#1e2030'}`,
                      color: index < pin.length ? '#fff' : '#4a5568'
                    }}
                  >
                    {index < pin.length ? '•' : ''}
                  </div>
                ))}
              </div>

              {/* Hidden input for keyboard */}
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={handlePinChange}
                className="opacity-0 absolute w-0 h-0"
                autoFocus
                autoComplete="off"
              />

              {/* Numeric keypad for mobile */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((num, idx) => (
                  num ? (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (num === '⌫') {
                          setPin(prev => prev.slice(0, -1))
                        } else if (pin.length < 4) {
                          setPin(prev => prev + num)
                        }
                      }}
                      className="h-12 rounded-lg font-medium text-white transition-all hover:bg-slate-700 active:scale-95"
                      style={{ background: '#1e2030' }}
                    >
                      {num}
                    </button>
                  ) : (
                    <div key={idx} />
                  )
                ))}
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center animate-pulse">
                  Incorrect PIN. Please try again.
                </p>
              )}

              <button
                type="submit"
                disabled={pin.length !== 4}
                className="w-full py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: pin.length === 4 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#1e2030',
                  color: '#fff'
                }}
              >
                Unlock Dashboard
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
