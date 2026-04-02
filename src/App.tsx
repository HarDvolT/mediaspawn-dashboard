import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import PasswordGate from './components/PasswordGate'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Analytics from './pages/Analytics'
import AgentStatus from './pages/AgentStatus'
import Pipelines from './pages/Pipelines'
import StagedActions from './pages/StagedActions'
import SpawnedAgents from './pages/SpawnedAgents'
import Memory from './pages/Memory'
import Clients from './pages/Clients'

export default function App() {
  return (
    <ErrorBoundary>
      <PasswordGate>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Overview />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="agents" element={<AgentStatus />} />
              <Route path="spawned" element={<SpawnedAgents />} />
              <Route path="pipelines" element={<Pipelines />} />
              <Route path="staged-actions" element={<StagedActions />} />
              <Route path="memory" element={<Memory />} />
              <Route path="clients" element={<Clients />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PasswordGate>
    </ErrorBoundary>
  )
}
