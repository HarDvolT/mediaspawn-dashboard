import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Users, TrendingUp, FileText, RefreshCw, Target, Eye, Share2, AlertCircle, Check } from 'lucide-react';

interface AutomationConfig {
  id: string;
  feature_key: string;
  enabled: boolean;
  config: Record<string, any>;
  last_run: string | null;
  next_run: string | null;
}

const features = [
  { key: 'daily_digest', name: 'Daily Digest', icon: Mail, description: 'Morning summary of pipelines, approvals, and activity' },
  { key: 'idle_work', name: 'Idle Work Processing', icon: RefreshCw, description: 'Process low-priority tasks during idle cycles' },
  { key: 'lead_generation', name: 'Lead Generation', icon: Target, description: 'Research and queue potential clients' },
  { key: 'client_monitoring', name: 'Client Monitoring', icon: Users, description: 'Track deadlines and inactive clients' },
  { key: 'social_prep', name: 'Social Media Prep', icon: Share2, description: 'Prepare weekly content calendar' },
  { key: 'revenue_tracking', name: 'Revenue Tracking', icon: TrendingUp, description: 'Monitor invoices and MRR' },
  { key: 'knowledge_base', name: 'Knowledge Base', icon: FileText, description: 'Auto-capture lessons and preferences' },
  { key: 'competitor_monitoring', name: 'Competitor Monitoring', icon: Eye, description: 'Track competitor activity' },
];

export default function Automation() {
  const [configs, setConfigs] = useState<AutomationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('automation_config')
        .select('*')
        .order('feature_key');
      
      if (error) throw error;
      if (data) setConfigs(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch automation configs:', err);
      setError('Failed to load automation settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchConfigs, 30000);
    return () => clearInterval(interval);
  }, [fetchConfigs]);

  async function toggleFeature(key: string, enabled: boolean) {
    setTogglingKey(key);
    setError(null);
    setSuccessKey(null);

    try {
      // First check if config exists
      const existingConfig = configs.find(c => c.feature_key === key);
      
      if (existingConfig) {
        // Update existing config
        const { error: updateError } = await supabase
          .from('automation_config')
          .update({ 
            enabled, 
            updated_at: new Date().toISOString() 
          })
          .eq('feature_key', key);

        if (updateError) throw updateError;
      } else {
        // Insert new config
        const { error: insertError } = await supabase
          .from('automation_config')
          .insert({
            feature_key: key,
            enabled,
            config: {},
          });

        if (insertError) throw insertError;
      }

      // Update local state
      setConfigs(prev => {
        const existing = prev.find(c => c.feature_key === key);
        if (existing) {
          return prev.map(c => c.feature_key === key ? { ...c, enabled } : c);
        } else {
          return [...prev, {
            id: key,
            feature_key: key,
            enabled,
            config: {},
            last_run: null,
            next_run: null,
          } as AutomationConfig];
        }
      });

      // Show success indicator
      setSuccessKey(key);
      setTimeout(() => setSuccessKey(null), 2000);
    } catch (err) {
      console.error('Failed to toggle feature:', err);
      setError(`Failed to update ${key}. Please try again.`);
      // Refresh configs to ensure UI is in sync
      fetchConfigs();
    } finally {
      setTogglingKey(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">Automation Hub</h2>
        <p className="text-sm text-gray-500">Enable and configure autonomous agency operations</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map(feature => {
          const config = configs.find(c => c.feature_key === feature.key);
          const isEnabled = config?.enabled ?? false;
          const Icon = feature.icon;
          const isToggling = togglingKey === feature.key;
          const isSuccess = successKey === feature.key;

          return (
            <div
              key={feature.key}
              className={`rounded-xl p-4 border transition-all ${
                isEnabled 
                  ? 'bg-violet-500/10 border-violet-500/30' 
                  : 'bg-gray-900 border-gray-800'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isEnabled ? 'bg-violet-500/20' : 'bg-gray-800'}`}>
                    <Icon className={`w-5 h-5 ${isEnabled ? 'text-violet-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{feature.name}</h3>
                    <p className="text-xs text-gray-500">{feature.description}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => toggleFeature(feature.key, !isEnabled)}
                  disabled={isToggling}
                  className={`relative w-12 h-6 rounded-full transition-all ${
                    isToggling 
                      ? 'opacity-50 cursor-wait' 
                      : isEnabled 
                        ? 'bg-violet-500' 
                        : 'bg-gray-700'
                  }`}
                >
                  {isSuccess ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div 
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        isEnabled ? 'left-7' : 'left-1'
                      }`} 
                    />
                  )}
                </button>
              </div>

              {isEnabled && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Last run: {config?.last_run 
                        ? new Date(config.last_run).toLocaleString() 
                        : 'Never'
                      }
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      isEnabled 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-800 text-gray-500'
                    }`}>
                      {isToggling ? 'Updating...' : 'Active'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
