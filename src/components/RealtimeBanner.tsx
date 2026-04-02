import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { WifiOff } from 'lucide-react'

export default function RealtimeBanner() {
  const [connected, setConnected] = useState(true)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Create a channel to monitor connection status
    const channel = supabase
      .channel('connection-monitor')
      .subscribe((status) => {
        const isConnected = status === 'SUBSCRIBED'
        setConnected(isConnected)
        
        // Show banner briefly when reconnecting
        if (!isConnected) {
          setShowBanner(true)
        } else {
          // Keep banner visible for 2 seconds after reconnection
          setTimeout(() => setShowBanner(false), 2000)
        }
      })

    // Monitor for any realtime errors
    const handleError = () => {
      setConnected(false)
      setShowBanner(true)
    }

    // Check connection periodically
    const interval = setInterval(async () => {
      try {
        // Simple health check - try to fetch
        await supabase.from('agent_registry').select('id').limit(1)
      } catch {
        handleError()
      }
    }, 30000) // Every 30 seconds

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  if (!showBanner || connected) {
    return null
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-2 animate-slideDown"
      style={{ 
        background: 'linear-gradient(90deg, #dc2626, #ef4444)',
        boxShadow: '0 2px 10px rgba(239, 68, 68, 0.3)'
      }}
    >
      <WifiOff className="w-4 h-4 text-white mr-2" />
      <span className="text-sm font-medium text-white">
        Connection lost. Attempting to reconnect...
      </span>
    </div>
  )
}
