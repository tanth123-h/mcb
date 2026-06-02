'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import RecordImage from '@/components/RecordImage';
import { TaskPriorityBadge, TaskStatusBadge, TaskTypeBadge } from '@/components/StatusBadge';
import { fetchTaskById, reviewTaskSubmission } from '@/lib/data';
import { Task } from '@/lib/supabase';
import { clearAdminAuth, formatTimestamp, getAdminAuth, saveAdminAuth } from '@/lib/utils';

const ADMIN_PASSWORD = '44475';

export default function AdminTaskDetailPage() {
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

  return <DetailView onLogout={() => { clearAdminAuth(); setAuthed(false); }} />;
}

function DetailView({ onLogout }: { onLogout: () => void }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await fetchTaskById(id);
      setTask(data);
      setFeedback(data?.submission?.admin_feedback ?? '');
      setLoading(false);
    }
    load();
  }, [id]);

  async function review(status: 'accepted' | 'rejected') {
    if (!task?.submission) return;
    setBusy(true);
    const { error } = await reviewTaskSubmission({
      taskId: task.id,
      submissionId: task.submission.id,
      status,
      feedback,
    });
    if (error) setNotice(`Error: ${error}`);
    else {
      setTask(prev => prev && prev.submission ? {
        ...prev,
        status,
        submission: { ...prev.submission, status, admin_feedback: feedback },
      } : prev);
      setNotice(`REPORT ${status.toUpperCase()}`);
    }
    setBusy(false);
  }

  return (
    <Layout title="TASK REVIEW FILE" subtitle="ADMIN SUBMISSION INSPECTION" classified maxWidth="2xl">
      <div className="flex items-center justify-between border border-red-500/20 bg-red-500/5 px-4 py-2 my-4">
        <span className="font-mono text-[10px] text-red-400/70">⚠ DETAILED REVIEW MODE</span>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/tasks')} className="font-mono text-[10px] text-accent hover:text-text">[BACK]</button>
          <button onClick={onLogout} className="font-mono text-[10px] text-text-muted hover:text-red-400">[LOGOUT]</button>
        </div>
      </div>

      {notice && <div className="panel border-accent/40 px-4 py-2 font-mono text-xs text-accent mb-4">{notice}</div>}

      {loading || !task ? (
        <p className="font-mono text-xs text-text-muted py-12 text-center animate-blink">Loading review file...</p>
      ) : (
        <div className="space-y-5">
          <div className="mcb-panel p-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              <TaskTypeBadge type={task.type} />
              <TaskPriorityBadge priority={task.priority} />
              <TaskStatusBadge status={task.status} />
            </div>
            <p className="font-sans text-2xl font-bold text-text">{task.title}</p>
            <p className="font-mono text-[10px] text-text-muted tracking-widest">
              ASSIGNED TO {task.personnel?.codename ?? task.assigned_to} // {formatTimestamp(task.created_at)}
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Section title="TASK INFO">
              <InfoBlock label="DESCRIPTION" value={task.description} />
              <InfoBlock label="OBJECTIVE" value={task.objective} />
            </Section>

            <Section title="PLAYER SUBMISSION">
              {task.submission ? (
                <div className="space-y-3">
                  <InfoBlock label="REPORT TITLE" value={task.submission.report_title} />
                  <InfoBlock label="FINDINGS" value={task.submission.findings} />
                  <InfoBlock label="ACTIONS TAKEN" value={task.submission.actions_taken} />
                  <InfoBlock label="RESULT" value={task.submission.result.toUpperCase()} />
                  <InfoBlock label="NOTES" value={task.submission.notes || '—'} />
                </div>
              ) : (
                <p className="font-mono text-[11px] text-text-muted">No submission filed yet.</p>
              )}
            </Section>
          </div>

          <Section title="UPLOADED IMAGE">
            <RecordImage src={task.submission?.image_url} alt={`${task.title} uploaded proof`} emptyLabel="No screenshot uploaded" />
          </Section>

          {task.submission && (
            <Section title="REVIEW DECISION">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-text-muted tracking-widest uppercase">Feedback</label>
                  <textarea className="mcb-input resize-none" rows={4} value={feedback} onChange={e => setFeedback(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => review('accepted')} disabled={busy} className="mcb-btn-success flex-1">{busy ? 'PROCESSING...' : 'ACCEPT'}</button>
                  <button onClick={() => review('rejected')} disabled={busy} className="mcb-btn-danger flex-1">REJECT</button>
                </div>
              </div>
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
        <p className="mcb-section-header">TASK REVIEW ACCESS</p>
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/60 p-3 space-y-1">
      <p className="font-mono text-[10px] text-text-muted tracking-widest uppercase">{label}</p>
      <p className="font-mono text-[11px] text-text-dim whitespace-pre-wrap">{value}</p>
    </div>
  );
}
