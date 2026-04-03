import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Database, Settings, Lightbulb, ListTodo, RefreshCw } from 'lucide-react'

type TabId = 'memory' | 'loops' | 'incubator' | 'queue'

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: Tab[] = [
  { id: 'memory', label: 'Memory Browser', icon: Database },
  { id: 'loops', label: 'Loop Config', icon: Settings },
  { id: 'incubator', label: 'Incubator Ideas', icon: Lightbulb },
  { id: 'queue', label: 'Idle Work Queue', icon: ListTodo },
]

// Correct interfaces matching actual Supabase schema
interface ConversationMemory {
  id: string
  memory_type: string
  summary: string
  source_quote?: string
  applies_to?: string
  client_name?: string
  is_active: boolean
  expires_at?: string
  created_at: string
}

interface LoopConfig {
  id: string
  enabled: boolean
  mode: string
  max_concurrent: number
  updated_at: string
}

interface IdleWork {
  id: string
  agent_name?: string
  work_type?: string
  description?: string
  priority: number
  status: string
  created_at: string
}

interface Todo {
  id: string
  task: string
  assignee?: string
  priority: number
  status: string
  due_date?: string
  created_at: string
}

export default function Memory() {
  const [activeTab, setActiveTab] = useState<TabId>('memory')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [memories, setMemories] = useState<ConversationMemory[]>([])
  const [loopConfigs, setLoopConfigs] = useState<LoopConfig[]>([])
  const [incubatorIdeas, setIncubatorIdeas] = useState<IdleWork[]>([])
  const [todos, setTodos] = useState<Todo[]>([])

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    setError(null)

    try {
      if (activeTab === 'memory') {
        const { data, error: fetchError } = await supabase
          .from('conversation_memory')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(50)
        if (fetchError) throw fetchError
        setMemories(data || [])
      } else if (activeTab === 'loops') {
        const { data, error: fetchError } = await supabase
          .from('loop_config')
          .select('*')
          .limit(10)
        if (fetchError) throw fetchError
        setLoopConfigs(data || [])
      } else if (activeTab === 'incubator') {
        const { data, error: fetchError } = await supabase
          .from('idle_work')
          .select('*')
          .order('priority', { ascending: false })
          .limit(30)
        if (fetchError) throw fetchError
        setIncubatorIdeas(data || [])
      } else if (activeTab === 'queue') {
        const { data, error: fetchError } = await supabase
          .from('todos')
          .select('*')
          .eq('status', 'pending')
          .order('priority', { ascending: false })
          .limit(30)
        if (fetchError) throw fetchError
        setTodos(data || [])
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError('Failed to load data. Table may not exist yet.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const handleRefresh = () => {
    fetchData(true)
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )
    }

    switch (activeTab) {
      case 'memory':
        return memories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No conversation memory entries found
          </div>
        ) : (
          <div className="space-y-3">
            {memories.map((memory) => (
              <div key={memory.id} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${memory.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-600 text-gray-400'}`}>
                      {memory.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-violet-400 text-sm font-medium ml-2">{memory.memory_type}</span>
                  </div>
                  <span className="text-gray-500 text-xs">{memory.applies_to || 'general'}</span>
                </div>
                <p className="text-gray-300 text-sm">{memory.summary}</p>
                {memory.client_name && (
                  <p className="text-gray-500 text-xs mt-1">Client: {memory.client_name}</p>
                )}
                <p className="text-gray-600 text-xs mt-2">
                  Created: {new Date(memory.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )

      case 'loops':
        return loopConfigs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No loop configurations found
          </div>
        ) : (
          <div className="space-y-3">
            {loopConfigs.map((loop) => (
              <div key={loop.id} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-gray-400 text-xs px-2 py-0.5 bg-gray-700 rounded">
                      {loop.mode}
                    </span>
                    <span className="text-gray-500 text-xs ml-2">max concurrent: {loop.max_concurrent}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${loop.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-600 text-gray-400'}`}>
                    {loop.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  Updated: {new Date(loop.updated_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )

      case 'incubator':
        return incubatorIdeas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No incubator ideas found
          </div>
        ) : (
          <div className="space-y-3">
            {incubatorIdeas.map((idea) => (
              <div key={idea.id} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-violet-400 text-sm font-medium">{idea.agent_name || 'Unknown'}</span>
                    <span className="text-gray-400 text-xs ml-2 px-2 py-0.5 bg-gray-700 rounded">
                      {idea.work_type || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-xs">Priority: {idea.priority}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      idea.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      idea.status === 'processing' ? 'bg-violet-500/20 text-violet-400' :
                      'bg-gray-600 text-gray-400'
                    }`}>
                      {idea.status}
                    </span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">{idea.description || 'No description'}</p>
              </div>
            ))}
          </div>
        )

      case 'queue':
        return todos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No pending todos in queue
          </div>
        ) : (
          <div className="space-y-3">
            {todos.map((todo) => (
              <div key={todo.id} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-violet-400 text-sm font-medium">{todo.assignee || 'Unassigned'}</span>
                    <span className="text-gray-500 text-xs ml-2">Priority: {todo.priority}</span>
                  </div>
                  {todo.due_date && (
                    <span className="text-gray-500 text-xs">
                      Due: {new Date(todo.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-gray-300 text-sm">{todo.task}</p>
                <p className="text-gray-600 text-xs mt-2">
                  Created: {new Date(todo.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Memory</h2>
            <p className="text-sm text-gray-500">
              Persistent agent memory and context store
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800/30 p-1 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  )
}
