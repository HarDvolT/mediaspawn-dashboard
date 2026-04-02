import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { 
  ConversationMemory, 
  LoopConfig, 
  Incubator, 
  IncubatorVote, 
  IdleWork 
} from '../types'
import { 
  Brain, 
  Lightbulb, 
  Clock, 
  ThumbsUp, 
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'

export default function Memory() {
  const [selectedAgent, setSelectedAgent] = useState('wise')
  const [agents] = useState<string[]>(['wise', 'dev', 'lynx', 'scout'])
  const [memories, setMemories] = useState<ConversationMemory[]>([])
  const [loopConfig, setLoopConfig] = useState<LoopConfig | null>(null)
  const [incubatorIdeas, setIncubatorIdeas] = useState<(Incubator & { votes?: IncubatorVote[] })[]>([])
  const [idleWork, setIdleWork] = useState<IdleWork[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMemory, setExpandedMemory] = useState<string | null>(null)
  const [savingLoop, setSavingLoop] = useState(false)

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Fetch memories
      const { data: memoryData } = await supabase
        .from('conversation_memory')
        .select('*')
        .eq('agent_name', selectedAgent)
        .order('created_at', { ascending: false })
        .limit(50)

      if (memoryData) setMemories(memoryData)

      // Fetch loop config
      const { data: loopData } = await supabase
        .from('loop_config')
        .select('*')
        .eq('agent_name', selectedAgent)
        .single()

      if (loopData) setLoopConfig(loopData)
      else setLoopConfig(null)

      // Fetch incubator ideas with votes
      const { data: ideasData } = await supabase
        .from('incubator')
        .select('*')
        .order('votes', { ascending: false })
        .limit(10)

      if (ideasData) {
        // Fetch votes for each idea
        const ideasWithVotes = await Promise.all(
          ideasData.map(async (idea) => {
            const { data: votes } = await supabase
              .from('incubator_votes')
              .select('*')
              .eq('incubator_id', idea.id)
            return { ...idea, votes: votes || [] }
          })
        )
        setIncubatorIdeas(ideasWithVotes)
      }

      // Fetch idle work
      const { data: idleData } = await supabase
        .from('idle_work')
        .select('*')
        .eq('status', 'queued')
        .order('priority', { ascending: false })
        .limit(20)

      if (idleData) setIdleWork(idleData)

      setLoading(false)
    }

    fetchData()
  }, [selectedAgent])

  // Update loop config
  const updateLoopConfig = async (updates: Partial<LoopConfig>) => {
    if (!loopConfig) return
    
    setSavingLoop(true)
    const { data } = await supabase
      .from('loop_config')
      .update(updates)
      .eq('id', loopConfig.id)
      .select()
      .single()

    if (data) setLoopConfig(data)
    setSavingLoop(false)
  }

  // Vote on incubator idea
  const voteIdea = async (ideaId: string, vote: 'up' | 'down') => {
    await supabase
      .from('incubator_votes')
      .insert({
        incubator_id: ideaId,
        agent_name: 'owner',
        vote
      })

    // Refresh ideas
    const { data } = await supabase
      .from('incubator')
      .select('*')
      .order('votes', { ascending: false })
      .limit(10)

    if (data) {
      const ideasWithVotes = await Promise.all(
        data.map(async (idea) => {
          const { data: votes } = await supabase
            .from('incubator_votes')
            .select('*')
            .eq('incubator_id', idea.id)
          return { ...idea, votes: votes || [] }
        })
      )
      setIncubatorIdeas(ideasWithVotes)
    }
  }

  const categoryColors: Record<string, string> = {
    feature: 'text-blue-400 bg-blue-500/20',
    improvement: 'text-emerald-400 bg-emerald-500/20',
    experiment: 'text-violet-400 bg-violet-500/20',
    research: 'text-amber-400 bg-amber-500/20'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Memory</h2>
          <p className="text-slate-400 text-sm mt-1">
            Agent memory, configurations, and incubator
          </p>
        </div>

        {/* Agent Selector */}
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="px-4 py-2 text-sm rounded-lg"
          style={{ background: '#13141a', border: '1px solid #1e2030', color: '#fff' }}
        >
          {agents.map(agent => (
            <option key={agent} value={agent}>{agent}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse rounded-xl p-6" style={{ background: '#13141a' }}>
              <div className="h-4 bg-slate-700 rounded w-1/4 mb-4" />
              <div className="space-y-3">
                <div className="h-3 bg-slate-700 rounded w-full" />
                <div className="h-3 bg-slate-700 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Memory Entries */}
          <div 
            className="rounded-xl p-6"
            style={{ background: '#13141a', border: '1px solid #1e2030' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Brain className="w-5 h-5 text-violet-400" />
              <h3 className="text-sm font-medium text-white">Conversation Memory</h3>
              <span className="text-xs text-slate-500 ml-auto">{memories.length} entries</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {memories.length > 0 ? (
                memories.map(memory => (
                  <div key={memory.id}>
                    <div 
                      className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-800/50"
                      style={{ background: '#0d0e14' }}
                      onClick={() => setExpandedMemory(expandedMemory === memory.id ? null : memory.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            memory.role === 'user' 
                              ? 'bg-blue-500/20 text-blue-400'
                              : memory.role === 'assistant'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {memory.role}
                          </span>
                          <span className="text-xs text-slate-500">
                            {memory.tokens ? `${memory.tokens} tokens` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            {memory.expires_at 
                              ? `Expires ${new Date(memory.expires_at).toLocaleDateString()}`
                              : 'No expiry'
                            }
                          </span>
                          {expandedMemory === memory.id ? (
                            <ChevronUp className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 mt-2 line-clamp-2">
                        {memory.content}
                      </p>
                    </div>
                    {expandedMemory === memory.id && (
                      <div 
                        className="px-4 py-3 mt-1 rounded-lg text-sm text-slate-400"
                        style={{ background: '#0a0b0f' }}
                      >
                        {memory.content}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No memory entries for {selectedAgent}
                </div>
              )}
            </div>
          </div>

          {/* Loop Config */}
          <div 
            className="rounded-xl p-6"
            style={{ background: '#13141a', border: '1px solid #1e2030' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <RefreshCw className="w-5 h-5 text-violet-400" />
              <h3 className="text-sm font-medium text-white">Loop Config</h3>
            </div>

            {loopConfig ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Enabled</span>
                  <button
                    onClick={() => updateLoopConfig({ enabled: !loopConfig.enabled })}
                    disabled={savingLoop}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      loopConfig.enabled 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {loopConfig.enabled ? (
                      <>
                        <Play className="w-4 h-4" />
                        Running
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4" />
                        Paused
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Mode</label>
                  <select
                    value={loopConfig.mode}
                    onChange={(e) => updateLoopConfig({ mode: e.target.value as 'sequential' | 'parallel' | 'conditional' })}
                    disabled={savingLoop}
                    className="w-full px-3 py-2 text-sm rounded-lg"
                    style={{ background: '#0d0e14', border: '1px solid #1e2030', color: '#fff' }}
                  >
                    <option value="sequential">Sequential</option>
                    <option value="parallel">Parallel</option>
                    <option value="conditional">Conditional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Concurrency</label>
                  <input
                    type="number"
                    value={loopConfig.concurrency}
                    onChange={(e) => updateLoopConfig({ concurrency: parseInt(e.target.value) || 1 })}
                    min={1}
                    max={10}
                    disabled={savingLoop}
                    className="w-full px-3 py-2 text-sm rounded-lg"
                    style={{ background: '#0d0e14', border: '1px solid #1e2030', color: '#fff' }}
                  />
                </div>

                {loopConfig.schedule && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Schedule</label>
                    <code className="block px-3 py-2 text-sm rounded-lg text-violet-400" style={{ background: '#0d0e14' }}>
                      {loopConfig.schedule}
                    </code>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No loop config for {selectedAgent}
              </div>
            )}
          </div>

          {/* Incubator Ideas */}
          <div 
            className="rounded-xl p-6"
            style={{ background: '#13141a', border: '1px solid #1e2030' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className="w-5 h-5 text-violet-400" />
              <h3 className="text-sm font-medium text-white">Incubator Ideas</h3>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {incubatorIdeas.length > 0 ? (
                incubatorIdeas.map(idea => (
                  <div 
                    key={idea.id}
                    className="p-3 rounded-lg"
                    style={{ background: '#0d0e14' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[idea.category]}`}>
                            {idea.category}
                          </span>
                          <span className="text-xs text-slate-500">{idea.agent_name}</span>
                        </div>
                        <p className="text-sm text-white">{idea.idea}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => voteIdea(idea.id, 'up')}
                          className="p-1 rounded hover:bg-slate-700 transition-colors"
                        >
                          <ThumbsUp className="w-4 h-4 text-emerald-400" />
                        </button>
                        <span className="text-sm text-slate-400 min-w-[2rem] text-center">
                          {idea.votes}
                        </span>
                        <button
                          onClick={() => voteIdea(idea.id, 'down')}
                          className="p-1 rounded hover:bg-slate-700 transition-colors"
                        >
                          <ThumbsDown className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No ideas in incubator
                </div>
              )}
            </div>
          </div>

          {/* Idle Work Queue */}
          <div 
            className="rounded-xl p-6"
            style={{ background: '#13141a', border: '1px solid #1e2030' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-violet-400" />
              <h3 className="text-sm font-medium text-white">Idle Work Queue</h3>
              <span className="text-xs text-slate-500 ml-auto">{idleWork.length} pending</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {idleWork.length > 0 ? (
                idleWork.map(work => (
                  <div 
                    key={work.id}
                    className="p-3 rounded-lg"
                    style={{ background: '#0d0e14' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white font-medium">{work.task_type}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        work.priority >= 7 
                          ? 'bg-red-500/20 text-red-400'
                          : work.priority >= 4
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        P{work.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Agent: {work.agent_name}</p>
                    {work.assigned_to && (
                      <p className="text-xs text-slate-500">Assigned: {work.assigned_to}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No idle work queued
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
