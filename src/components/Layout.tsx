import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import CommandBar from './CommandBar'
import ChatWidget from './ChatWidget'

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/agents': 'Agent Status',
  '/pipelines': 'Pipelines',
  '/staged-actions': 'Staged Actions',
  '/memory': 'Memory',
  '/clients': 'Clients',
  '/analytics': 'Analytics',
  '/automation': 'Automation',
  '/revenue': 'Revenue',
}

export default function Layout() {
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'Dashboard'
  const [commandBarOpen, setCommandBarOpen] = useState(false)

  // Global keyboard shortcut for CommandBar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandBarOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: '#0a0b0f' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <CommandBar isOpen={commandBarOpen} onClose={() => setCommandBarOpen(false)} />
      <ChatWidget />
    </div>
  )
}
