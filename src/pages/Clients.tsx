import { useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { Search, Users, Mail, Phone, Globe, FileText, Briefcase, CreditCard, Plus, X, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'

// Types
interface Client {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  country: string | null
  language: string | null
  service_type: string | null
  billing_type: string | null
  status: 'Active' | 'Prospect' | 'Inactive'
  notes: string | null
  created_at: string
}

interface PipelineRun {
  id: string
  pipeline_name: string
  status: 'running' | 'blocked' | 'completed' | 'failed'
  created_at: string
}

interface BillingRecord {
  id: string
  description: string
  amount: number
  status: 'approved' | 'pending' | 'rejected'
  created_at: string
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: 'bg-emerald-500/20 text-emerald-400',
    Prospect: 'bg-violet-500/20 text-violet-400',
    Inactive: 'bg-gray-700 text-gray-500',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.Inactive}`}>
      {status}
    </span>
  )
}

// Pipeline Status Badge
function PipelineStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    running: 'bg-violet-500/20 text-violet-400',
    blocked: 'bg-amber-500/20 text-amber-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status]}`}>
      {status}
    </span>
  )
}

// Billing Status Badge
function BillingStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: 'bg-emerald-500/20 text-emerald-400',
    pending: 'bg-amber-500/20 text-amber-400',
    rejected: 'bg-red-500/20 text-red-400',
  }
  const labels: Record<string, string> = {
    approved: 'Paid',
    pending: 'Pending',
    rejected: 'Void',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status]}`}>
      {labels[status] || status}
    </span>
  )
}

// Contact Info Field Component
function ContactField({ label, value, icon: Icon }: { label: string; value: string | null; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-gray-500" />
        <span className="text-gray-500 text-xs uppercase">{label}</span>
      </div>
      <p className="text-white text-sm">{value || '—'}</p>
    </div>
  )
}

// Add Client Modal Component
function AddClientModal({
  isOpen,
  onClose,
  onClientCreated,
}: {
  isOpen: boolean
  onClose: () => void
  onClientCreated: (client: Client) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    country: '',
    language: 'EN',
    service_type: '',
    billing_type: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: insertError } = await supabase
        .from('clients')
        .insert({
          name: formData.name,
          company: formData.company || null,
          email: formData.email || null,
          phone: formData.phone || null,
          country: formData.country || null,
          language: formData.language,
          service_type: formData.service_type || null,
          billing_type: formData.billing_type || null,
          notes: formData.notes || null,
          status: 'Prospect',
        })
        .select()
        .single()

      if (insertError) throw insertError

      onClientCreated(data)
      onClose()
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        country: '',
        language: 'EN',
        service_type: '',
        billing_type: '',
        notes: '',
      })
    } catch (err) {
      console.error('Failed to create client:', err)
      setError('Failed to create client')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Add New Client</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Name (required) */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="Client name"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="Company name"
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="+216 XX XXX XXX"
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Country</label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors"
            >
              <option value="">Select country</option>
              <option value="Tunisia">Tunisia</option>
              <option value="France">France</option>
              <option value="Germany">Germany</option>
              <option value="USA">United States</option>
              <option value="UAE">United Arab Emirates</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Language</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors"
            >
              <option value="FR">French</option>
              <option value="EN">English</option>
              <option value="AR">Arabic</option>
            </select>
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Service Type</label>
            <select
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors"
            >
              <option value="">Select service type</option>
              <option value="Social Media">Social Media</option>
              <option value="Web">Web</option>
              <option value="Ads">Ads</option>
              <option value="Branding">Branding</option>
              <option value="Full Stack">Full Stack</option>
            </select>
          </div>

          {/* Billing Type */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Billing Type</label>
            <select
              value={formData.billing_type}
              onChange={(e) => setFormData({ ...formData, billing_type: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors"
            >
              <option value="">Select billing type</option>
              <option value="Retainer">Retainer</option>
              <option value="Project">Project</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors resize-none"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Detail data
  const [activeProjects, setActiveProjects] = useState<PipelineRun[]>([])
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([])
  const [notes, setNotes] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)

  // Debounce timer ref
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch clients on mount
  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('status', { ascending: true })
          .order('name', { ascending: true })

        if (error) throw error
        setClients(data || [])
      } catch (err) {
        console.error('Failed to fetch clients:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchClients()
  }, [])

  // Fetch detail data when client selected
  useEffect(() => {
    if (!selectedClient) {
      setActiveProjects([])
      setBillingHistory([])
      setNotes('')
      return
    }

    const client = selectedClient

    async function fetchClientDetail() {
      try {
        setDetailLoading(true)
        setNotes(client.notes || '')

        // Fetch active projects
        const { data: projectsData } = await supabase
          .from('pipeline_runs')
          .select('*')
          .eq('client_id', client.id)
          .in('status', ['running', 'blocked'])
          .order('created_at', { ascending: false })

        setActiveProjects(projectsData || [])

        // Fetch billing history
        const { data: billingData } = await supabase
          .from('staged_actions')
          .select('*')
          .eq('client_id', client.id)
          .eq('type', 'invoice')
          .order('created_at', { ascending: false })
          .limit(10)

        setBillingHistory(billingData || [])
      } catch (err) {
        console.error('Failed to fetch client detail:', err)
      } finally {
        setDetailLoading(false)
      }
    }

    fetchClientDetail()
  }, [selectedClient])

  // Auto-save notes with debounce
  const saveNotes = useCallback(async (clientId: string, notesValue: string) => {
    try {
      setNotesSaving(true)
      await supabase
        .from('clients')
        .update({ notes: notesValue })
        .eq('id', clientId)
    } catch (err) {
      console.error('Failed to save notes:', err)
    } finally {
      setNotesSaving(false)
    }
  }, [])

  const handleNotesChange = (value: string) => {
    setNotes(value)

    if (notesDebounceRef.current) {
      clearTimeout(notesDebounceRef.current)
    }

    if (selectedClient) {
      notesDebounceRef.current = setTimeout(() => {
        saveNotes(selectedClient.id, value)
      }, 1000)
    }
  }

  // Filter clients by search
  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase()
    return (
      client.name.toLowerCase().includes(query) ||
      (client.company?.toLowerCase().includes(query) ?? false)
    )
  })

  // Handle client created
  const handleClientCreated = (client: Client) => {
    setClients((prev) => [...prev, client])
    setSelectedClient(client)
  }

  return (
    <div className="flex h-full">
      {/* LEFT PANEL - Client List */}
      <div className="w-[35%] bg-gray-900 border-r border-gray-700 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-white">Clients</h1>
              <span className="bg-violet-500/20 text-violet-400 text-xs px-2 py-0.5 rounded-full">
                {clients.length}
              </span>
            </div>
          </div>

          {/* Add Client Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg px-4 py-2.5 transition-colors flex items-center justify-center gap-2 mb-4"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        </div>

        {/* Client List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse h-24" />
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'No clients match your search' : 'No clients yet'}
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedClient?.id === client.id
                    ? 'bg-gray-800 border-l-2 border-violet-500'
                    : 'hover:bg-gray-800'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-white font-medium">{client.name}</h3>
                  <StatusBadge status={client.status} />
                </div>
                {client.company && (
                  <p className="text-gray-400 text-sm mb-1">{client.company}</p>
                )}
                <p className="text-gray-500 text-xs">
                  0 active projects
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Client Detail */}
      <div className="flex-1 overflow-y-auto p-8">
        {!selectedClient ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p>Select a client</p>
          </div>
        ) : detailLoading ? (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 animate-pulse h-24" />
            <div className="bg-gray-800 rounded-xl p-6 animate-pulse h-48" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-semibold text-white">{selectedClient.name}</h2>
                  <StatusBadge status={selectedClient.status} />
                </div>
                {selectedClient.company && (
                  <p className="text-gray-400">{selectedClient.company}</p>
                )}
              </div>
              <button className="text-gray-400 hover:text-white transition-colors">
                Edit
              </button>
            </div>

            {/* Contact Info Grid */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-gray-400 text-sm font-medium mb-4">Contact Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <ContactField label="Email" value={selectedClient.email} icon={Mail} />
                <ContactField label="Phone" value={selectedClient.phone} icon={Phone} />
                <ContactField label="Country" value={selectedClient.country} icon={Globe} />
                <ContactField label="Language" value={selectedClient.language} icon={FileText} />
                <ContactField label="Service Type" value={selectedClient.service_type} icon={Briefcase} />
                <ContactField label="Billing" value={selectedClient.billing_type} icon={CreditCard} />
              </div>
            </div>

            {/* Active Projects */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-gray-400 text-sm font-medium mb-4">Active Projects</h3>
              {activeProjects.length === 0 ? (
                <p className="text-gray-500 text-sm">No active projects</p>
              ) : (
                <div className="space-y-2">
                  {activeProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between bg-gray-900 rounded-lg p-3"
                    >
                      <div>
                        <p className="text-white font-medium">{project.pipeline_name}</p>
                        <p className="text-gray-500 text-xs">
                          {format(new Date(project.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <PipelineStatusBadge status={project.status} />
                        <a
                          href={`/pipelines?pipeline=${project.id}`}
                          className="text-violet-400 hover:text-violet-300 flex items-center gap-1 text-sm"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Billing History */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-gray-400 text-sm font-medium mb-4">Billing History</h3>
              {billingHistory.length === 0 ? (
                <p className="text-gray-500 text-sm">No billing history</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-3 text-gray-500 text-xs uppercase">Date</th>
                        <th className="text-left py-2 px-3 text-gray-500 text-xs uppercase">Description</th>
                        <th className="text-right py-2 px-3 text-gray-500 text-xs uppercase">Amount</th>
                        <th className="text-right py-2 px-3 text-gray-500 text-xs uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingHistory.map((record) => (
                        <tr key={record.id} className="border-b border-gray-800">
                          <td className="py-3 px-3 text-gray-400 text-sm">
                            {format(new Date(record.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="py-3 px-3 text-white text-sm">{record.description}</td>
                          <td className="py-3 px-3 text-right text-white text-sm">
                            ${record.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <BillingStatusBadge status={record.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">Notes</h3>
                {notesSaving && (
                  <span className="text-gray-500 text-xs">Saving...</span>
                )}
              </div>
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-gray-300 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                rows={4}
                placeholder="Add notes about this client..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onClientCreated={handleClientCreated}
      />
    </div>
  )
}
