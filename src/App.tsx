import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import AgentStatus from './pages/AgentStatus'
import Pipelines from './pages/Pipelines'
import StagedActions from './pages/StagedActions'
import Memory from './pages/Memory'
import Clients from './pages/Clients'
import Automation from './pages/Automation'

export default function App() {
 return (
 <BrowserRouter>
 <Routes>
 <Route path="/" element={<Layout />}>
 <Route index element={<Overview />} />
 <Route path="agents" element={<AgentStatus />} />
 <Route path="pipelines" element={<Pipelines />} />
 <Route path="staged-actions" element={<StagedActions />} />
 <Route path="memory" element={<Memory />} />
 <Route path="clients" element={<Clients />} />
 <Route path="automation" element={<Automation />} />
 </Route>
 </Routes>
 </BrowserRouter>
 )
}
