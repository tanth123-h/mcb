/**
 * lib/hooks/useRealtime.ts
 * Supabase Realtime subscription for live personnel status updates.
 * Displays toast notifications when any personnel record changes.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase, Personnel } from '@/lib/supabase';
import { soundStatusChange, soundAlert } from '@/lib/sound';

export interface RealtimeEvent {
  id:        string;
  type:      'status_change' | 'new_personnel' | 'squad_change';
  personnel: Personnel;
  oldStatus?: Personnel['status'];
  newStatus?: Personnel['status'];
  timestamp: Date;
}

/**
 * Subscribe to all personnel record changes.
 * Returns the latest event + full event history.
 */
export function usePersonnelRealtime() {
  const [events,  setEvents]  = useState<RealtimeEvent[]>([]);
  const [latest,  setLatest]  = useState<RealtimeEvent | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('personnel-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'personnel' },
        (payload) => {
          const newRecord = payload.new as Personnel;
          const oldRecord = payload.old as Partial<Personnel>;

          let event: RealtimeEvent | null = null;

          if (payload.eventType === 'INSERT') {
            event = {
              id:        crypto.randomUUID(),
              type:      'new_personnel',
              personnel: newRecord,
              timestamp: new Date(),
            };
            soundAlert();
          }

          if (payload.eventType === 'UPDATE') {
            if (oldRecord.status !== newRecord.status) {
              event = {
                id:        crypto.randomUUID(),
                type:      'status_change',
                personnel: newRecord,
                oldStatus: oldRecord.status,
                newStatus: newRecord.status,
                timestamp: new Date(),
              };
              soundStatusChange();
            } else if (oldRecord.squad_id !== newRecord.squad_id) {
              event = {
                id:        crypto.randomUUID(),
                type:      'squad_change',
                personnel: newRecord,
                timestamp: new Date(),
              };
              soundAlert();
            }
          }

          if (event) {
            setLatest(event);
            setEvents(prev => [event!, ...prev].slice(0, 50)); // keep last 50
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { events, latest };
}

/**
 * Subscribe to a SINGLE personnel record for profile-page live updates.
 */
export function usePersonnelRecord(id: string) {
  const [record,  setRecord]  = useState<Personnel | null>(null);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`personnel-${id}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'personnel',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setRecord(payload.new as Personnel);
          setChanged(true);
          soundStatusChange();
          // Reset changed flag after animation
          setTimeout(() => setChanged(false), 2000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  return { record, changed };
}
