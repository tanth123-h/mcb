/**
 * lib/data.ts — MCB Data Layer
 * All Supabase queries with try/catch + typed returns.
 */
import { supabase, Application, Personnel, Squad } from './supabase';
import { generateMCBId, generatePassword } from './utils';

type Result<T> = { data: T; error: null } | { data: null; error: string };

// ── APPLICATIONS ──────────────────────────────────────────────────────────────

export async function submitApplication(
  data: Omit<Application, 'id' | 'status' | 'created_at'>
): Promise<Result<Application>> {
  try {
    const { data: r, error } = await supabase
      .from('applications')
      .insert({ ...data, status: 'pending', created_at: new Date().toISOString() })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data: r as Application, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function fetchApplications(
  status?: Application['status']
): Promise<{ data: Application[]; error: string | null }> {
  try {
    let q = supabase.from('applications').select('*').order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as Application[], error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function acceptApplication(
  app: Application,
  squadId?: string
): Promise<{ data: Personnel | null; credentials: { username: string; password: string } | null; error: string | null }> {
  try {
    const mcbId    = await generateMCBId();
    const password = generatePassword(10);
    const { data: p, error: pErr } = await supabase
      .from('personnel')
      .insert({
        id: mcbId, full_name: app.full_name, codename: app.codename,
        password, role: app.role_applied, status: 'active',
        squad_id: squadId ?? null, created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (pErr) return { data: null, credentials: null, error: pErr.message };
    await supabase.from('applications').update({ status: 'accepted' }).eq('id', app.id);
    return { data: p as Personnel, credentials: { username: app.codename, password }, error: null };
  } catch (e) {
    return { data: null, credentials: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function rejectApplication(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from('applications').update({ status: 'rejected' }).eq('id', id);
    return { error: error?.message ?? null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

// ── PERSONNEL ─────────────────────────────────────────────────────────────────

export async function fetchPersonnelById(id: string): Promise<Result<Personnel>> {
  try {
    const { data, error } = await supabase
      .from('personnel').select('*, squads(*)').eq('id', id).single();
    if (error || !data) return { data: null, error: error?.message ?? 'Not found' };
    return { data: data as Personnel, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function lookupPersonnelByCredentials(
  codename: string,
  password: string
): Promise<Result<Personnel>> {
  try {
    const { data, error } = await supabase
      .from('personnel')
      .select('*, squads(*)')
      .eq('codename', codename.toUpperCase())
      .eq('password', password)
      .single();
    if (error || !data) return { data: null, error: 'Record not found in MCB database.' };
    return { data: data as Personnel, error: null };
  } catch (e) {
    return { data: null, error: 'Connection failed. Try again.' };
  }
}

export async function fetchAllPersonnel(): Promise<{ data: Personnel[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('personnel').select('*, squads(*)').order('created_at', { ascending: false });
    return { data: (data ?? []) as Personnel[], error: error?.message ?? null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updatePersonnelStatus(
  id: string,
  status: Personnel['status']
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from('personnel').update({ status }).eq('id', id);
    return { error: error?.message ?? null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function assignSquad(personnelId: string, squadId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from('personnel').update({ squad_id: squadId }).eq('id', personnelId);
    return { error: error?.message ?? null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

// ── SQUADS ────────────────────────────────────────────────────────────────────

export async function fetchSquads(): Promise<{ data: Squad[]; error: string | null }> {
  try {
    const { data, error } = await supabase.from('squads').select('*').order('name');
    return { data: (data ?? []) as Squad[], error: error?.message ?? null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function fetchSquadWithMembers(
  id: string
): Promise<{ data: (Squad & { personnel: Personnel[] }) | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('squads').select('*, personnel(*)').eq('id', id).single();
    if (error || !data) return { data: null, error: error?.message ?? 'Not found' };
    return { data: data as Squad & { personnel: Personnel[] }, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function createSquad(
  name: string,
  description: string
): Promise<Result<Squad>> {
  try {
    const { data, error } = await supabase
      .from('squads').insert({ name: name.toUpperCase(), description }).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as Squad, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
