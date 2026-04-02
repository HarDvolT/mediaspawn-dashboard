// TypeScript interfaces for all Supabase tables

export interface AgentRegistry {
  id: string
  name: string
  version: string
  status: 'active' | 'idle' | 'offline' | 'error'
  last_seen: string
  config?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AgentLog {
  id: string
  agent_name: string
  pipeline_run_id?: string
  event_type: 'task_start' | 'task_complete' | 'milestone' | 'error' | 'rate_limit' | 'input_request' | 'notification'
  task_description: string
  status: 'processing' | 'completed' | 'failed' | 'blocked' | 'waiting'
  output_summary?: string
  tokens_used?: number
  duration_ms?: number
  rpm_limited?: boolean
  created_at: string
}

export interface StagedAction {
  id: string
  action_type: 'email' | 'invoice' | 'post' | 'document' | 'db_migration' | 'script' | 'other'
  action_data: Record<string, unknown>
  agent_name: string
  client_id?: string
  summary: string
  status: 'pending' | 'approved' | 'rejected' | 'executed'
  rejection_reason?: string
  approved_by?: string
  executed_at?: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  status: 'lead' | 'active' | 'churned' | 'prospect'
  total_revenue?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface ProjectRegistry {
  id: string
  client_id?: string
  name: string
  type: string
  status: 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled'
  repository_url?: string
  budget?: number
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  client_id: string
  project_id?: string
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  paid_at?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface PipelineRun {
  id: string
  agent_id: string
  client_id?: string
  project_id?: string
  task_brief?: string
  status: 'pending' | 'active' | 'completed' | 'failed' | 'blocked'
  agents_involved?: string[]
  current_step?: string
  total_steps?: number
  completed_steps?: number
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Todo {
  id: string
  agent_name: string
  task: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date?: string
  completed_at?: string
  created_at: string
}

export interface LoopConfig {
  id: string
  agent_name: string
  mode: 'sequential' | 'parallel' | 'conditional'
  concurrency: number
  enabled: boolean
  schedule?: string
  created_at: string
  updated_at: string
}

export interface SpawnedAgent {
  id: string
  parent_agent: string
  name: string
  purpose: string
  status: 'spawning' | 'active' | 'completed' | 'terminated'
  context?: Record<string, unknown>
  started_at: string
  ended_at?: string
  created_at: string
}

export interface ConversationMemory {
  id: string
  agent_name: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens?: number
  expires_at?: string
  created_at: string
}

export interface InputRequest {
  id: string
  agent_name: string
  pipeline_run_id?: string
  request_type: 'approval' | 'information' | 'choice' | 'confirmation'
  question: string
  options?: string[]
  context?: Record<string, unknown>
  status: 'pending' | 'answered' | 'timeout'
  answer?: string
  asked_at: string
  answered_at?: string
  expires_at?: string
}

export interface KnowledgeBaseIndex {
  id: string
  agent_name: string
  title: string
  content: string
  category: string
  tags?: string[]
  embedding?: number[]
  created_at: string
  updated_at: string
}

export interface Incubator {
  id: string
  agent_name: string
  idea: string
  category: 'feature' | 'improvement' | 'experiment' | 'research'
  status: 'idea' | 'validated' | 'building' | 'shipped' | 'archived'
  votes: number
  created_at: string
  updated_at: string
}

export interface IncubatorVote {
  id: string
  incubator_id: string
  agent_name: string
  vote: 'up' | 'down'
  created_at: string
}

export interface IdleWork {
  id: string
  agent_name: string
  task_type: string
  task_data: Record<string, unknown>
  priority: number
  status: 'queued' | 'assigned' | 'completed' | 'cancelled'
  assigned_to?: string
  created_at: string
  assigned_at?: string
  completed_at?: string
}

export interface AgentVersion {
  id: string
  agent_name: string
  version: string
  changes: string
  changelog?: string
  created_at: string
}

export interface CronJob {
  id: string
  name: string
  agent_name: string
  schedule: string
  command: string
  status: 'active' | 'paused' | 'error'
  last_run?: string
  next_run?: string
  created_at: string
  updated_at: string
}

export interface DailyDigest {
  id: string
  date: string
  agent_name: string
  digest_type: 'morning' | 'evening'
  content: Record<string, unknown>
  sent: boolean
  sent_at?: string
  created_at: string
}

export interface TelegramMessage {
  id: string
  chat_id: string
  message_id: string
  from_user?: string
  content: string
  direction: 'inbound' | 'outbound'
  processed: boolean
  processed_at?: string
  created_at: string
}

// Utility types for frontend
export type StatusColor = 'success' | 'warning' | 'error' | 'info' | 'neutral'

export interface FilterOption {
  value: string
  label: string
}

export interface DateRange {
  start: Date
  end: Date
}
