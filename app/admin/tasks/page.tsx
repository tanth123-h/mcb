'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { TaskPriorityBadge, TaskStatusBadge, TaskTypeBadge } from '@/components/StatusBadge';
import { createTask, fetchAllPersonnel, fetchAllTasks, reviewTaskSubmission } from '@/lib/data';
import { Personnel, Task, TaskPriority, TaskType } from '@/lib/supabase';
import { clearAdminAuth, formatTimestamp, getAdminAuth, saveAdminAuth } from '@/lib/utils';

const ADMIN_PASSWORD = '44475';
const TYPES: TaskType[] = ['research', 'mission'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

type TaskFilter = 'active' | 'submitted' | 'completed';

export default function AdminTasksPage() {
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
  if (!authed) return <AdminGate pwInput={pwInput} setPwInput={setPwInput} pwError={pwError} onSubmit={handleLogin} />;

  return <TaskOpsDashboard onLogout={() => { clearAdminAuth(); setAuthed(false); }} />;
}

function TaskOpsDashboard({ onLogout }: { onLogout: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('active');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('research');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deadline, setDeadline] = useState('');

  const reviewQueue = useMemo(() => tasks.filter(task => task.submission), [tasks]);

  const load = useCallback(async () => {
    setLoading(true);
    const [taskRes, personnelRes] = await Promise.all([fetchAllTasks(filter), fetchAllPersonnel()]);
    setTasks(taskRes.data);
    setPersonnel(personnelRes.data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createTask({
      title,
      type,
      description,
      objective,
      assigned_to: assignedTo,
      priority,
      deadline: deadline || null,
      assigned_by: 'BUREAU ADMIN',
    });
    if (error) {
      notify(`Error: ${error}`);
      return;
    }
    setTitle('');
    setDescription('');
    setObjective('');
    setAssignedTo('');
    setPriority('medium');
    setType('research');
    setDeadline('');
    notify('TASK ASSIGNED');
    load();
  }

  async function review(task: Task, status: 'accepted' | 'rejected', feedback: string) {
    if (!task.submission) return;
    setBusyId(task.id);
    const { error } = await reviewTaskSubmission({
      taskId: task.id,
      submissionId: task.submission.id,
      status,
      feedback,
    });
    if (error) notify(`Error: ${error}`);
    else notify(`REPORT ${status.toUpperCase()}`);
    await load();
    setBusyId(null);
  }

  return (
    <Layout title="TASK OPERATIONS" subtitle="ADMIN MISSION CONTROL" classified maxWidth="2xl">
      {toast && <div className="fixed top-12 right-4 z-50 panel border-accent/40 px-4 py-2 font-mono text-xs text-accent animate-slideUp">{toast}</div>}

      <div className="flex items-center justify-between border border-red-500/20 bg-red-500/5 px-4 py-2 my-4">
        <span className="font-mono text-[10px] text-red-400/70">⚠ TASK COMMAND ACTIVE — ASSIGNMENTS / REVIEWS / FIELD CONTROL</span>
        <div className="flex items-center gap-3">
          <a href="/admin-secret" className="font-mono text-[10px] text-accent hover:text-text transition-colors">[PERSONNEL ADMIN]</a>
          <button onClick={onLogout} className="font-mono text-[10px] text-text-muted hover:text-red-400 transition-colors">[LOGOUT]</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <form onSubmit={handleCreate} className="panel p-5 space-y-4">
          <p className="mcb-section-header">CREATE TASK</p>

          <Field label="Title"><input className="mcb-input" value={title} onChange={e => setTitle(e.target.value)} required /></Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <select className="mcb-input" value={type} onChange={e => setType(e.target.value as TaskType)}>
                {TYPES.map(item => <option key={item} value={item}>{item.toUpperCase()}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select className="mcb-input" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}>
                {PRIORITIES.map(item => <option key={item} value={item}>{item.toUpperCase()}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Description"><textarea className="mcb-input resize-none" rows={4} value={description} onChange={e => setDescription(e.target.value)} required /></Field>
          <Field label="Objective"><textarea className="mcb-input resize-none" rows={3} value={objective} onChange={e => setObjective(e.target.value)} required /></Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Assigned To">
              <select className="mcb-input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required>
                <option value="">SELECT PERSONNEL</option>
                {personnel.map(item => <option key={item.id} value={item.id}>{item.codename} // {item.id}</option>)}
              </select>
            </Field>
            <Field label="Deadline">
              <input type="datetime-local" className="mcb-input" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </Field>
          </div>

          <button type="submit" className="mcb-btn-primary w-full">▶ ASSIGN TASK</button>
        </form>

        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(['active', 'submitted', 'completed'] as TaskFilter[]).map(item => (
              <button key={item} onClick={() => setFilter(item)} className={`mcb-btn text-[10px] py-1 px-3 ${filter === item ? 'mcb-btn-primary' : 'mcb-btn-ghost'}`}>
                {item.toUpperCase()}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="font-mono text-xs text-text-muted py-10 text-center animate-blink">Loading task operations...</p>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => (
                <TaskAdminCard
                  key={task.id}
                  task={task}
                  busy={busyId === task.id}
                  onReview={review}
                />
              ))}
              {tasks.length === 0 && (
                <div className="panel p-8 text-center font-mono text-xs text-text-muted">No tasks in this queue.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 panel p-5 space-y-4">
        <p className="mcb-section-header">REVIEW SUBMISSIONS</p>
        {reviewQueue.length === 0 ? (
          <p className="font-mono text-[11px] text-text-muted">No submissions available for review in the current dataset.</p>
        ) : (
          reviewQueue.map(task => (
            <SubmissionReview key={task.id} task={task} busy={busyId === task.id} onReview={review} />
          ))
        )}
      </div>
    </Layout>
  );
}

function TaskAdminCard({
  task,
  busy,
  onReview,
}: {
  task: Task;
  busy: boolean;
  onReview: (task: Task, status: 'accepted' | 'rejected', feedback: string) => Promise<void>;
}) {
  const [feedback, setFeedback] = useState(task.submission?.admin_feedback ?? '');

  return (
    <div className="mcb-panel p-5 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <TaskTypeBadge type={task.type} />
            <TaskPriorityBadge priority={task.priority} />
            <TaskStatusBadge status={task.status} />
          </div>
          <div>
            <p className="font-sans text-lg font-bold text-text">{task.title}</p>
            <p className="font-mono text-[10px] text-text-muted tracking-widest">
              {task.personnel?.codename ?? task.assigned_to} // {formatTimestamp(task.created_at)}
            </p>
          </div>
        </div>
        <div className="font-mono text-[10px] text-text-muted text-left sm:text-right">
          <p>Assigned by: {task.assigned_by ?? 'BUREAU ADMIN'}</p>
          <p>Deadline: {task.deadline ? formatTimestamp(task.deadline) : 'OPEN'}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoBlock label="Description" value={task.description} />
        <InfoBlock label="Objective" value={task.objective} />
      </div>

      {task.submission && (
        <div className="space-y-3">
          <Field label="Admin Feedback">
            <textarea className="mcb-input resize-none" rows={3} value={feedback} onChange={e => setFeedback(e.target.value)} />
          </Field>
          <div className="flex gap-3">
            <button onClick={() => onReview(task, 'accepted', feedback)} disabled={busy} className="mcb-btn-success flex-1">{busy ? 'PROCESSING...' : 'ACCEPT REPORT'}</button>
            <button onClick={() => onReview(task, 'rejected', feedback)} disabled={busy} className="mcb-btn-danger flex-1">REJECT REPORT</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SubmissionReview({
  task,
  busy,
  onReview,
}: {
  task: Task;
  busy: boolean;
  onReview: (task: Task, status: 'accepted' | 'rejected', feedback: string) => Promise<void>;
}) {
  const [feedback, setFeedback] = useState(task.submission?.admin_feedback ?? '');

  if (!task.submission) return null;

  return (
    <div className="border border-border p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <TaskTypeBadge type={task.type} />
        <TaskPriorityBadge priority={task.priority} />
        <TaskStatusBadge status={task.submission.status} />
        <span className="font-mono text-[10px] text-text-muted tracking-widest">{task.title}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoBlock label="Original Task" value={`${task.description}\n\nOBJECTIVE\n${task.objective}`} />
        <div className="border border-border/60 p-3 space-y-2">
          <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Player Submission</p>
          <p className="font-mono text-xs text-text">{task.submission.report_title}</p>
          <ReviewLine label="Findings" value={task.submission.findings} />
          <ReviewLine label="Actions Taken" value={task.submission.actions_taken} />
          <ReviewLine label="Result" value={task.submission.result.toUpperCase()} />
          {task.submission.notes && <ReviewLine label="Notes" value={task.submission.notes} />}
          {task.submission.image_url && (
            <a href={task.submission.image_url} target="_blank" className="font-mono text-[10px] text-accent hover:underline">
              OPEN PROOF IMAGE
            </a>
          )}
        </div>
      </div>

      <Field label="Feedback">
        <textarea className="mcb-input resize-none" rows={3} value={feedback} onChange={e => setFeedback(e.target.value)} />
      </Field>

      <div className="flex gap-3">
        <button onClick={() => onReview(task, 'accepted', feedback)} disabled={busy} className="mcb-btn-success flex-1">{busy ? 'PROCESSING...' : 'ACCEPT'}</button>
        <button onClick={() => onReview(task, 'rejected', feedback)} disabled={busy} className="mcb-btn-danger flex-1">REJECT</button>
      </div>
    </div>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="font-mono text-[9px] text-text-muted tracking-widest uppercase">{label}</p>
      <p className="font-mono text-[11px] text-text-dim whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="font-mono text-[10px] text-text-muted tracking-widest uppercase">{label}</label>
      {children}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/60 p-3 space-y-1">
      <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">{label}</p>
      <p className="font-mono text-[11px] text-text-dim whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function AdminGate({ pwInput, setPwInput, pwError, onSubmit }: { pwInput: string; setPwInput: (v: string) => void; pwError: boolean; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center px-4">
      <div className="w-full max-w-xs space-y-6">
        <div className="text-center space-y-3">
          <div className={`w-16 h-16 border rounded-sm flex items-center justify-center mx-auto transition-colors ${pwError ? 'border-red-500' : 'border-accent/40 animate-pulse-glow'}`}>
            <span className={`text-2xl ${pwError ? 'text-red-400' : 'text-accent'}`}>{pwError ? '✗' : '⚿'}</span>
          </div>
          <p className="font-mono text-[10px] text-text-muted tracking-[0.4em] uppercase">Task Ops Access</p>
          <span className="classified-stamp">RESTRICTED</span>
        </div>
        <div className="panel p-6">
          <p className="mcb-section-header mb-4">AUTHORIZATION REQUIRED</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-text-muted tracking-widest uppercase">Admin Passcode</label>
              <input type="password" className={`mcb-input ${pwError ? 'border-red-500' : ''}`} value={pwInput} onChange={e => setPwInput(e.target.value)} autoFocus />
              {pwError && <p className="font-mono text-[10px] text-red-400">✗ AUTHORIZATION DENIED</p>}
            </div>
            <button type="submit" className="mcb-btn-primary w-full tracking-[0.25em]">▶ AUTHORIZE</button>
          </form>
        </div>
      </div>
    </div>
  );
}
