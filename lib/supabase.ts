/**
 * lib/supabase.ts — MCB Supabase client
 * Validated env vars + typed interfaces.
 */
import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error(
    '[MCB] Missing Supabase env vars.\n' +
    'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
  );
}

export const supabase = createClient(url ?? '', anon ?? '');

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';
export type PersonnelStatus   = 'active' | 'injured' | 'deceased' | 'missing' | 'observation';
export type TaskType          = 'research' | 'mission';
export type TaskPriority      = 'low' | 'medium' | 'high';
export type TaskStatus        = 'pending' | 'in_progress' | 'submitted' | 'accepted' | 'rejected';
export type TaskResult        = 'success' | 'failure' | 'inconclusive';
export type SubmissionStatus  = 'submitted' | 'accepted' | 'rejected';

export interface Application {
  id: string; full_name: string; codename: string; age: number;
  nationality: string; role_applied: string; background_story: string;
  skills: string; notes?: string; status: ApplicationStatus; created_at: string;
}
export interface Personnel {
  id: string; full_name: string; codename: string; password: string;
  role: string; status: PersonnelStatus; squad_id?: string;
  avatar_url?: string; created_at: string; squads?: Squad;
}
export interface Squad {
  id: string; name: string; description: string; created_at: string; personnel?: Personnel[];
}
export interface Task {
  id: string;
  title: string;
  type: TaskType;
  description: string;
  objective: string;
  assigned_to: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_by?: string;
  deadline?: string | null;
  created_at: string;
  personnel?: Personnel;
  submission?: TaskSubmission | null;
}
export interface TaskSubmission {
  id: string;
  task_id: string;
  personnel_id: string;
  report_title: string;
  findings: string;
  actions_taken: string;
  result: TaskResult;
  notes?: string | null;
  image_url?: string | null;
  status: SubmissionStatus;
  admin_feedback?: string | null;
  created_at: string;
}
