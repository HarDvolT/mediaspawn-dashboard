import { useState, useEffect, useMemo } from 'react'
import { format, formatDistanceToNow, isPast, addDays } from 'date-fns'
import {
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  X,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

// Types
interface ConversationMemory {
  id: string
  summary: string
  type: 'owner_instruction' | 'preference' | 'strategic_decision'
  applies_to: string | null
  client: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

interface KnowledgeBaseIndex {
  id: string
  file_name: string
  last_read_by: string | null
  last_read_at: string
  size: number | null
}

// Type badge colors
const typeColors = {
  owner_instruction: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  preference: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  strategic_decision: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

// Add Memory Modal Component
function AddMemoryModal({
  isOpen,
  onClose,
  onSubmit,
  agents,
  clients,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AddMemoryData) => Promise<void>
  agents: string[]
  clients: string[]
}) {
  const [summary, setSummary] = useState('')
  const [type, setType] = useState<'owner_instruction' | 'preference' | 'strategic_decision'>('preference')
  const [appliesTo, setAppliesTo] = useState<string>('')
  const [client, setClient] = useState<string>('')
  const [expiresIn, setExpiresIn] = useState<string>('never')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!summary.trim()) return

    setLoading(true)
    try {
      let expiresAt: string | null = null
      if (expiresIn !== 'never') {
        const days = parseInt(expiresIn.replace('d', ''))
        expiresAt = addDays(new Date(), days).toISOString()
      }

      await onSubmit({
        summary: summary.trim(),
        type,
        applies_to: appliesTo || null,
        client: client || null,
        expires_at: expiresAt,
      })

      // Reset form
      setSummary('')
      setType('preference')
      setAppliesTo('')
      setClient('')
      setExpiresIn('never')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Add Memory</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Summary <span className="text-red-400">*</span>
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              placeholder="Enter memory content..."
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Type <span className="text-red-400">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="owner_instruction">Owner Instruction</option>
              <option value="preference">Preference</option>
              <option value="strategic_decision">Strategic Decision</option>
            </select>
          </div>

          {/* Applies To */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Applies To
            </label>
            <select
              value={appliesTo}
              onChange={(e) => setAppliesTo(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All agents</option>
              {agents.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Client
            </label>
            <select
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Expires In */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Expires In
            </label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="never">Never</option>
              <option value="1d">1 day</option>
              <option value="3d">3 days</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !summary.trim()}
              className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : 'Add Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface AddMemoryData {
  summary: string
  type: 'owner_instruction' | 'preference' | 'strategic_decision'
  applies_to: string | null
  client: string | null
  expires_at: string | null
}

// Expire Confirmation Modal
function ExpireConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  memorySummary,
  loading,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  memorySummary: string
  loading: boolean
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-sm mx-4 shadow-2xl">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Expire Memory?</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            This will mark the following memory as expired:
          </p>
          <p className="text-gray-300 text-sm bg-gray-800 rounded-lg p-3 mb-4 line-clamp-3">
            {memorySummary}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Expiring...' : 'Expire Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Memory() {
  // Active Memories State
  const [memories, setMemories] = useState<ConversationMemory[]>([])
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseIndex[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter State
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [showExpired, setShowExpired] = useState(false)

  // Archive State
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiveSearch, setArchiveSearch] = useState('')

  // Modal State
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [expireModalOpen, setExpireModalOpen] = useState(false)
  const [selectedMemory, setSelectedMemory] = useState<ConversationMemory | null>(null)
  const [expireLoading, setExpireLoading] = useState(false)

  // Get unique agents and clients for dropdowns
  const agents = useMemo(() => {
    const uniqueAgents = new Set<string>()
    memories.forEach((m) => {
      if (m.applies_to) uniqueAgents.add(m.applies_to)
    })
    return Array.from(uniqueAgents).sort()
  }, [memories])

  const clients = useMemo(() => {
    const uniqueClients = new Set<string>()
    memories.forEach((m) => {
      if (m.client) uniqueClients.add(m.client)
    })
    return Array.from(uniqueClients).sort()
  }, [memories])

  // Filtered active memories
  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      if (!showExpired && !m.is_active) return false
      if (typeFilter !== 'all' && m.type !== typeFilter) return false
      if (agentFilter !== 'all' && m.applies_to !== agentFilter) return false
      return true
    })
  }, [memories, typeFilter, agentFilter, showExpired])

  // Archive memories (all non-active + active if show expired)
  const archiveMemories = useMemo(() => {
    return memories.filter((m) => {
      if (archiveSearch) {
        const search = archiveSearch.toLowerCase()
        return (
          m.summary.toLowerCase().includes(search) ||
          m.type.toLowerCase().includes(search) ||
          (m.applies_to?.toLowerCase().includes(search) ?? false) ||
          (m.client?.toLowerCase().includes(search) ?? false)
        )
      }
      return true
    })
  }, [memories, archiveSearch])

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [memoriesRes, kbRes] = await Promise.all([
          supabase
            .from('conversation_memory')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('knowledge_base_index')
            .select('*')
            .order('last_read_at', { ascending: false }),
        ])

        if (memoriesRes.error) throw memoriesRes.error
        if (kbRes.error) throw kbRes.error

        setMemories(memoriesRes.data || [])
        setKnowledgeBase(kbRes.data || [])
        setError(null)
      } catch (err) {
        console.error('Failed to load memory data:', err)
        setError('Failed to load memory data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Add memory handler
  const handleAddMemory = async (data: AddMemoryData) => {
    const { error } = await supabase.from('conversation_memory').insert({
      summary: data.summary,
      type: data.type,
      applies_to: data.applies_to,
      client: data.client,
      expires_at: data.expires_at,
      is_active: true,
    })

    if (error) throw error

    // Refetch memories
    const { data: newMemories } = await supabase
      .from('conversation_memory')
      .select('*')
      .order('created_at', { ascending: false })
    if (newMemories) setMemories(newMemories)
  }

  // Expire memory handler
  const handleExpireMemory = async () => {
    if (!selectedMemory) return

    setExpireLoading(true)
    try {
      const { error } = await supabase
        .from('conversation_memory')
        .update({ is_active: false })
        .eq('id', selectedMemory.id)

      if (error) throw error

      // Update local state
      setMemories((prev) =>
        prev.map((m) => (m.id === selectedMemory.id ? { ...m, is_active: false } : m))
      )

      setExpireModalOpen(false)
      setSelectedMemory(null)
    } finally {
      setExpireLoading(false)
    }
  }

  // Format expiry
  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return { text: 'Never', isExpired: false }
    const date = new Date(expiresAt)
    const expired = isPast(date)
    return {
      text: format(date, 'MMM d'),
      isExpired: expired,
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Memory</h2>
          <p className="text-sm text-slate-500">Agent memory and knowledge store</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Memory
        </button>
      </div>

      {/* SECTION 1: Active Memories */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-medium text-white mb-3">Active Memories</h3>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter */}
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
              {['all', 'owner_instruction', 'preference', 'strategic_decision'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    typeFilter === type
                      ? 'bg-violet-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {type === 'all' ? 'All' : type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </button>
              ))}
            </div>

            {/* Agent Filter */}
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Agents</option>
              {agents.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>

            {/* Show Expired Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showExpired}
                onChange={(e) => setShowExpired(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-violet-500 focus:ring-violet-500"
              />
              <span className="text-sm text-gray-400">Show expired</span>
            </label>
          </div>
        </div>

        {/* Memories Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-400">{error}</div>
          ) : filteredMemories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No memories found
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Type</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Summary</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Applies To</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Client</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Expires</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMemories.map((memory) => {
                  const expiry = formatExpiry(memory.expires_at)
                  return (
                    <tr key={memory.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full border ${typeColors[memory.type]}`}>
                          {memory.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white text-sm max-w-md">
                        <p className="line-clamp-2">{memory.summary}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {memory.applies_to || 'All agents'}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {memory.client || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm ${expiry.isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                          {expiry.text}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {memory.is_active && (
                          <button
                            onClick={() => {
                              setSelectedMemory(memory)
                              setExpireModalOpen(true)
                            }}
                            className="text-xs px-2 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                          >
                            Expire Now
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 2: Knowledge Base Status */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-medium text-white">Knowledge Base Status</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : knowledgeBase.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No knowledge base entries</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">File Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Last Read By</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Last Read At</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Size</th>
                </tr>
              </thead>
              <tbody>
                {knowledgeBase.map((kb) => (
                  <tr key={kb.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-white text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        {kb.file_name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {kb.last_read_by || '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {formatDistanceToNow(new Date(kb.last_read_at), { addSuffix: true })}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {kb.size ? `${(kb.size / 1024).toFixed(1)} KB` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: Memory Archive (Collapsible) */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800">
        <button
          onClick={() => setArchiveOpen(!archiveOpen)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-medium text-white">Memory Archive</h3>
          {archiveOpen ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {archiveOpen && (
          <div className="px-4 pb-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                placeholder="Search archive..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Archive Table */}
            {archiveMemories.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No archived memories</div>
            ) : (
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-900">
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-2 px-4 text-gray-400 font-medium text-xs">Type</th>
                      <th className="text-left py-2 px-4 text-gray-400 font-medium text-xs">Summary</th>
                      <th className="text-left py-2 px-4 text-gray-400 font-medium text-xs">Status</th>
                      <th className="text-left py-2 px-4 text-gray-400 font-medium text-xs">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archiveMemories.map((memory) => (
                      <tr key={memory.id} className="border-b border-gray-800/30">
                        <td className="py-2 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${typeColors[memory.type]}`}>
                            {memory.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-gray-300 text-sm max-w-md truncate">
                          {memory.summary}
                        </td>
                        <td className="py-2 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${memory.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>
                            {memory.is_active ? 'Active' : 'Expired'}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-gray-500 text-xs">
                          {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddMemoryModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddMemory}
        agents={agents}
        clients={clients}
      />

      <ExpireConfirmModal
        isOpen={expireModalOpen}
        onClose={() => {
          setExpireModalOpen(false)
          setSelectedMemory(null)
        }}
        onConfirm={handleExpireMemory}
        memorySummary={selectedMemory?.summary || ''}
        loading={expireLoading}
      />
    </div>
  )
}
