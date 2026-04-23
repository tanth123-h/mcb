/**
 * components/RealtimeToast.tsx
 * Live broadcast notifications for personnel status changes.
 * Mounts globally in the layout — visible across all pages.
 */

'use client';

import { useEffect, useState } from 'react';
import { usePersonnelRealtime, RealtimeEvent } from '@/lib/hooks/useRealtime';
import { PersonnelStatusBadge } from './StatusBadge';

const STATUS_VERBS: Record<string, string> = {
  active:      'returned to active duty',
  injured:     'reported as INJURED',
  deceased:    'listed as DECEASED',
  missing:     'marked as MISSING',
  observation: 'placed under OBSERVATION',
};

export default function RealtimeToast() {
  const { latest } = usePersonnelRealtime();
  const [visible,   setVisible]   = useState(false);
  const [displayed, setDisplayed] = useState<RealtimeEvent | null>(null);

  useEffect(() => {
    if (!latest) return;

    setDisplayed(latest);
    setVisible(true);

    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [latest]);

  if (!displayed) return null;

  return (
    <div
      className={`
        fixed bottom-10 right-4 z-[200] w-72
        mcb-panel border-accent/30
        transition-all duration-400 ease-out
        ${visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-[9px] text-accent tracking-widest">BUREAU BROADCAST</span>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="font-mono text-[10px] text-text-muted hover:text-text"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="px-3 py-3 space-y-2">
        {displayed.type === 'status_change' && (
          <>
            <p className="font-mono text-[10px] text-text-dim leading-relaxed">
              <span className="text-text font-bold">{displayed.personnel.codename}</span>
              {' '}has been{' '}
              <span className="text-accent">
                {STATUS_VERBS[displayed.newStatus ?? ''] ?? `updated to ${displayed.newStatus}`}
              </span>
              .
            </p>
            <div className="flex items-center gap-2">
              {displayed.oldStatus && (
                <>
                  <PersonnelStatusBadge status={displayed.oldStatus} size="sm" />
                  <span className="font-mono text-[10px] text-text-muted">→</span>
                </>
              )}
              {displayed.newStatus && (
                <PersonnelStatusBadge status={displayed.newStatus} size="sm" pulse />
              )}
            </div>
          </>
        )}

        {displayed.type === 'new_personnel' && (
          <p className="font-mono text-[10px] text-text-dim">
            New operative{' '}
            <span className="text-accent font-bold">{displayed.personnel.codename}</span>
            {' '}[{displayed.personnel.id}] has joined the Bureau.
          </p>
        )}

        {displayed.type === 'squad_change' && (
          <p className="font-mono text-[10px] text-text-dim">
            <span className="text-accent font-bold">{displayed.personnel.codename}</span>
            {' '}has been reassigned to a new squad.
          </p>
        )}

        <div className="flex items-center justify-between mt-1">
          <span className="font-mono text-[9px] text-text-muted">
            {displayed.timestamp.toISOString().substring(11, 19)} UTC
          </span>
          <a
            href={`/profile/${displayed.personnel.id}`}
            className="font-mono text-[9px] text-accent hover:underline"
          >
            VIEW FILE →
          </a>
        </div>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="h-px bg-border mx-3 mb-2 overflow-hidden">
        <div
          className="h-full bg-accent/40 origin-left"
          style={{
            animation: visible ? 'progressDrain 5s linear forwards' : 'none',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes progressDrain {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}
