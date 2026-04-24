'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { TaskPriorityBadge, TaskStatusBadge, TaskTypeBadge } from '@/components/StatusBadge';
import { fetchTasksForPersonnel, updateTaskStatus } from '@/lib/data';
import { Task } from '@/lib/supabase';
import { formatTimestamp, getSession } from '@/lib/utils';

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const session = useMemo(() => getSession(), []);

  useEffect(() => {
    const currentSession = session;
    if (!currentSession) {
      router.replace('/access');
      return;
    }
    const sessionId = currentSession.id;

    async function load() {
      const { data } = await fetchTasksForPersonnel(sessionId);
      setTasks(data);
      setLoading(false);
      const pendingCount = data.filter(task => task.status === 'pending').length;
      if (pendingCount > 0) {
        setNotice(`TASK ASSIGNED // ${pendingCount} new directive${pendingCount > 1 ? 's' : ''} awaiting action.`);
      }
    }

    load();
  }, [router, session]);

  async function markInProgress(task: Task) {
    setBusyId(task.id);
    const { error } = await updateTaskStatus(task.id, 'in_progress');
    if (!error) {
      setTasks(prev => prev.map(item => item.id === task.id ? { ...item, status: 'in_progress' } : item));
      setNotice(`TASK UPDATED // ${task.title.toUpperCase()} now in progress.`);
    }
    setBusyId(null);
  }

  if (!session) return null;

  return (
    <Layout title="TASK BOARD" subtitle={`OPERATIVE QUEUE // ${session.codename}`} classified maxWidth="lg">
      <div className="py-6 space-y-4">
        {notice && (
          <div className="border border-accent/30 bg-accent/5 p-3 font-mono text-[11px] text-accent">
            {notice}
          </div>
        )}

        {loading ? (
          <p className="font-mono text-xs text-text-muted py-10 text-center animate-blink">Loading assignments...</p>
        ) : tasks.length === 0 ? (
          <div className="panel p-8 text-center space-y-2">
            <p className="font-mono text-xs text-text">No active directives assigned.</p>
            <p className="font-mono text-[10px] text-text-muted">Await bureau command for new research tasks or field missions.</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="mcb-panel p-5 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <TaskTypeBadge type={task.type} />
                    <TaskPriorityBadge priority={task.priority} />
                    <TaskStatusBadge status={task.status} />
                  </div>
                  <div>
                    <p className="font-sans text-xl font-bold tracking-wide text-text">{task.title}</p>
                    <p className="font-mono text-[10px] text-text-muted tracking-widest">
                      ASSIGNED BY {task.assigned_by ?? 'BUREAU ADMIN'} // {formatTimestamp(task.created_at)}
                    </p>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-text-muted text-left sm:text-right">
                  <p>Deadline: {task.deadline ? formatTimestamp(task.deadline) : 'OPEN'}</p>
                  <p>Task ID: {task.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoBlock label="Description" value={task.description} />
                <InfoBlock label="Objective" value={task.objective} />
              </div>

              {task.submission?.admin_feedback && (
                <div className="border border-yellow-400/20 bg-yellow-400/5 p-3">
                  <p className="font-mono text-[10px] text-yellow-400 tracking-widest mb-1">ADMIN FEEDBACK</p>
                  <p className="font-mono text-[11px] text-text-dim">{task.submission.admin_feedback}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {task.status === 'pending' && (
                  <button
                    onClick={() => markInProgress(task)}
                    disabled={busyId === task.id}
                    className="mcb-btn-ghost text-[10px]"
                  >
                    {busyId === task.id ? 'SYNCING...' : 'MARK IN PROGRESS'}
                  </button>
                )}
                <Link href={`/tasks/${task.id}/submit`} className="mcb-btn-primary text-[10px]">
                  {task.status === 'submitted' ? 'VIEW SUBMISSION' : 'SUBMIT REPORT'}
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
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
