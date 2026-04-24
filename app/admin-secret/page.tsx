/**
 * app/admin-secret/page.tsx — Admin panel with password gate + credential modal
 */
'use client';
import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { AppStatusBadge, PersonnelStatusBadge } from '@/components/StatusBadge';
import {
  fetchApplications, acceptApplication, rejectApplication,
  fetchAllPersonnel, fetchSquads, createSquad, updatePersonnelStatus, assignSquad, clearSquadAssignment,
} from '@/lib/data';
import { formatTimestamp, saveAdminAuth, getAdminAuth, clearAdminAuth } from '@/lib/utils';
import { Application, Personnel, Squad } from '@/lib/supabase';

const ADMIN_PASSWORD = '44475';
interface Credentials { username: string; password: string; mcbId: string; }

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);
  const [modal, setModal] = useState<Credentials | null>(null);

  useEffect(() => { setAuthed(getAdminAuth()); }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) { saveAdminAuth(); setAuthed(true); }
    else { setPwError(true); setPwInput(''); setTimeout(() => setPwError(false), 2000); }
  }

  if (authed === null) return null;
  if (!authed) return <AdminGate pwInput={pwInput} setPwInput={setPwInput} pwError={pwError} onSubmit={handleLogin} />;

  return (
    <>
      {modal && <CredentialModal creds={modal} onClose={() => setModal(null)} />}
      <AdminDashboard onCredentials={setModal} onLogout={() => { clearAdminAuth(); setAuthed(false); }} />
    </>
  );
}

// ── Password Gate ─────────────────────────────────────────────────────────────
function AdminGate({ pwInput, setPwInput, pwError, onSubmit }: { pwInput:string; setPwInput:(v:string)=>void; pwError:boolean; onSubmit:(e:React.FormEvent)=>void; }) {
  return (
    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center px-4">
      <div className="w-full max-w-xs space-y-6">
        <div className="text-center space-y-3">
          <div className={`w-16 h-16 border rounded-sm flex items-center justify-center mx-auto transition-colors ${pwError ? 'border-red-500' : 'border-accent/40 animate-pulse-glow'}`}>
            <span className={`text-2xl ${pwError ? 'text-red-400' : 'text-accent'}`}>{pwError ? '✗' : '⚿'}</span>
          </div>
          <p className="font-mono text-[10px] text-text-muted tracking-[0.4em] uppercase">Administrative Access</p>
          <span className="classified-stamp">RESTRICTED</span>
        </div>
        <div className="panel p-6">
          <p className="mcb-section-header mb-4">AUTHORIZATION REQUIRED</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-text-muted tracking-widest uppercase">Admin Passcode</label>
              <input type="password" className={`mcb-input ${pwError ? 'border-red-500' : ''}`} placeholder="Enter authorization code"
                value={pwInput} onChange={e => setPwInput(e.target.value)} autoFocus />
              {pwError && <p className="font-mono text-[10px] text-red-400">✗ AUTHORIZATION DENIED</p>}
            </div>
            <button type="submit" className="mcb-btn-primary w-full tracking-[0.25em]">▶ AUTHORIZE</button>
          </form>
        </div>
        <p className="font-mono text-[9px] text-text-muted text-center">Clearance Level: DELTA required. All attempts logged.</p>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
type AdminTab = 'applications' | 'personnel' | 'squads';
type AppFilter = 'all' | 'pending' | 'accepted' | 'rejected';

function AdminDashboard({ onCredentials, onLogout }: { onCredentials:(c:Credentials)=>void; onLogout:()=>void; }) {
  const [tab, setTab] = useState<AdminTab>('applications');
  const [filter, setFilter] = useState<AppFilter>('pending');
  const [apps, setApps] = useState<Application[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string|null>(null);
  const [toast, setToast] = useState<string|null>(null);
  const [newSqName, setNewSqName] = useState('');
  const [newSqDesc, setNewSqDesc] = useState('');

  const toast_ = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const load = useCallback(async () => {
    setLoading(true);
    const [a,p,s] = await Promise.all([fetchApplications(), fetchAllPersonnel(), fetchSquads()]);
    setApps(a.data); setPersonnel(p.data); setSquads(s.data); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function doAccept(app: Application) {
    setBusy(app.id);
    const { data, credentials, error } = await acceptApplication(app);
    if (error || !credentials) { toast_(`Error: ${error}`); }
    else { onCredentials({ username: credentials.username, password: credentials.password, mcbId: data!.id }); toast_(`✓ ${app.codename} accepted`); }
    await load(); setBusy(null);
  }
  async function doReject(app: Application) {
    setBusy(app.id); await rejectApplication(app.id); toast_(`✗ ${app.codename} rejected`); await load(); setBusy(null);
  }
  async function doStatusChange(p: Personnel, s: Personnel['status']) {
    setBusy(p.id); await updatePersonnelStatus(p.id, s); toast_(`${p.codename} → ${s.toUpperCase()}`); await load(); setBusy(null);
  }
  async function doCreateSquad(e: React.FormEvent) {
    e.preventDefault(); if (!newSqName.trim()) return;
    await createSquad(newSqName, newSqDesc); toast_(`Squad created.`); setNewSqName(''); setNewSqDesc(''); await load();
  }
  async function doSquadAssign(personnelId: string, squadId: string) {
    setBusy(personnelId);
    const result = squadId ? await assignSquad(personnelId, squadId) : await clearSquadAssignment(personnelId);
    if (result.error) toast_(`Error: ${result.error}`);
    else toast_('Assignment updated.');
    await load();
    setBusy(null);
  }

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter);
  const pending  = apps.filter(a => a.status === 'pending').length;

  return (
    <Layout title="ADMIN PANEL" subtitle="// BUREAU OVERSIGHT" classified maxWidth="2xl">
      {toast && <div className="fixed top-12 right-4 z-50 panel border-accent/40 px-4 py-2 font-mono text-xs text-accent animate-slideUp">{toast}</div>}

      <div className="flex items-center justify-between border border-red-500/20 bg-red-500/5 px-4 py-2 my-4">
        <span className="font-mono text-[10px] text-red-400/70">⚠ ADMIN SESSION ACTIVE — CLEARANCE: DELTA</span>
        <div className="flex items-center gap-3">
          <a href="/admin/tasks" className="font-mono text-[10px] text-accent hover:text-text transition-colors">[TASK OPS]</a>
          <button onClick={onLogout} className="font-mono text-[10px] text-text-muted hover:text-red-400 transition-colors">[LOGOUT]</button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border mb-6">
        {(['applications','personnel','squads'] as AdminTab[]).map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`font-mono text-[11px] tracking-widest uppercase px-4 py-2 border-b-2 transition-colors ${tab===t?'border-accent text-accent':'border-transparent text-text-muted hover:text-text'}`}>
            {t}{t==='applications'&&pending>0&&<span className="ml-1.5 bg-yellow-400/20 text-yellow-400 px-1.5 py-0.5 text-[9px]">{pending}</span>}
          </button>
        ))}
        <button onClick={load} className="ml-auto font-mono text-[10px] text-text-muted hover:text-accent px-3 py-2">↺</button>
      </div>

      {loading ? <p className="text-center font-mono text-xs text-text-muted py-12 animate-blink">Loading...</p> : (
        <>
          {tab === 'applications' && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {(['pending','all','accepted','rejected'] as AppFilter[]).map(f => (
                  <button key={f} onClick={()=>setFilter(f)} className={`mcb-btn text-[10px] py-1 px-3 ${filter===f?'mcb-btn-primary':'mcb-btn-ghost'}`}>{f.toUpperCase()}</button>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="mcb-table">
                  <thead><tr><th>CODENAME</th><th>NAME</th><th>ROLE</th><th>STATUS</th><th>DATE</th><th>ACTIONS</th></tr></thead>
                  <tbody>
                    {filtered.map(app => (
                      <tr key={app.id}>
                        <td className="text-accent font-medium">{app.codename}</td>
                        <td>{app.full_name}</td>
                        <td className="text-text-dim">{app.role_applied}</td>
                        <td><AppStatusBadge status={app.status} /></td>
                        <td className="text-text-muted text-[10px]">{formatTimestamp(app.created_at)}</td>
                        <td>
                          {app.status === 'pending' && (
                            <div className="flex gap-2">
                              <button onClick={()=>doAccept(app)} disabled={!!busy} className="mcb-btn-success text-[9px] py-1 px-2">{busy===app.id?'...':'ACCEPT'}</button>
                              <button onClick={()=>doReject(app)} disabled={!!busy} className="mcb-btn-danger text-[9px] py-1 px-2">REJECT</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filtered.length===0 && <tr><td colSpan={6} className="text-center text-text-muted py-8 font-mono text-xs">No {filter!=='all'?filter:''} applications.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'personnel' && (
            <div className="overflow-x-auto">
              <table className="mcb-table">
                <thead><tr><th>ID</th><th>CODENAME</th><th>NAME</th><th>ROLE</th><th>STATUS</th><th>SQUAD</th><th>CHANGE</th></tr></thead>
                <tbody>
                  {personnel.map(p => (
                    <tr key={p.id}>
                      <td><a href={`/profile/${p.id}`} className="text-accent hover:underline">{p.id}</a></td>
                      <td className="font-medium">{p.codename}</td>
                      <td className="text-text-dim">{p.full_name}</td>
                      <td className="text-text-dim">{p.role}</td>
                      <td><PersonnelStatusBadge status={p.status} /></td>
                      <td>
                        <select
                          className="bg-surface border border-border text-text font-mono text-[10px] px-2 py-1 focus:outline-none focus:border-accent/60 disabled:opacity-40"
                          value={p.squad_id ?? ''}
                          disabled={!!busy}
                          onChange={e=>doSquadAssign(p.id, e.target.value)}
                        >
                          <option value="">UNASSIGNED</option>
                          {squads.map(sq => <option key={sq.id} value={sq.id}>{sq.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className="bg-surface border border-border text-text font-mono text-[10px] px-2 py-1 focus:outline-none focus:border-accent/60 disabled:opacity-40"
                          value={p.status} disabled={!!busy} onChange={e=>doStatusChange(p, e.target.value as Personnel['status'])}>
                          {['active','injured','deceased','missing','observation'].map(s=><option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'squads' && (
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="mcb-section-header">ACTIVE SQUADS</p>
                {squads.map(sq => {
                  const members = personnel.filter(p => p.squad_id === sq.id);
                  return (
                    <div key={sq.id} className="panel p-4 space-y-2">
                      <div className="flex justify-between"><p className="font-mono text-xs font-bold tracking-widest">{sq.name}</p><span className="font-mono text-[10px] text-text-muted">{members.length} members</span></div>
                      <p className="font-mono text-[11px] text-text-dim">{sq.description}</p>
                      <div className="flex flex-wrap gap-1">{members.map(m=><span key={m.id} className="font-mono text-[9px] bg-accent/10 text-accent px-1.5 py-0.5">{m.codename}</span>)}</div>
                    </div>
                  );
                })}
              </div>
              <div>
                <p className="mcb-section-header">CREATE SQUAD</p>
                <form onSubmit={doCreateSquad} className="panel p-4 space-y-3">
                  <div className="space-y-1"><label className="font-mono text-[10px] text-text-muted tracking-widest">SQUAD NAME</label><input className="mcb-input uppercase" value={newSqName} onChange={e=>setNewSqName(e.target.value)} /></div>
                  <div className="space-y-1"><label className="font-mono text-[10px] text-text-muted tracking-widest">DESCRIPTION</label><textarea className="mcb-input resize-none" rows={3} value={newSqDesc} onChange={e=>setNewSqDesc(e.target.value)} /></div>
                  <button type="submit" className="mcb-btn-primary w-full">▶ CREATE SQUAD</button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

// ── Credential Modal ──────────────────────────────────────────────────────────
function CredentialModal({ creds, onClose }: { creds: Credentials; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  function copyAll() {
    navigator.clipboard.writeText(`MCB PERSONNEL CREDENTIALS\nUsername: ${creds.username}\nAccess Key: ${creds.password}\nBureau ID: ${creds.mcbId}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
      <div className="w-full max-w-sm panel border-accent/40 animate-slideUp">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="font-mono text-xs text-green-400 tracking-widest">CREDENTIALS GENERATED</span>
          </div>
          <button onClick={onClose} className="font-mono text-xs text-text-muted hover:text-text">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <p className="font-mono text-[11px] text-text-dim">
            Send these credentials to the personnel. <span className="text-red-400">This is the only time the access key is shown in full.</span>
          </p>
          {[['BUREAU ID', creds.mcbId, false], ['USERNAME', creds.username, false], ['ACCESS KEY', creds.password, true]].map(([l,v,h]) => (
            <CredField key={String(l)} label={String(l)} value={String(v)} highlight={Boolean(h)} />
          ))}
          <div className="border border-yellow-400/20 bg-yellow-400/5 p-3 font-mono text-[10px] text-yellow-400/80">
            ⚠ After closing, this key cannot be recovered without direct database access.
          </div>
          <div className="flex gap-3">
            <button onClick={copyAll} className={`mcb-btn flex-1 ${copied?'mcb-btn-success':'mcb-btn-primary'}`}>{copied?'✓ COPIED':'⧉ COPY ALL'}</button>
            <button onClick={onClose} className="mcb-btn-ghost flex-1">CLOSE</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CredField({ label, value, highlight }: { label:string; value:string; highlight?:boolean }) {
  const [c, setC] = useState(false);
  return (
    <div className="space-y-1">
      <p className="font-mono text-[9px] text-text-muted tracking-widest uppercase">{label}</p>
      <div className={`flex items-center gap-2 border p-2 ${highlight?'border-accent/40 bg-accent/5':'border-border bg-bg/30'}`}>
        <span className={`font-mono text-sm flex-1 tracking-wider ${highlight?'text-accent':'text-text'}`}>{value}</span>
        <button onClick={()=>{navigator.clipboard.writeText(value).then(()=>{setC(true);setTimeout(()=>setC(false),1500)});}} className={`font-mono text-[9px] tracking-widest ${c?'text-green-400':'text-text-muted hover:text-accent'}`}>{c?'COPIED':'COPY'}</button>
      </div>
    </div>
  );
}
