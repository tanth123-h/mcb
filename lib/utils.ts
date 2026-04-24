import { supabase, Personnel, TaskStatus, TaskPriority, TaskType, SubmissionStatus } from './supabase';

export async function generateMCBId(): Promise<string> {
  const { data, error } = await supabase.rpc('next_mcb_id');
  if (error || !data) {
    const { count } = await supabase.from('personnel').select('*', { count: 'exact', head: true });
    return `MCB-${String((count ?? 0) + 1).padStart(4, '0')}`;
  }
  return data;
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generatePassword(length = 10): string {
  return Array.from({ length }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

const SESSION_KEY = 'mcb_session';
const ADMIN_KEY   = 'mcb_admin_auth';
export interface MCBSession { id: string; codename: string; role: string; }

export function saveSession(p: Personnel): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id: p.id, codename: p.codename, role: p.role }));
}
export function getSession(): MCBSession | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? ''); } catch { return null; }
}
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}
export function saveAdminAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_KEY, '1');
}
export function getAdminAuth(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ADMIN_KEY) === '1';
}
export function clearAdminAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_KEY);
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}
export function parseSkills(skills: string): string[] {
  return skills.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
}
const LOGS = ['Initializing secure channel...','Encrypting data stream...','Handshake complete.','Verifying personnel signatures...','Loading classified records...','Decrypting personnel file...','Cross-referencing anomaly index...','Establishing bureau connection...','Integrity check: PASSED','Clearance level confirmed.'];
export function randomLog() { return LOGS[Math.floor(Math.random() * LOGS.length)]; }
export function generateBootLogs(n = 6) { return [...LOGS].sort(() => Math.random() - .5).slice(0, n); }

export function getStatusColors(status: Personnel['status']) {
  const m: Record<string, any> = {
    active:      { text:'text-green-400',  bg:'bg-green-400/10',  dot:'bg-green-400',  glow:'shadow-[0_0_8px_rgba(74,222,128,0.5)]' },
    injured:     { text:'text-yellow-400', bg:'bg-yellow-400/10', dot:'bg-yellow-400', glow:'shadow-[0_0_8px_rgba(251,191,36,0.5)]' },
    deceased:    { text:'text-red-400',    bg:'bg-red-400/10',    dot:'bg-red-400',    glow:'shadow-[0_0_8px_rgba(248,113,113,0.5)]' },
    missing:     { text:'text-slate-400',  bg:'bg-slate-400/10',  dot:'bg-slate-400',  glow:'' },
    observation: { text:'text-purple-400', bg:'bg-purple-400/10', dot:'bg-purple-400', glow:'shadow-[0_0_8px_rgba(167,139,250,0.5)]' },
  };
  return m[status] ?? m.active;
}
export function getAppStatusColors(status: 'pending'|'accepted'|'rejected') {
  return { pending:{text:'text-yellow-400',bg:'bg-yellow-400/10'}, accepted:{text:'text-green-400',bg:'bg-green-400/10'}, rejected:{text:'text-red-400',bg:'bg-red-400/10'} }[status];
}
export function getTaskStatusColors(status: TaskStatus | SubmissionStatus) {
  return {
    pending:     { text:'text-yellow-400', bg:'bg-yellow-400/10' },
    in_progress: { text:'text-blue-400',   bg:'bg-blue-400/10' },
    submitted:   { text:'text-accent',     bg:'bg-accent/10' },
    accepted:    { text:'text-green-400',  bg:'bg-green-400/10' },
    rejected:    { text:'text-red-400',    bg:'bg-red-400/10' },
  }[status];
}
export function getTaskPriorityColors(priority: TaskPriority) {
  return {
    low:    { text:'text-text-muted', bg:'bg-border/20' },
    medium: { text:'text-yellow-400', bg:'bg-yellow-400/10' },
    high:   { text:'text-red-400', bg:'bg-red-400/10' },
  }[priority];
}
export function getTaskTypeLabel(type: TaskType) {
  return type === 'research' ? 'RESEARCH' : 'MISSION';
}
