'use client';

import Link from 'next/link';
import { Personnel } from '@/lib/supabase';
import { getStatusVisual } from '@/lib/utils';

export default function StatusCard({
  personnel,
  action,
  children,
}: {
  personnel: Personnel;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const visual = getStatusVisual(personnel.status);
  return (
    <div className="group relative overflow-hidden border border-border bg-surface min-h-64">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={visual.image} alt={personnel.status} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className={`absolute inset-0 bg-gradient-to-br ${visual.panel}`} />
      <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(10,15,20,0.06)_50%,rgba(10,15,20,0.2)_100%)]" />

      <div className="relative z-10 h-full flex flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] text-text-muted tracking-widest uppercase">{personnel.id}</p>
            <Link href={`/profile/${personnel.id}`} className="font-sans text-xl font-bold text-text tracking-[0.18em] uppercase hover:text-accent transition-colors">
              {personnel.codename}
            </Link>
          </div>
          {action}
        </div>

        <div className="space-y-2">
          <p className="font-mono text-[11px] text-text-dim uppercase tracking-widest">{personnel.role}</p>
          <p className={`font-sans text-2xl font-bold uppercase tracking-[0.22em] ${visual.color} ${personnel.status === 'deceased' ? 'animate-glitch' : ''}`}>
            {personnel.status}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}
