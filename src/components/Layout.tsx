import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import CommandBar from './CommandBar'
import ShortcutsHelp from './ShortcutsHelp'

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
  const navigate = useNavigate()
  const title = pageTitles[location.pathname] ?? 'Dashboard'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [commandBarOpen, setCommandBarOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

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

  // Global keyboard shortcuts
  useEffect(() => {
    let gPressed = false
    let gTimeout: ReturnType<typeof setTimeout>

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Cmd/Ctrl + K to open command bar
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandBarOpen(true)
        return
      }

      // ? to show shortcuts help
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault()
        setShortcutsOpen(true)
        return
      }

      // g + key shortcuts for navigation (vi-style)
      if (e.key === 'g' && !gPressed) {
        gPressed = true
        // Reset g state after 1 second
        gTimeout = setTimeout(() => {
          gPressed = false
        }, 1000)
        return
      }

      if (gPressed) {
        clearTimeout(gTimeout)
        gPressed = false

        const navigationMap: Record<string, string> = {
          'o': '/',
          'p': '/pipelines',
          'l': '/logs',
          'a': '/approvals',
          'c': '/clients',
          'n': '/analytics',
          'm': '/memory',
          's': '/settings',
        }

        if (navigationMap[e.key]) {
          e.preventDefault()
          navigate(navigationMap[e.key])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(gTimeout)
    }
  }, [navigate])

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
      <div className={`${
        isMobile ? 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300' : ''
      } ${sidebarOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar isMobile={isMobile} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar title={title} onMenuClick={() => setSidebarOpen(!sidebarOpen)} isMobile={isMobile} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Command Bar */}
      <CommandBar isOpen={commandBarOpen} onClose={() => setCommandBarOpen(false)} />

      {/* Shortcuts Help */}
      <ShortcutsHelp isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}
