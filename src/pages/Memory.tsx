import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { ConversationMemory, LoopConfig, Incubator, IncubatorVote, IdleWork, KnowledgeBaseIndex } from '../types'
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
  RefreshCw,
  Database,
  Search,
  Plus,
  Trash2,
  Save
} from 'lucide-react'

type TabType = 'memory' | 'knowledge' | 'incubator' | 'idle'

export default function Memory() {
  const [activeTab, setActiveTab] = useState<TabType>('memory')
  const [selectedAgent, setSelectedAgent] = useState('wise')
  const [agents] = useState<string[]>(['wise', 'dev', 'lynx', 'scout'])
  
  // Memory tab state
  const [memories, setMemories] = useState<ConversationMemory[]>([])
  const [loopConfig, setLoopConfig] = useState<LoopConfig | null>(null)
  const [expandedMemory, setExpandedMemory] = useState<string | null>(null)
  const [savingLoop, setSavingLoop] = useState(false)
  
  // Knowledge tab state
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeBaseIndex[]>([])
  const [knowledgeFilter, setKnowledgeFilter] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  const [newKnowledge, setNewKnowledge] = useState({ title: '', content: '', category: 'general', tags: '' })
  const [showNewKnowledge, setShowNewKnowledge] = useState(false)
  
  // Incubator tab state
  const [incubatorIdeas, setIncubatorIdeas] = useState<(Incubator & { votes?: IncubatorVote[] })[]>([])
  const [newIdea, setNewIdea] = useState<{ idea: string; category: 'feature' | 'improvement' | 'experiment' | 'research' }>({ idea: '', category: 'feature' })
  const [showNewIdea, setShowNewIdea] = useState(false)
  
  // Idle work tab state
  const [idleWork, setIdleWork] = useState<IdleWork[]>([])
  
  const [loading, setLoading] = useState(true)

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      if (activeTab === 'memory') {
        await fetchMemoryData()
      } else if (activeTab === 'knowledge') {
        await fetchKnowledgeData()
      } else if (activeTab === 'incubator') {
        await fetchIncubatorData()
      } else if (activeTab === 'idle') {
        await fetchIdleWorkData()
      }
      
      setLoading(false)
    }
    
    fetchData()
  }, [activeTab, selectedAgent])

  const fetchMemoryData = async () => {
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
  }

  const fetchKnowledgeData = async () => {
    let query = supabase
      .from('knowledge_base_index')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory)
    }
    
    const { data } = await query.limit(100)
    if (data) {
      if (knowledgeFilter) {
        const filtered = data.filter(entry => 
          entry.title.toLowerCase().includes(knowledgeFilter.toLowerCase()) ||
          entry.content.toLowerCase().includes(knowledgeFilter.toLowerCase()) ||
          entry.tags?.some((tag: string) => tag.toLowerCase().includes(knowledgeFilter.toLowerCase()))
        )
        setKnowledgeEntries(filtered)
      } else {
        setKnowledgeEntries(data)
      }
    }
  }

  const fetchIncubatorData = async () => {
    const { data: ideasData } = await supabase
      .from('incubator')
      .select('*')
      .order('votes', { ascending: false })
      .limit(20)
    
    if (ideasData) {
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
  }

  const fetchIdleWorkData = async () => {
    const { data: idleData } = await supabase
      .from('idle_work')
      .select('*')
      .eq('status', 'queued')
      .order('priority', { ascending: false })
      .limit(50)
    if (idleData) setIdleWork(idleData)
  }

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
      .insert({ incubator_id: ideaId, agent_name: 'owner', vote })
    fetchIncubatorData()
  }

  // Add new idea
  const addIdea = async () => {
    if (!newIdea.idea.trim()) return
    await supabase
      .from('incubator')
      .insert({
        agent_name: selectedAgent,
        idea: newIdea.idea,
        category: newIdea.category,
        status: 'idea',
        votes: 0
      })
    setNewIdea({ idea: '', category: 'feature' })
    setShowNewIdea(false)
    fetchIncubatorData()
  }

  // Add knowledge entry
  const addKnowledge = async () => {
    if (!newKnowledge.title.trim() || !newKnowledge.content.trim()) return
    await supabase
      .from('knowledge_base_index')
      .insert({
        agent_name: selectedAgent,
        title: newKnowledge.title,
        content: newKnowledge.content,
        category: newKnowledge.category,
        tags: newKnowledge.tags.split(',').map(t => t.trim()).filter(Boolean)
      })
    setNewKnowledge({ title: '', content: '', category: 'general', tags: '' })
    setShowNewKnowledge(false)
    fetchKnowledgeData()
  }

  // Delete knowledge entry
  const deleteKnowledge = async (id: string) => {
    await supabase.from('knowledge_base_index').delete().eq('id', id)
    fetchKnowledgeData()
  }

  // Update incubator idea status
  const updateIdeaStatus = async (id: string, status: Incubator['status']) => {
    await supabase
      .from('incubator')
      .update({ status })
      .eq('id', id)
    fetchIncubatorData()
  }



  const tabs = [
    { id: 'memory' as const, label: 'Conversation Memory', icon: Brain },
    { id: 'knowledge' as const, label: 'Knowledge Base', icon: Database },
    { id: 'incubator' as const, label: 'Incubator', icon: Lightbulb },
    { id: 'idle' as const, label: 'Idle Work Queue', icon: Clock },
  ]

  const categoryColors: Record<string, string> = {
    feature: 'text-blue-400 bg-blue-500/20',
    improvement: 'text-emerald-400 bg-emerald-500/20',
    experiment: 'text-violet-400 bg-violet-500/20',
    research: 'text-amber-400 bg-amber-500/20'
  }

  const statusColors: Record<string, string> = {
    idea: 'text-slate-400 bg-slate-500/20',
    validated: 'text-blue-400 bg-blue-500/20',
    building: 'text-amber-400 bg-amber-500/20',
    shipped: 'text-emerald-400 bg-emerald-500/20',
    archived: 'text-slate-500 bg-slate-500/20'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Memory</h2>
          <p className="text-slate-400 text-sm mt-1">
            Agent memory, knowledge base, incubator ideas, and idle work queue
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => (
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
        <>
          {/* Memory Tab */}
          {activeTab === 'memory' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Memory Entries */}
              <div className="rounded-xl p-6" style={{ background: '#13141a', border: '1px solid #1e2030' }}>
                <div className="flex items-center gap-3 mb-6">
                  <Brain className="w-5 h-5 text-violet-400" />
                  <h3 className="text-sm font-medium text-white">Conversation Memory</h3>
                  <span className="text-xs text-slate-500 ml-auto">{memories.length} entries</span>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
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
                            className="px-4 py-3 mt-1 rounded-lg text-sm text-slate-400 whitespace-pre-wrap"
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
              <div className="rounded-xl p-6" style={{ background: '#13141a', border: '1px solid #1e2030' }}>
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
                        <code
                          className="block px-3 py-2 text-sm rounded-lg text-violet-400"
                          style={{ background: '#0d0e14' }}
                        >
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
            </div>
          )}

          {/* Knowledge Tab */}
          {activeTab === 'knowledge' && (
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={knowledgeFilter}
                    onChange={(e) => setKnowledgeFilter(e.target.value)}
                    placeholder="Search knowledge base..."
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg"
                    style={{ background: '#13141a', border: '1px solid #1e2030', color: '#fff' }}
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 text-sm rounded-lg"
                  style={{ background: '#13141a', border: '1px solid #1e2030', color: '#fff' }}
                >
                  <option value="all">All Categories</option>
                  <option value="general">General</option>
                  <option value="technical">Technical</option>
                  <option value="process">Process</option>
                  <option value="client">Client</option>
                  <option value="project">Project</option>
                </select>
                <button
                  onClick={() => setShowNewKnowledge(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Entry
                </button>
              </div>

              {/* New Knowledge Form */}
              {showNewKnowledge && (
                <div className="rounded-xl p-6" style={{ background: '#13141a', border: '1px solid #1e2030' }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Title</label>
                      <input
                        type="text"
                        value={newKnowledge.title}
                        onChange={(e) => setNewKnowledge({ ...newKnowledge, title: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg"
                        style={{ background: '#0d0e14', border: '1px solid #1e2030', color: '#fff' }}
                        placeholder="Knowledge title..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Content</label>
                      <textarea
                        value={newKnowledge.content}
                        onChange={(e) => setNewKnowledge({ ...newKnowledge, content: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 text-sm rounded-lg resize-none"
                        style={{ background: '#0d0e14', border: '1px solid #1e2030', color: '#fff' }}
                        placeholder="Knowledge content..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Category</label>
                        <select
                          value={newKnowledge.category}
                          onChange={(e) => setNewKnowledge({ ...newKnowledge, category: e.target.value })}
                          className="w-full px-3 py-2 text-sm rounded-lg"
                          style={{ background: '#0d0e14', border: '1px solid #1e2030', color: '#fff' }}
                        >
                          <option value="general">General</option>
                          <option value="technical">Technical</option>
                          <option value="process">Process</option>
                          <option value="client">Client</option>
                          <option value="project">Project</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Tags (comma-separated)</label>
                        <input
                          type="text"
                          value={newKnowledge.tags}
                          onChange={(e) => setNewKnowledge({ ...newKnowledge, tags: e.target.value })}
                          className="w-full px-3 py-2 text-sm rounded-lg"
                          style={{ background: '#0d0e14', border: '1px solid #1e2030', color: '#fff' }}
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowNewKnowledge(false)}
                        className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addKnowledge}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Save Entry
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Knowledge Entries */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {knowledgeEntries.length > 0 ? (
                  knowledgeEntries.map(entry => (
                    <div
                      key={entry.id}
                      className="rounded-xl p-4 group"
                      style={{ background: '#13141a', border: '1px solid #1e2030' }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          entry.category === 'general'
                            ? 'text-slate-400 bg-slate-500/20'
                            : entry.category === 'technical'
                            ? 'text-blue-400 bg-blue-500/20'
                            : entry.category === 'process'
                            ? 'text-emerald-400 bg-emerald-500/20'
                            : entry.category === 'client'
                            ? 'text-amber-400 bg-amber-500/20'
                            : 'text-violet-400 bg-violet-500/20'
                        }`}>
                          {entry.category}
                        </span>
                        <button
                          onClick={() => deleteKnowledge(entry.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                      <h4 className="text-sm font-medium text-white mb-1">{entry.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-3 mb-2">{entry.content}</p>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 rounded text-xs text-slate-500 bg-slate-800">
                              {tag}
                            </span>
                          ))}
                          {entry.tags.length > 3 && (
                            <span className="text-xs text-slate-500">+{entry.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-slate-600">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-slate-500">
                    No knowledge entries found
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Incubator Tab */}
          {activeTab === 'incubator' && (
            <div className="space-y-4">
              {/* Add New Idea Button */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-400">
                  Ideas submitted by agents for validation and implementation
                </p>
                <button
                  onClick={() => setShowNewIdea(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Idea
                </button>
              </div>

              {/* New Idea Form */}
              {showNewIdea && (
                <div className="rounded-xl p-6" style={{ background: '#13141a', border: '1px solid #1e2030' }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Idea Description</label>
                      <textarea
                        value={newIdea.idea}
                        onChange={(e) => setNewIdea({ ...newIdea, idea: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 text-sm rounded-lg resize-none"
                        style={{ background: '#0d0e14', border: '1px solid #1e2030', color: '#fff' }}
                        placeholder="Describe your idea..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Category</label>
                      <select
                        value={newIdea.category}
                        onChange={(e) => setNewIdea({ ...newIdea, category: e.target.value as 'feature' | 'improvement' | 'experiment' | 'research' })}
                        className="w-full px-3 py-2 text-sm rounded-lg"
                        style={{ background: '#0d0e14', border: '1px solid #1e2030', color: '#fff' }}
                      >
                        <option value="feature">Feature</option>
                        <option value="improvement">Improvement</option>
                        <option value="experiment">Experiment</option>
                        <option value="research">Research</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowNewIdea(false)}
                        className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addIdea}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                      >
                        <Lightbulb className="w-4 h-4" />
                        Submit Idea
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Ideas List */}
              <div className="space-y-3">
                {incubatorIdeas.length > 0 ? (
                  incubatorIdeas.map(idea => (
                    <div
                      key={idea.id}
                      className="rounded-xl p-4"
                      style={{ background: '#13141a', border: '1px solid #1e2030' }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[idea.category]}`}>
                              {idea.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[idea.status]}`}>
                              {idea.status}
                            </span>
                            <span className="text-xs text-slate-500">{idea.agent_name}</span>
                          </div>
                          <p className="text-sm text-white">{idea.idea}</p>
                          <div className="mt-2 text-xs text-slate-600">
                            Created {new Date(idea.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => voteIdea(idea.id, 'up')}
                              className="p-1.5 rounded hover:bg-emerald-500/20 transition-colors"
                            >
                              <ThumbsUp className="w-4 h-4 text-emerald-400" />
                            </button>
                            <span className="text-sm text-slate-400 min-w-[2rem] text-center font-medium">
                              {idea.votes}
                            </span>
                            <button
                              onClick={() => voteIdea(idea.id, 'down')}
                              className="p-1.5 rounded hover:bg-red-500/20 transition-colors"
                            >
                              <ThumbsDown className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                          {idea.status === 'idea' && idea.votes >= 3 && (
                            <button
                              onClick={() => updateIdeaStatus(idea.id, 'validated')}
                              className="text-xs text-emerald-400 hover:text-emerald-300"
                            >
                              Validate
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Status Progression */}
                      <div className="mt-3 flex items-center gap-2">
                        {['idea', 'validated', 'building', 'shipped'].map((s, i) => (
                          <div key={s} className="flex items-center">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                idea.status === s
                                  ? 'bg-violet-400'
                                  : ['idea', 'validated', 'building', 'shipped'].indexOf(idea.status) > i
                                  ? 'bg-emerald-400'
                                  : 'bg-slate-600'
                              }`}
                            />
                            {i < 3 && (
                              <div
                                className={`w-8 h-0.5 ${
                                  ['idea', 'validated', 'building', 'shipped'].indexOf(idea.status) > i
                                    ? 'bg-emerald-400'
                                    : 'bg-slate-700'
                                }`}
                              />
                            )}
                          </div>
                        ))}
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
          )}

          {/* Idle Work Tab */}
          {activeTab === 'idle' && (
            <div className="rounded-xl p-6" style={{ background: '#13141a', border: '1px solid #1e2030' }}>
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-5 h-5 text-violet-400" />
                <h3 className="text-sm font-medium text-white">Idle Work Queue</h3>
                <span className="text-xs text-slate-500 ml-auto">{idleWork.length} pending tasks</span>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {idleWork.length > 0 ? (
                  idleWork.map(work => (
                    <div
                      key={work.id}
                      className="p-4 rounded-lg"
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
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Agent: {work.agent_name}</span>
                        {work.assigned_to && <span>Assigned: {work.assigned_to}</span>}
                        <span>Created: {new Date(work.created_at).toLocaleDateString()}</span>
                      </div>
                      {work.task_data && Object.keys(work.task_data).length > 0 && (
                        <div className="mt-2 p-2 rounded text-xs text-slate-400" style={{ background: '#0a0b0f' }}>
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(work.task_data, null, 2)}
                          </pre>
                        </div>
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
          )}
        </>
      )}
    </div>
  )
}
