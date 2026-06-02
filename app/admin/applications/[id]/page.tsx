'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import RecordImage from '@/components/RecordImage';
import { AppStatusBadge } from '@/components/StatusBadge';
import { acceptApplication, fetchApplicationById, fetchSquads, rejectApplication } from '@/lib/data';
import { Application, Squad } from '@/lib/supabase';
import { clearAdminAuth, formatTimestamp, getAdminAuth, saveAdminAuth } from '@/lib/utils';

const ADMIN_PASSWORD = '44475';

export default function AdminApplicationDetailPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);

  useEffect(() => { setAuthed(getAdminAuth()); }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      saveAdminAuth();
      setAuthed(true);
      return;
    }
    setPwError(true);
    setPwInput('');
    setTimeout(() => setPwError(false), 2000);
  }

  if (authed === null) return null;
  if (!authed) return <Gate pwInput={pwInput} setPwInput={setPwInput} pwError={pwError} onSubmit={handleLogin} />;

  return <ApplicationFileView onLogout={() => { clearAdminAuth(); setAuthed(false); }} />;
}

function ApplicationFileView({ onLogout }: { onLogout: () => void }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [squadId, setSquadId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ username: string; password: string; mcbId: string } | null>(null);

  useEffect(() => {
    async function load() {
      const [appRes, squadRes] = await Promise.all([fetchApplicationById(id), fetchSquads()]);
      setApplication(appRes.data);
      setSquads(squadRes.data);
      setLoading(false);
    }
    load();
  }, [id]);

  async function doAccept() {
    if (!application) return;
    setBusy(true);
    const { data, credentials: creds, error } = await acceptApplication(application, squadId || undefined);
    if (error || !creds || !data) setNotice(`Error: ${error}`);
    else {
      setApplication(prev => prev ? { ...prev, status: 'accepted' } : prev);
      setCredentials({ username: creds.username, password: creds.password, mcbId: data.id });
      setNotice('APPLICATION ACCEPTED');
    }
    setBusy(false);
  }

  async function doReject() {
    if (!application) return;
    setBusy(true);
    const { error } = await rejectApplication(application.id);
    if (error) setNotice(`Error: ${error}`);
    else {
      setApplication(prev => prev ? { ...prev, status: 'rejected' } : prev);
      setNotice('APPLICATION REJECTED');
    }
    setBusy(false);
  }

  return (
    <Layout title="APPLICATION FILE" subtitle="CLASSIFIED REVIEW DOSSIER" classified maxWidth="2xl">
      <div className="flex items-center justify-between border border-red-500/20 bg-red-500/5 px-4 py-2 my-4">
        <span className="font-mono text-[10px] text-red-400/70">⚠ PERSONNEL FILE REVIEW</span>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin-secret')} className="font-mono text-[10px] text-accent hover:text-text">[BACK]</button>
          <button onClick={onLogout} className="font-mono text-[10px] text-text-muted hover:text-red-400">[LOGOUT]</button>
        </div>
      </div>

      {notice && <div className="panel border-accent/40 px-4 py-2 font-mono text-xs text-accent mb-4">{notice}</div>}

      {loading || !application ? (
        <p className="font-mono text-xs text-text-muted py-12 text-center animate-blink">Loading application file...</p>
      ) : (
        <div className="space-y-5">
          <div className="mcb-panel p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-sans text-2xl font-bold text-text tracking-[0.18em] uppercase">{application.codename}</p>
              <p className="font-mono text-[10px] text-text-muted tracking-widest">{formatTimestamp(application.created_at)}</p>
            </div>
            <AppStatusBadge status={application.status} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="PERSONAL DATA">
              <GridField label="FULL NAME" value={application.full_name} />
              <GridField label="AGE" value={String(application.age)} />
              <GridField label="NATIONALITY" value={application.nationality} />
              <GridField label="ROLE APPLIED" value={application.role_applied} />
            </Section>

            <Section title="BACKGROUND">
              <InfoBlock label="BACKGROUND STORY" value={application.background_story} />
              <InfoBlock label="SKILLS" value={application.skills} />
            </Section>
          </div>

          <Section title="NOTES">
            <InfoBlock label="ADDITIONAL NOTES" value={application.notes || '—'} />
          </Section>

          <Section title="UPLOADED IMAGE">
            <RecordImage src={application.image_url} alt={`${application.codename} application evidence`} emptyLabel="No application image uploaded" />
          </Section>

          {application.status === 'pending' && (
            <Section title="REVIEW ACTIONS">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-text-muted tracking-widest uppercase">Assign Squad On Acceptance</label>
                  <select className="mcb-input" value={squadId} onChange={e => setSquadId(e.target.value)}>
                    <option value="">UNASSIGNED</option>
                    {squads.map(sq => <option key={sq.id} value={sq.id}>{sq.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 items-end">
                  <button onClick={doAccept} disabled={busy} className="mcb-btn-success">{busy ? 'PROCESSING...' : 'ACCEPT'}</button>
                  <button onClick={doReject} disabled={busy} className="mcb-btn-danger">REJECT</button>
                </div>
              </div>
            </Section>
          )}

          {credentials && (
            <Section title="ISSUED CREDENTIALS">
              <InfoBlock label="BUREAU ID" value={credentials.mcbId} />
              <InfoBlock label="USERNAME" value={credentials.username} />
              <InfoBlock label="ACCESS KEY" value={credentials.password} />
            </Section>
          )}
        </div>
      )}
    </Layout>
  );
}

function Gate({ pwInput, setPwInput, pwError, onSubmit }: { pwInput: string; setPwInput: (value: string) => void; pwError: boolean; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center px-4">
      <div className="w-full max-w-xs panel p-6 space-y-4">
        <p className="mcb-section-header">APPLICATION FILE ACCESS</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <input type="password" className={`mcb-input ${pwError ? 'border-red-500' : ''}`} value={pwInput} onChange={e => setPwInput(e.target.value)} />
          {pwError && <p className="font-mono text-[10px] text-red-400">✗ AUTHORIZATION DENIED</p>}
          <button type="submit" className="mcb-btn-primary w-full">▶ AUTHORIZE</button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mcb-panel p-5 space-y-4">
      <p className="mcb-section-header">{title}</p>
      {children}
    </div>
  );
}

function GridField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="font-mono text-[10px] text-text-muted tracking-widest uppercase">{label}</p>
      <p className="font-mono text-xs text-text">{value}</p>
    </div>
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
