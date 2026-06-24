/**
 * lib/data.ts — MCB Data Layer
 * All Supabase queries with try/catch + typed returns.
 */
import { supabase, Application, Personnel, Squad, Task, TaskSubmission, TaskStatus, SubmissionStatus, TaskPriority, TaskType, TaskResult } from './supabase';
import { generateMCBId, generatePassword } from './utils';

type Result<T> = { data: T; error: null } | { data: null; error: string };

function normalizeTask(raw: any): Task {
  const submission = Array.isArray(raw?.submission) ? (raw.submission[0] ?? null) : (raw?.submission ?? null);
  return { ...raw, submission };
}

const IMAGE_ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const APPLICATION_BUCKET = 'applications';
const TASK_REPORT_BUCKET = 'task-reports';
const REPORT_MAX_MB = 8;

async function uploadPublicImage(bucket: string, path: string, file: File, maxMb = REPORT_MAX_MB): Promise<{ url: string | null; error: string | null }> {
  if (!IMAGE_ALLOWED.includes(file.type)) return { url: null, error: 'Invalid image type.' };
  if (file.size > maxMb * 1024 * 1024) return { url: null, error: `Image too large. Maximum ${maxMb}MB.` };

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

// ── APPLICATIONS ──────────────────────────────────────────────────────────────

export async function submitApplication(
  data: Omit<Application, 'id' | 'status' | 'created_at'>,
  imageFile?: File | null
): Promise<Result<Application>> {
  try {
    let imageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split('.').pop() ?? 'png';
      const safeCode = data.codename.toUpperCase().replace(/[^A-Z0-9_-]/g, '-');
      const uploaded = await uploadPublicImage(APPLICATION_BUCKET, `${safeCode}/application.${ext}`, imageFile, 8);
      if (uploaded.error) return { data: null, error: uploaded.error };
      imageUrl = uploaded.url;
    }

    const { data: r, error } = await supabase
      .from('applications')
      .insert({ ...data, image_url: imageUrl, status: 'pending', created_at: new Date().toISOString() })
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

export async function fetchApplicationById(id: string): Promise<Result<Application>> {
  try {
    const { data, error } = await supabase.from('applications').select('*').eq('id', id).single();
    if (error || !data) return { data: null, error: error?.message ?? 'Not found' };
    return { data: data as Application, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function fetchApplicationByCodename(codename: string): Promise<Result<Application>> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('codename', codename.toUpperCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: 'Not found' };
    return { data: data as Application, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
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

export async function clearSquadAssignment(personnelId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from('personnel').update({ squad_id: null }).eq('id', personnelId);
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

// ── TASKS ─────────────────────────────────────────────────────────────────────

export async function fetchTasksForPersonnel(personnelId: string): Promise<{ data: Task[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, submission:task_submissions(*)')
      .eq('assigned_to', personnelId)
      .order('created_at', { ascending: false });
    return { data: (data ?? []).map(normalizeTask), error: error?.message ?? null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function fetchTaskById(taskId: string): Promise<{ data: Task | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, personnel(*), submission:task_submissions(*)')
      .eq('id', taskId)
      .single();
    return { data: data ? normalizeTask(data) : null, error: error?.message ?? null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function fetchAllTasks(status?: 'active' | 'submitted' | 'completed'): Promise<{ data: Task[]; error: string | null }> {
  try {
    let q = supabase
      .from('tasks')
      .select('*, personnel(*), submission:task_submissions(*)')
      .order('created_at', { ascending: false });
    if (status === 'active') q = q.in('status', ['pending', 'in_progress']);
    if (status === 'submitted') q = q.eq('status', 'submitted');
    if (status === 'completed') q = q.in('status', ['accepted', 'rejected']);
    const { data, error } = await q;
    return { data: (data ?? []).map(normalizeTask), error: error?.message ?? null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function createTask(input: {
  title: string;
  type: TaskType;
  description: string;
  objective: string;
  assigned_to: string;
  priority: TaskPriority;
  assigned_by?: string;
  deadline?: string | null;
}): Promise<Result<Task>> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...input,
        status: 'pending',
        deadline: input.deadline || null,
        assigned_by: input.assigned_by ?? 'BUREAU ADMIN',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as Task, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);
    return { error: error?.message ?? null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

async function uploadTaskEvidence(taskId: string, personnelId: string, file: File): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${personnelId}/${taskId}-${Date.now()}.${ext}`;
  return uploadPublicImage(TASK_REPORT_BUCKET, path, file, REPORT_MAX_MB);
}

export async function submitTaskReport(input: {
  taskId: string;
  personnelId: string;
  reportTitle: string;
  findings: string;
  actionsTaken: string;
  result: TaskResult;
  notes?: string;
  imageFile?: File | null;
}): Promise<{ data: TaskSubmission | null; error: string | null }> {
  try {
    let imageUrl: string | null = null;
    if (input.imageFile) {
      const uploaded = await uploadTaskEvidence(input.taskId, input.personnelId, input.imageFile);
      if (uploaded.error) return { data: null, error: uploaded.error };
      imageUrl = uploaded.url;
    }

    const payload = {
      task_id: input.taskId,
      personnel_id: input.personnelId,
      report_title: input.reportTitle,
      findings: input.findings,
      actions_taken: input.actionsTaken,
      result: input.result,
      notes: input.notes || null,
      image_url: imageUrl,
      status: 'submitted' as SubmissionStatus,
      created_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('task_submissions')
      .select('id')
      .eq('task_id', input.taskId)
      .eq('personnel_id', input.personnelId)
      .maybeSingle();

    let submission: TaskSubmission | null = null;
    if (existing?.id) {
      const { data, error } = await supabase
        .from('task_submissions')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) return { data: null, error: error.message };
      submission = data as TaskSubmission;
    } else {
      const { data, error } = await supabase
        .from('task_submissions')
        .insert(payload)
        .select()
        .single();
      if (error) return { data: null, error: error.message };
      submission = data as TaskSubmission;
    }

    const { error: taskError } = await supabase.from('tasks').update({ status: 'submitted' }).eq('id', input.taskId);
    if (taskError) return { data: null, error: taskError.message };

    return { data: submission, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function reviewTaskSubmission(input: {
  taskId: string;
  submissionId: string;
  status: SubmissionStatus;
  feedback?: string;
}): Promise<{ error: string | null }> {
  try {
    const { error: subError } = await supabase
      .from('task_submissions')
      .update({ status: input.status, admin_feedback: input.feedback ?? null })
      .eq('id', input.submissionId);
    if (subError) return { error: subError.message };

    const nextTaskStatus: TaskStatus = input.status === 'accepted' ? 'accepted' : 'rejected';
    const { error: taskError } = await supabase
      .from('tasks')
      .update({ status: nextTaskStatus })
      .eq('id', input.taskId);

    return { error: taskError?.message ?? null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
