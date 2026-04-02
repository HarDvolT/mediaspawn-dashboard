import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import PinGate from './components/Auth/PinGate'
import RealtimeBanner from './components/RealtimeBanner'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Analytics from './pages/Analytics'
import AgentStatus from './pages/AgentStatus'
import Pipelines from './pages/Pipelines'
import StagedActions from './pages/StagedActions'
import AgentLogs from './pages/AgentLogs'
import Memory from './pages/Memory'
import Clients from './pages/Clients'
import Settings from './pages/Settings'

export default function App() {
  return (
    <ErrorBoundary>
      <RealtimeBanner />
      <PinGate>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Overview />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="logs" element={<AgentLogs />} />
              <Route path="pipelines" element={<Pipelines />} />
              <Route path="approvals" element={<StagedActions />} />
              <Route path="clients" element={<Clients />} />
              <Route path="memory" element={<Memory />} />
              <Route path="settings" element={<Settings />} />
              <Route path="agents" element={<AgentStatus />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PinGate>
    </ErrorBoundary>
  )
}