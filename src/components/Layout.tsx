import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/analytics': 'Analytics',
  '/logs': 'Agent Logs',
  '/pipelines': 'Pipelines',
  '/approvals': 'Approvals',
  '/clients': 'Clients',
  '/memory': 'Memory',
  '/settings': 'Settings',
  '/agents': 'Agent Status',
}

export default function Layout() {
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'Dashboard'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: '#0a0b0f' }}>
      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`${
          isMobile 
            ? 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300' 
            : ''
        } ${sidebarOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar isMobile={isMobile} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar 
          title={title} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          isMobile={isMobile} 
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}