import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/analytics': 'Analytics',
  '/agents': 'Agent Status',
  '/pipelines': 'Pipelines',
  '/staged-actions': 'Staged Actions',
  '/spawned': 'Spawned Agents',
  '/memory': 'Memory',
  '/clients': 'Clients',
}

export default function Layout() {
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'Dashboard'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [transitionKey, setTransitionKey] = useState(location.pathname)

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Trigger transition on route change
  useEffect(() => {
    setTransitionKey(location.pathname)
  }, [location.pathname])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: '#0a0b0f' }}>
      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${isMobile ? 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300' : ''} ${sidebarOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar isMobile={isMobile} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header 
          title={title} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          isMobile={isMobile}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div
            key={transitionKey}
            className="animate-fadeIn h-full"
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
