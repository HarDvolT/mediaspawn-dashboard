import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/agents': 'Agent Status',
  '/pipelines': 'Pipelines',
  '/staged-actions': 'Staged Actions',
  '/memory': 'Memory',
  '/clients': 'Clients',
}

export default function Layout() {
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'Dashboard'

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: '#0a0b0f' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
