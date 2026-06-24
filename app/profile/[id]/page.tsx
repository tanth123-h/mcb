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
import RecordImage from '@/components/RecordImage';
import { fetchPersonnelById, fetchSquadWithMembers, fetchApplicationByCodename } from '@/lib/data';
import { getSession, formatTimestamp, getStatusColors, getStatusVisual } from '@/lib/utils';
import { usePersonnelRecord } from '@/lib/hooks/useRealtime';
import { Application, Personnel, Squad } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';

type LoadPhase = 'booting' | 'decrypting' | 'ready' | 'error';

export default function ProfilePage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { t } = useI18n();

  const [phase,     setPhase]     = useState<LoadPhase>('booting');
  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [squad,     setSquad]     = useState<(Squad & { personnel: Personnel[] }) | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
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
      const { data: appData } = await fetchApplicationByCodename(data.codename);
      if (appData) setApplication(appData);

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
      <Layout title={t('record_not_found')} subtitle="ERROR 404">
        <div className="py-12 max-w-sm mx-auto text-center space-y-4">
          <p className="font-mono text-xs text-red-400">
            Personnel record <span className="text-text">{id}</span> {t('record_error_desc')}
          </p>
          <p className="font-mono text-[10px] text-text-muted">{t('record_purged')}</p>
          <button onClick={() => router.push('/access')} className="mcb-btn-ghost mx-auto">
            {t('btn_return_back')}
          </button>
        </div>
      </Layout>
    );
  }

  const statusVisual = getStatusVisual(personnel.status);

  return (
    <Layout title={personnel.codename} subtitle={`PERSONNEL FILE // ${personnel.id}`} classified maxWidth="lg">
      <div className="py-6 space-y-4 stagger">

        {/* Hero banner — full-width status visual */}
        <div className="relative overflow-hidden border border-border min-h-60 rounded-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={statusVisual.image} alt={personnel.status} className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className={`absolute inset-0 bg-gradient-to-br ${statusVisual.panel}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />

          {/* Decorative scan lines on hero */}
          <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none" />

          <div className="relative z-10 p-6 min-h-60 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[9px] text-text-muted/70 tracking-[0.4em] uppercase mb-1">{t('status_banner')}</p>
                <p className="font-sans text-4xl sm:text-5xl font-bold tracking-[0.15em] uppercase text-text drop-shadow-lg">
                  {personnel.codename}
                </p>
              </div>
              <PersonnelStatusBadge status={personnel.status} pulse={personnel.status === 'active'} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className={`font-sans text-5xl font-bold uppercase tracking-[0.2em] ${statusVisual.color} drop-shadow-lg`}>
                  {personnel.status.toUpperCase()}
                </p>
                <p className="font-mono text-[10px] text-text-dim/80 tracking-widest uppercase mt-1">{personnel.role}</p>
              </div>
              <div className="text-right font-mono text-[9px] text-text-muted/60 space-y-0.5">
                <p>{personnel.id}</p>
                <p>ENROLLED {formatTimestamp(personnel.created_at).substring(0, 10)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar + Core data card */}
        <div className="mcb-panel p-5 flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 space-y-2">
            <div className={`transition-all duration-300 ${changed ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`}>
              <AvatarUpload
                personnelId={personnel.id}
                codename={personnel.codename}
                currentUrl={personnel.avatar_url}
                canEdit={isOwn}
                onUpload={(url) => setPersonnel(p => p ? { ...p, avatar_url: url } : p)}
              />
            </div>
            <PersonnelStatusBadge status={personnel.status} pulse={personnel.status === 'active'} />
            {changed && (
              <p className="font-mono text-[9px] text-accent animate-blink tracking-widest">{t('live_update')}</p>
            )}
          </div>

          {/* Fields */}
          <div className="flex-1 space-y-4">
            <div>
              <p className="font-mono text-[9px] text-text-muted tracking-widest mb-0.5">CODENAME</p>
              <p className="font-sans text-3xl font-bold text-text tracking-widest animate-reveal">{personnel.codename}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <DataField label="FULL NAME"           value={personnel.full_name} />
              <DataField label="BUREAU ID"           value={personnel.id} accent />
              <DataField label="ROLE"                value={personnel.role} />
              <DataField label={t('squad_section')}  value={squad?.name ?? t('unassigned')} />
            </div>
            {isOwn && (
              <div className="pt-2 border-t border-border/40">
                <p className="font-mono text-[9px] text-accent/60">{t('own_file_note1')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status history / log panel */}
        <div className="mcb-panel p-5">
          <p className="mcb-section-header">{t('status_log')}</p>
          <div className="space-y-2">
            <LogEntry
              time={formatTimestamp(personnel.created_at)}
              event={t('record_created')}
              type="info"
            />
            <LogEntry
              time={formatTimestamp(personnel.created_at)}
              event={`${t('status_assigned')} ${personnel.status.toUpperCase()}`}
              type={personnel.status === 'active' ? 'success' : 'warning'}
            />
            {personnel.status !== 'active' && (
              <LogEntry
                time="[CLASSIFIED]"
                event={`${t('status_changed')} ${personnel.status.toUpperCase()} ${t('details_redacted')}`}
                type="warning"
              />
            )}
          </div>
        </div>

        {/* Squad panel */}
        {squad && (
          <div className="mcb-panel p-5">
            <p className="mcb-section-header">{t('squad_section')} — {squad.name}</p>
            <p className="font-mono text-xs text-text-dim mb-4">{squad.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(squad.personnel ?? []).map(member => (
                <SquadMember key={member.id} member={member} currentId={id} />
              ))}
            </div>
          </div>
        )}

        {isOwn && application && (
          <div className="mcb-panel p-5 space-y-4">
            <p className="mcb-section-header">{t('application_record')}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <DataField label={t('label_role_applied')} value={application.role_applied} />
              <DataField label={t('label_app_status')} value={application.status.toUpperCase()} accent />
            </div>
            <InfoBlock label={t('label_bg_story')} value={application.background_story} />
            <InfoBlock label={t('label_app_skills')} value={application.skills} />
            <InfoBlock label={t('label_app_notes')} value={application.notes || '—'} />
            <RecordImage src={application.image_url} alt={`${application.codename} application evidence`} emptyLabel="No application image uploaded" />
          </div>
        )}

        {isOwn && (
          <div className="border border-accent/20 bg-accent/5 p-3 font-mono text-[10px] text-text-muted">
            <p>{t('own_file_note1')}</p>
            <p>{t('own_file_note2')}</p>
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/60 p-3 space-y-1">
      <p className="font-mono text-[10px] text-text-muted tracking-widest uppercase">{label}</p>
      <p className="font-mono text-[11px] text-text-dim whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
