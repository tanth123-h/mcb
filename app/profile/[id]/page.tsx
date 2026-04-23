/**
 * app/profile/[id]/page.tsx
 * Individual personnel profile — classified file view.
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { PersonnelStatusBadge } from '@/components/StatusBadge';
import AvatarUpload from '@/components/AvatarUpload';
import { fetchPersonnelById, fetchSquadWithMembers } from '@/lib/data';
import { getSession, formatTimestamp, getStatusColors } from '@/lib/utils';
import { usePersonnelRecord } from '@/lib/hooks/useRealtime';
import { Personnel, Squad } from '@/lib/supabase';

type LoadPhase = 'booting' | 'decrypting' | 'ready' | 'error';

export default function ProfilePage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();

  const [phase,     setPhase]     = useState<LoadPhase>('booting');
  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [squad,     setSquad]     = useState<(Squad & { personnel: Personnel[] }) | null>(null);
  const [bootMsg,   setBootMsg]   = useState('Initializing secure channel...');
  const [isOwn,     setIsOwn]     = useState(false);

  // Live realtime updates for this record
  const { record: liveRecord, changed } = usePersonnelRecord(id);

  // When a live update arrives, merge into local state
  useEffect(() => {
    if (liveRecord) setPersonnel(prev => prev ? { ...prev, ...liveRecord } : liveRecord);
  }, [liveRecord]);

  useEffect(() => {
    const session = getSession();
    setIsOwn(session?.id === id);

    async function load() {
      const messages = [
        'Initializing secure channel...',
        'Verifying clearance level...',
        'Decrypting personnel file...',
        'Loading classified records...',
      ];

      for (const msg of messages) {
        setBootMsg(msg);
        await delay(400);
      }

      const { data, error } = await fetchPersonnelById(id);

      if (error || !data) {
        setPhase('error');
        return;
      }

      setPersonnel(data);

      // Load squad members if assigned
      if (data.squad_id) {
        const { data: sq } = await fetchSquadWithMembers(data.squad_id);
        if (sq) setSquad(sq);
      }

      setPhase('ready');
    }

    load();
  }, [id]);

  // ── Loading / Boot screen ──
  if (phase === 'booting' || phase === 'decrypting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-xs text-center space-y-6">
          <div className="w-16 h-16 border border-accent/30 flex items-center justify-center mx-auto animate-pulse-glow">
            <span className="font-mono text-accent text-sm animate-blink">▌</span>
          </div>
          <div className="space-y-2">
            <p className="font-mono text-xs text-accent tracking-widest">{bootMsg}</p>
            <div className="h-px bg-border mx-4 overflow-hidden">
              <div className="h-full bg-accent/60 animate-[scanline_1s_linear_infinite]" style={{ width: '40%' }} />
            </div>
          </div>
          <p className="font-mono text-[10px] text-text-muted">FILE: {id}</p>
        </div>
      </div>
    );
  }

  // ── Error / Not found ──
  if (phase === 'error' || !personnel) {
    return (
      <Layout title="RECORD NOT FOUND" subtitle="ERROR 404">
        <div className="py-12 max-w-sm mx-auto text-center space-y-4">
          <p className="font-mono text-xs text-red-400">
            Personnel record <span className="text-text">{id}</span> could not be located.
          </p>
          <p className="font-mono text-[10px] text-text-muted">
            The record may have been purged, archived, or the ID is incorrect.
          </p>
          <button onClick={() => router.push('/access')} className="mcb-btn-ghost mx-auto">
            ← RETURN
          </button>
        </div>
      </Layout>
    );
  }

  const colors = getStatusColors(personnel.status);
  const skills = parseSkills(personnel.role); // role is stored directly

  return (
    <Layout title={personnel.codename} subtitle={`PERSONNEL FILE // ${personnel.id}`} classified maxWidth="lg">
      <div className="py-6 space-y-4 stagger">

        {/* Top card — Avatar + Core Info */}
        <div className="mcb-panel p-5 flex flex-col sm:flex-row gap-5">

          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className={`transition-all duration-300 ${changed ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`}>
              <AvatarUpload
                personnelId={personnel.id}
                codename={personnel.codename}
                currentUrl={personnel.avatar_url}
                canEdit={isOwn}
                onUpload={(url) => setPersonnel(p => p ? { ...p, avatar_url: url } : p)}
              />
            </div>
            <div className="mt-2">
              <PersonnelStatusBadge status={personnel.status} pulse={personnel.status === 'active'} />
            </div>
            {changed && (
              <p className="font-mono text-[9px] text-accent mt-1 animate-blink tracking-widest">
                ● LIVE UPDATE
              </p>
            )}
          </div>

          {/* Core data */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="font-mono text-[10px] text-text-muted tracking-widest">CODENAME</p>
              <p className="font-sans text-2xl font-bold text-text tracking-widest animate-reveal">
                {personnel.codename}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DataField label="FULL NAME"     value={personnel.full_name} />
              <DataField label="BUREAU ID"     value={personnel.id} accent />
              <DataField label="ROLE"          value={personnel.role} />
              <DataField label="SQUAD"         value={squad?.name ?? 'UNASSIGNED'} />
            </div>
          </div>

        </div>

        {/* Status history / log panel */}
        <div className="mcb-panel p-5">
          <p className="mcb-section-header">STATUS LOG</p>
          <div className="space-y-2">
            <LogEntry
              time={formatTimestamp(personnel.created_at)}
              event="Personnel record created"
              type="info"
            />
            <LogEntry
              time={formatTimestamp(personnel.created_at)}
              event={`Status assigned: ${personnel.status.toUpperCase()}`}
              type={personnel.status === 'active' ? 'success' : 'warning'}
            />
            {personnel.status !== 'active' && (
              <LogEntry
                time="[CLASSIFIED]"
                event={`Status changed to ${personnel.status.toUpperCase()} — details redacted`}
                type="warning"
              />
            )}
          </div>
        </div>

        {/* Squad panel */}
        {squad && (
          <div className="mcb-panel p-5">
            <p className="mcb-section-header">SQUAD — {squad.name}</p>
            <p className="font-mono text-xs text-text-dim mb-4">{squad.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(squad.personnel ?? []).map(member => (
                <SquadMember key={member.id} member={member} currentId={id} />
              ))}
            </div>
          </div>
        )}

        {/* Classified footer */}
        {isOwn && (
          <div className="border border-accent/20 bg-accent/5 p-3 font-mono text-[10px] text-text-muted">
            <p>▶ You are viewing your own personnel file.</p>
            <p>Some information may be redacted per clearance level.</p>
          </div>
        )}

        <div className="flex items-center justify-between py-2">
          <span className="classified-stamp text-[9px]">TOP SECRET</span>
          <span className="font-mono text-[10px] text-text-muted">
            Last accessed: {new Date().toISOString().substring(0, 10)}
          </span>
          <span className="classified-stamp text-[9px]">DO NOT COPY</span>
        </div>

      </div>
    </Layout>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AvatarPlaceholder({ codename }: { codename: string }) {
  const initials = codename.substring(0, 2).toUpperCase();
  return (
    <div className="w-full h-full bg-surface flex items-center justify-center">
      <span className="font-mono text-2xl text-accent/60">{initials}</span>
    </div>
  );
}

function DataField({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="font-mono text-[9px] text-text-muted tracking-widest">{label}</p>
      <p className={`font-mono text-xs ${accent ? 'text-accent' : 'text-text'} font-medium`}>
        {value || '—'}
      </p>
    </div>
  );
}

function LogEntry({
  time, event, type,
}: { time: string; event: string; type: 'info' | 'success' | 'warning' | 'danger' }) {
  const color = {
    info:    'text-text-muted border-border',
    success: 'text-green-400 border-green-400/20',
    warning: 'text-yellow-400 border-yellow-400/20',
    danger:  'text-red-400 border-red-400/20',
  }[type];

  return (
    <div className={`flex gap-3 border-l-2 pl-3 py-1 ${color}`}>
      <span className="font-mono text-[10px] text-text-muted flex-shrink-0 w-40">{time}</span>
      <span className="font-mono text-[10px]">{event}</span>
    </div>
  );
}

function SquadMember({ member, currentId }: { member: Personnel; currentId: string }) {
  const colors = getStatusColors(member.status);
  const isSelf = member.id === currentId;
  return (
    <a
      href={`/profile/${member.id}`}
      className={`
        border p-2 space-y-1 transition-colors
        ${isSelf ? 'border-accent/40 bg-accent/5' : 'border-border hover:border-accent/30'}
      `}
    >
      <p className={`font-mono text-[10px] font-medium ${isSelf ? 'text-accent' : 'text-text'}`}>
        {member.codename}
        {isSelf && ' ◂ YOU'}
      </p>
      <p className="font-mono text-[9px] text-text-muted">{member.role}</p>
      <PersonnelStatusBadge status={member.status} size="sm" />
    </a>
  );
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
