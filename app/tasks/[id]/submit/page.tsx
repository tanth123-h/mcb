'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { TaskPriorityBadge, TaskStatusBadge, TaskTypeBadge } from '@/components/StatusBadge';
import { fetchTaskById, submitTaskReport } from '@/lib/data';
import { Task, TaskResult } from '@/lib/supabase';
import { formatTimestamp, getSession } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

const RESULTS: TaskResult[] = ['success', 'failure', 'inconclusive'];

export default function SubmitTaskPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const session = useMemo(() => getSession(), []);
  const { t } = useI18n();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [findings, setFindings] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [result, setResult] = useState<TaskResult>('success');
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const currentSession = session;
    if (!currentSession) {
      router.replace('/access');
      return;
    }
    const sessionId = currentSession.id;

    async function load() {
      const { data, error } = await fetchTaskById(params.id);
      if (error || !data || data.assigned_to !== sessionId) {
        router.replace('/tasks');
        return;
      }
      setTask(data);
      if (data.submission) {
        setReportTitle(data.submission.report_title);
        setFindings(data.submission.findings);
        setActionsTaken(data.submission.actions_taken);
        setResult(data.submission.result);
        setNotes(data.submission.notes ?? '');
      } else {
        setReportTitle(`${data.title} // FIELD REPORT`);
      }
      setLoading(false);
    }

    load();
  }, [params.id, router, session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !task) return;
    setSaving(true);
    setMessage(null);

    const { error } = await submitTaskReport({
      taskId: task.id,
      personnelId: session.id,
      reportTitle,
      findings,
      actionsTaken,
      result,
      notes,
      imageFile,
    });

    if (error) {
      setMessage(`Submission failed: ${error}`);
      setSaving(false);
      return;
    }

    router.push('/tasks');
  }

  if (!session) return null;

  return (
    <Layout title={t('submit_report_title')} subtitle={t('submit_report_subtitle')} classified maxWidth="lg">
      <div className="py-6 space-y-4">
        {loading || !task ? (
          <p className="font-mono text-xs text-text-muted py-10 text-center animate-blink">{t('decrypting_task')}</p>
        ) : (
          <>
            <div className="mcb-panel p-5 space-y-3">
              <div className="flex flex-wrap gap-2">
                <TaskTypeBadge type={task.type} />
                <TaskPriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />
              </div>
              <div>
                <p className="font-sans text-xl font-bold text-text">{task.title}</p>
                <p className="font-mono text-[10px] text-text-muted tracking-widest">
                  {task.assigned_by ?? 'BUREAU ADMIN'} // {formatTimestamp(task.created_at)}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoBlock label={t('description')} value={task.description} />
                <InfoBlock label={t('objective')} value={task.objective} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mcb-panel p-5 space-y-4">
              <p className="mcb-section-header">{t('report_submission')}</p>

              <Field label={t('label_report_title')}>
                <input className="mcb-input" value={reportTitle} onChange={e => setReportTitle(e.target.value)} required />
              </Field>

              <Field label={t('label_findings')}>
                <textarea className="mcb-input resize-none" rows={5} value={findings} onChange={e => setFindings(e.target.value)} required />
              </Field>

              <Field label={t('label_actions')}>
                <textarea className="mcb-input resize-none" rows={4} value={actionsTaken} onChange={e => setActionsTaken(e.target.value)} required />
              </Field>

              <Field label={t('label_result')}>
                <select className="mcb-input" value={result} onChange={e => setResult(e.target.value as TaskResult)}>
                  {RESULTS.map(item => <option key={item} value={item}>{item.toUpperCase()}</option>)}
                </select>
              </Field>

              <Field label={t('label_report_notes')}>
                <textarea className="mcb-input resize-none" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
              </Field>

              <Field label={t('label_proof_image')}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="mcb-input file:mr-3 file:border-0 file:bg-transparent file:font-mono file:text-[10px] file:text-accent"
                  onChange={e => setImageFile(e.target.files?.[0] ?? null)}
                />
              </Field>

              {task.submission?.admin_feedback && (
                <div className="border border-yellow-400/20 bg-yellow-400/5 p-3">
                  <p className="font-mono text-[10px] text-yellow-400 tracking-widest">{t('last_feedback')}</p>
                  <p className="font-mono text-[11px] text-text-dim mt-1">{task.submission.admin_feedback}</p>
                </div>
              )}

              {message && (
                <div className="border border-red-500/30 bg-red-500/10 p-3 font-mono text-[11px] text-red-400">
                  {message}
                </div>
              )}

              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="mcb-btn-primary flex-1">
                  {saving ? t('btn_uplinking') : t('btn_submit')}
                </button>
                <button type="button" onClick={() => router.push('/tasks')} className="mcb-btn-ghost flex-1">{t('btn_return')}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </Layout>
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
