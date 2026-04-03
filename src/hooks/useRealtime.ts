import { useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

type RealtimeCallback<T> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
}) => void

export function useRealtime<T>(
  table: string,
  callback: RealtimeCallback<T>,
  deps: unknown[] = []
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const subscribe = useCallback(() => {
    try {
      const channel = supabase
        .channel(`realtime-${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          (payload) => {
            try {
              callbackRef.current({
                eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                new: payload.new as T,
                old: payload.old as T,
              })
            } catch (err) {
              console.error(`Error in realtime callback for ${table}:`, err)
            }
          }
        )
        .subscribe()

      return () => {
        try {
          supabase.removeChannel(channel)
        } catch (err) {
          console.error(`Error removing channel for ${table}:`, err)
        }
      }
    } catch (err) {
      console.error(`Error subscribing to ${table}:`, err)
      return () => {}
    }
  }, [table])

  useEffect(() => {
    const unsubscribe = subscribe()
    return unsubscribe
  }, [subscribe, ...deps])
}

export function useRealtimeSubscription<T extends Record<string, unknown>>(
  table: string,
  setItems: React.Dispatch<React.SetStateAction<T[]>>
) {
  const handleRealtimeUpdate = useCallback(
    (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: T; old: T }) => {
      try {
        setItems((prev) => {
          switch (payload.eventType) {
            case 'INSERT':
              return [...prev, payload.new]
            case 'UPDATE':
              return prev.map((item) =>
                (item as Record<string, unknown>).id ===
                (payload.new as Record<string, unknown>).id
                  ? payload.new
                  : item
              )
            case 'DELETE':
              return prev.filter(
                (item) =>
                  (item as Record<string, unknown>).id !==
                  (payload.old as Record<string, unknown>).id
              )
            default:
              return prev
          }
        })
      } catch (err) {
        console.error(`Error in realtime subscription for ${table}:`, err)
      }
    },
    [setItems]
  )

  useRealtime(table, handleRealtimeUpdate, [setItems])
}
