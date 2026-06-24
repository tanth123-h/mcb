/**
 * app/dashboard/page.tsx
 * Member dashboard — world map, all-personnel status board, quick account card.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import WorldMap from '@/components/WorldMap';
import { PersonnelStatusBadge } from '@/components/StatusBadge';
import { fetchAllPersonnel } from '@/lib/data';
import { getSession, getStatusColors } from '@/lib/utils';
import { Personnel } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';

const STATUS_ORDER: Personnel['status'][] = ['active', 'injured', 'missing', 'observation', 'deceased'];

export default function DashboardPage() {
  const router = useRouter();
  const session = useMemo(() => getSession(), []);
  const { t } = useI18n();

  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Personnel['status'] | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!session) { router.replace('/access'); return; }
    fetchAllPersonnel().then(({ data }) => {
      setPersonnel(data);
      setLoading(false);
    });
  }, [router, session]);

  if (!session) return null;

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = personnel.filter(p => p.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const filtered = personnel
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p =>
      search === '' ||
      p.codename.toLowerCase().includes(search.toLowerCase()) ||
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  const myRecord = personnel.find(p => p.id === session.id);

  return (
    <Layout title="BUREAU DASHBOARD" subtitle={`OPERATIVE // ${session.codename}`} classified maxWidth="2xl">
      <div className="py-6 space-y-6">

        {/* Account card + global stats row */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">

          {/* My account card */}
          <Link href={`/profile/${session.id}`} className="group mcb-panel mcb-card-hover p-5 flex gap-4 items-start hover:border-accent/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
            <div className="relative z-10 flex gap-4 items-start w-full">
              {/* Avatar placeholder / real */}
              <div className="w-14 h-14 border border-accent/30 bg-surface flex items-center justify-center flex-shrink-0 font-mono text-lg text-accent/70 group-hover:border-accent/60 transition-colors">
                {myRecord?.avatar_url
                  ? <img src={myRecord.avatar_url} alt={session.codename} className="w-full h-full object-cover"/>
                  : session.codename.substring(0, 2)
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[9px] text-text-muted tracking-widest mb-0.5">YOUR PERSONNEL FILE</p>
                <p className="font-sans text-xl font-bold tracking-widest text-text truncate">{session.codename}</p>
                <p className="font-mono text-[10px] text-text-dim truncate">{session.role}</p>
                <div className="mt-2">
                  {myRecord && <PersonnelStatusBadge status={myRecord.status} pulse={myRecord.status === 'active'} />}
                </div>
              </div>
              <span className="font-mono text-[10px] text-accent/50 group-hover:text-accent transition-colors self-start mt-1">→</span>
            </div>
          </Link>

          {/* Status counters */}
          <div className="grid grid-cols-5 gap-2">
            {STATUS_ORDER.map(s => {
              const col = getStatusColors(s);
              return (
                <button
                  key={s}
                  onClick={() => setFilter(filter === s ? 'all' : s)}
                  className={`mcb-panel p-3 text-center space-y-1 transition-all hover:border-current/40 ${filter === s ? `border-current/50 ${col.text}` : 'border-border'}`}
                >
                  <p className={`font-sans text-2xl font-bold ${col.text}`}>{counts[s] ?? 0}</p>
                  <p className={`font-mono text-[8px] tracking-widest uppercase ${filter === s ? col.text : 'text-text-muted'}`}>{s}</p>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${col.dot} ${s === 'active' ? 'animate-pulse' : ''}`}/>
                </button>
              );
            })}
          </div>
        </div>

        {/* World map */}
        <div className="mcb-panel p-0 overflow-hidden">
          <div className="border-b border-border px-4 py-2 flex items-center justify-between">
            <p className="mcb-section-header mb-0 border-0 pb-0">GLOBAL SECTOR MAP</p>
            <span className="font-mono text-[9px] text-accent/50 tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse inline-block"/>
              LIVE
            </span>
          </div>
          <WorldMap className="h-64 sm:h-80" />
        </div>

        {/* Personnel board */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <p className="mcb-section-header mb-0 border-0 pb-0">
              PERSONNEL STATUS BOARD
              <span className="ml-2 font-mono text-[9px] text-text-muted">({filtered.length} records)</span>
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search codename / role..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="mcb-input text-[11px] py-1.5 flex-1 sm:w-48"
              />
              {filter !== 'all' && (
                <button onClick={() => setFilter('all')} className="mcb-btn-ghost text-[10px] py-1.5 px-3">✕ CLEAR</button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="mcb-panel p-8 text-center">
              <p className="font-mono text-xs text-text-muted animate-blink">Loading personnel records...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="mcb-panel p-8 text-center">
              <p className="font-mono text-xs text-text-muted">No records match query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(p => (
                <PersonnelCard key={p.id} personnel={p} isSelf={p.id === session.id} />
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}

function PersonnelCard({ personnel, isSelf }: { personnel: Personnel; isSelf: boolean }) {
  const col = getStatusColors(personnel.status);

  return (
    <Link
      href={`/profile/${personnel.id}`}
      className={`
        group mcb-panel mcb-card-hover p-4 flex gap-3 items-start
        ${isSelf ? 'border-accent/30 bg-accent/5' : ''}
      `}
    >
      {/* Avatar / initials */}
      <div className={`
        w-10 h-10 flex-shrink-0 border font-mono text-sm flex items-center justify-center
        ${col.bg} ${col.text} border-current/20
        group-hover:border-accent/40 transition-colors
      `}>
        {personnel.avatar_url
          ? <img src={personnel.avatar_url} alt={personnel.codename} className="w-full h-full object-cover"/>
          : personnel.codename.substring(0, 2)
        }
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`font-sans font-bold tracking-widest text-sm truncate ${isSelf ? 'text-accent' : 'text-text group-hover:text-accent transition-colors'}`}>
            {personnel.codename}
            {isSelf && <span className="font-mono text-[9px] text-accent/60 ml-1.5">YOU</span>}
          </p>
          <PersonnelStatusBadge status={personnel.status} size="sm" pulse={personnel.status === 'active'} />
        </div>
        <p className="font-mono text-[10px] text-text-dim truncate">{personnel.role}</p>
        <p className="font-mono text-[9px] text-text-muted">{personnel.id}</p>
      </div>
    </Link>
  );
}
