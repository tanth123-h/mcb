/**
 * app/squad/[id]/page.tsx
 * Squad detail — members, mission counts, status overview.
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { PersonnelStatusBadge } from '@/components/StatusBadge';
import { fetchSquadWithMembers, fetchTaskCountsForPersonnel } from '@/lib/data';
import { getSession, getStatusColors, formatTimestamp } from '@/lib/utils';
import { Personnel, Squad } from '@/lib/supabase';

type SquadWithPersonnel = Squad & { personnel: Personnel[] };

export default function SquadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [squad, setSquad] = useState<SquadWithPersonnel | null>(null);
  const [taskCounts, setTaskCounts] = useState<Record<string, { total: number; completed: number }>>({});
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/access'); return; }
    setMyId(session.id);

    async function load() {
      const { data, error } = await fetchSquadWithMembers(id);
      if (error || !data) { setLoading(false); return; }
      setSquad(data);

      const ids = (data.personnel ?? []).map(p => p.id);
      const { data: counts } = await fetchTaskCountsForPersonnel(ids);
      setTaskCounts(counts);
      setLoading(false);
    }
    load();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-xs text-text-muted animate-blink">Loading squad data...</p>
      </div>
    );
  }

  if (!squad) {
    return (
      <Layout title="SQUAD NOT FOUND" subtitle="ERROR 404">
        <div className="py-12 max-w-sm mx-auto text-center space-y-4">
          <p className="font-mono text-xs text-red-400">Squad record {id} not found.</p>
          <button onClick={() => router.back()} className="mcb-btn-ghost mx-auto">← RETURN</button>
        </div>
      </Layout>
    );
  }

  const members = squad.personnel ?? [];
  const totalTasks = members.reduce((s, p) => s + (taskCounts[p.id]?.total ?? 0), 0);
  const completedTasks = members.reduce((s, p) => s + (taskCounts[p.id]?.completed ?? 0), 0);
  const statusCounts = members.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeCount = statusCounts['active'] ?? 0;
  const readiness = members.length > 0 ? Math.round((activeCount / members.length) * 100) : 0;

  return (
    <Layout title={squad.name} subtitle="SQUAD DOSSIER" classified maxWidth="lg">
      <div className="py-6 space-y-4 stagger">

        {/* Squad header card */}
        <div className="mcb-panel p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="font-mono text-[9px] text-text-muted tracking-widest">SQUAD DESIGNATION</p>
              <p className="font-sans text-3xl font-bold tracking-[0.2em] text-text">{squad.name}</p>
              <p className="font-mono text-xs text-text-dim">{squad.description}</p>
            </div>
            <div className="text-right space-y-1 flex-shrink-0">
              <p className="font-mono text-[9px] text-text-muted tracking-widest">FORMED</p>
              <p className="font-mono text-[10px] text-text">{formatTimestamp(squad.created_at).substring(0, 10)}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 border-t border-border/50 pt-4">
            <StatBlock label="MEMBERS"    value={String(members.length)}   color="text-text" />
            <StatBlock label="ACTIVE"     value={String(activeCount)}       color="text-green-400" />
            <StatBlock label="MISSIONS"   value={String(totalTasks)}        color="text-accent" />
            <StatBlock label="COMPLETED"  value={String(completedTasks)}    color="text-green-400" />
          </div>

          {/* Readiness bar */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[9px] text-text-muted">
              <span>OPERATIONAL READINESS</span>
              <span className={readiness >= 70 ? 'text-green-400' : readiness >= 40 ? 'text-yellow-400' : 'text-red-400'}>
                {readiness}%
              </span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ${readiness >= 70 ? 'bg-green-400' : readiness >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                style={{ width: `${readiness}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="grid grid-cols-5 gap-2">
          {(['active','injured','missing','observation','deceased'] as Personnel['status'][]).map(s => {
            const col = getStatusColors(s);
            const cnt = statusCounts[s] ?? 0;
            return (
              <div key={s} className={`mcb-panel p-3 text-center space-y-1 ${cnt > 0 ? '' : 'opacity-30'}`}>
                <p className={`font-sans text-xl font-bold ${col.text}`}>{cnt}</p>
                <p className="font-mono text-[8px] text-text-muted tracking-widest uppercase">{s}</p>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${col.dot}`} />
              </div>
            );
          })}
        </div>

        {/* Member roster */}
        <div className="space-y-2">
          <p className="mcb-section-header">OPERATIVE ROSTER ({members.length})</p>
          {members.length === 0 ? (
            <div className="mcb-panel p-8 text-center">
              <p className="font-mono text-xs text-text-muted">No operatives assigned to this squad.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members
                .sort((a, b) => {
                  const order = ['active','injured','missing','observation','deceased'];
                  return order.indexOf(a.status) - order.indexOf(b.status);
                })
                .map(member => {
                  const tc = taskCounts[member.id] ?? { total: 0, completed: 0 };
                  const isSelf = member.id === myId;
                  const col = getStatusColors(member.status);
                  return (
                    <Link
                      key={member.id}
                      href={`/profile/${member.id}`}
                      className={`mcb-panel mcb-card-hover p-4 flex items-center gap-4 ${isSelf ? 'border-accent/30 bg-accent/5' : ''}`}
                    >
                      {/* Status indicator */}
                      <div className={`w-10 h-10 flex-shrink-0 border font-mono text-sm flex items-center justify-center ${col.bg} ${col.text} border-current/20`}>
                        {member.avatar_url
                          ? <img src={member.avatar_url} alt={member.codename} className="w-full h-full object-cover"/>
                          : member.codename.substring(0, 2)
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-sans font-bold tracking-widest text-sm ${isSelf ? 'text-accent' : 'text-text'}`}>
                            {member.codename}
                            {isSelf && <span className="font-mono text-[9px] text-accent/60 ml-1.5">YOU</span>}
                          </p>
                          <PersonnelStatusBadge status={member.status} size="sm" pulse={member.status === 'active'} />
                        </div>
                        <p className="font-mono text-[10px] text-text-dim">{member.role}</p>
                        <p className="font-mono text-[9px] text-text-muted">{member.id}</p>
                      </div>

                      {/* Task stats */}
                      <div className="text-right flex-shrink-0 space-y-1">
                        <p className="font-mono text-[9px] text-text-muted tracking-widest">MISSIONS</p>
                        <p className="font-mono text-sm font-bold text-text">{tc.total}</p>
                        <p className="font-mono text-[9px] text-green-400">{tc.completed} done</p>
                      </div>

                      <span className="font-mono text-[10px] text-text-muted/40 ml-1">→</span>
                    </Link>
                  );
                })}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex gap-3 pt-2">
          <button onClick={() => router.back()} className="mcb-btn-ghost flex-1">← BACK</button>
          <Link href="/dashboard" className="mcb-btn-primary flex-1 text-center">DASHBOARD</Link>
        </div>

      </div>
    </Layout>
  );
}

function StatBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center space-y-0.5">
      <p className={`font-sans text-2xl font-bold ${color}`}>{value}</p>
      <p className="font-mono text-[8px] text-text-muted tracking-widest">{label}</p>
    </div>
  );
}
