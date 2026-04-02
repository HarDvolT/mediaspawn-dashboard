import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Settings, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface LoopConfig {
  id: string
  enabled: boolean
  mode: 'Sequential' | 'Parallel' | 'Single'
  concurrency: number
  updated_at: string
}

export default function LoopConfigPanel() {
  const [config, setConfig] = useState<LoopConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch config
  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('loop_config')
          .select('*')
          .limit(1)
          .single()

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // No rows, create default
            const { data: newConfig, error: insertError } = await supabase
              .from('loop_config')
              .insert({
                enabled: false,
                mode: 'Sequential',
                concurrency: 1,
              })
              .select()
              .single()

            if (insertError) throw insertError
            setConfig(newConfig)
          } else {
            throw fetchError
          }
        } else {
          setConfig(data)
        }
        setError(null)
      } catch (err) {
        console.error('Failed to load loop config:', err)
        setError('Failed to load config')
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  // Update config with debounce for concurrency
  const updateConfig = useCallback(
    async (updates: Partial<LoopConfig>) => {
      if (!config) return

      setUpdating(Object.keys(updates)[0])
      try {
        const { data, error: updateError } = await supabase
          .from('loop_config')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', config.id)
          .select()
          .single()

        if (updateError) throw updateError
        setConfig(data)
        setError(null)
      } catch (err) {
        console.error('Failed to update config:', err)
        setError('Update failed')
      } finally {
        setUpdating(null)
      }
    },
    [config]
  )

  // Debounced concurrency update
  useEffect(() => {
    if (!config) return

    const timer = setTimeout(() => {
      // This is just for the debounce visual effect
      // The actual update happens on change
    }, 500)

    return () => clearTimeout(timer)
  }, [config?.concurrency])

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-medium text-white">⚙ Loop Controls</h3>
        </div>
        <div className="flex items-center justify-center py-4 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !config) {
    return (
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-medium text-white">⚙ Loop Controls</h3>
        </div>
        <p className="text-red-400 text-sm">{error || 'No config found'}</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-medium text-white">⚙ Loop Controls</h3>
      </div>

      <div className="space-y-4">
        {/* Idle Loop Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-300">Idle Loop</label>
          <button
            onClick={() => updateConfig({ enabled: !config.enabled })}
            disabled={updating === 'enabled'}
            className="flex items-center gap-2"
          >
            {config.enabled ? (
              <ToggleRight className="w-8 h-8 text-violet-400" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-gray-500" />
            )}
          </button>
        </div>

        {/* Mode Selector */}
        <div>
          <label className="text-sm text-gray-300 mb-2 block">Mode</label>
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            {(['Sequential', 'Parallel', 'Single'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => updateConfig({ mode })}
                disabled={updating === 'mode'}
                className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  config.mode === mode
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Concurrency Slider (only for Parallel mode) */}
        {config.mode === 'Parallel' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300">Concurrency</label>
              <span className="text-sm text-violet-400 font-medium">{config.concurrency}</span>
            </div>
            <input
              type="range"
              min={1}
              max={6}
              value={config.concurrency}
              onChange={(e) => {
                const value = parseInt(e.target.value)
                setConfig({ ...config, concurrency: value })
                // Debounce the update
                setTimeout(() => {
                  updateConfig({ concurrency: value })
                }, 500)
              }}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>6</span>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <p className="text-xs text-gray-500">
          Last updated {formatDistanceToNow(new Date(config.updated_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}
