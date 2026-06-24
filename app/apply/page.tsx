/**
 * app/apply/page.tsx
 * Application submission form — MCB Bureau intake.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { submitApplication } from '@/lib/data';
import { useI18n } from '@/lib/i18n';

const ROLES = [
  'Field Operative',
  'Containment Specialist',
  'Research Analyst',
  'Intelligence Officer',
  'Tactical Support',
  'Medical Officer',
  'Archivist',
  'Surveillance Technician',
  'Extraction Unit',
  'Command Staff',
];

interface FormData {
  full_name:        string;
  codename:         string;
  age:              string;
  nationality:      string;
  role_applied:     string;
  background_story: string;
  skills:           string;
  notes:            string;
}

const EMPTY: FormData = {
  full_name:        '',
  codename:         '',
  age:              '',
  nationality:      '',
  role_applied:     '',
  background_story: '',
  skills:           '',
  notes:            '',
};

export default function ApplyPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [form,    setForm]    = useState<FormData>(EMPTY);
  const [errors,  setErrors]  = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiErr,  setApiErr]  = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  function update(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.full_name.trim())                       e.full_name        = 'Required';
    if (!form.codename.trim())                        e.codename         = 'Required';
    if (!/^[A-Z0-9_-]+$/i.test(form.codename))       e.codename         = 'Alphanumeric + _ - only';
    if (!form.age || isNaN(Number(form.age)))         e.age              = 'Valid age required';
    if (Number(form.age) < 18 || Number(form.age) > 80) e.age           = 'Must be 18–80';
    if (!form.nationality.trim())                     e.nationality      = 'Required';
    if (!form.role_applied)                           e.role_applied     = 'Select a role';
    if (form.background_story.trim().length < 50)     e.background_story = 'Minimum 50 characters';
    if (!form.skills.trim())                          e.skills           = 'List at least one skill';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiErr(null);

    const { error } = await submitApplication({
      full_name:        form.full_name.trim(),
      codename:         form.codename.trim().toUpperCase(),
      age:              Number(form.age),
      nationality:      form.nationality.trim(),
      role_applied:     form.role_applied,
      background_story: form.background_story.trim(),
      skills:           form.skills.trim(),
      notes:            form.notes.trim() || undefined,
    }, imageFile);

    setLoading(false);

    if (error) {
      if (error.includes('unique') || error.includes('codename')) {
        setApiErr('Codename already exists in the system. Choose another.');
      } else {
        setApiErr(`Submission failed: ${error}`);
      }
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <Layout title={t('app_success_title')} subtitle={t('app_success_subtitle')}>
        <div className="py-8 max-w-lg mx-auto space-y-6">
          <div className="mcb-panel p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border border-green-400/40 flex items-center justify-center mx-auto">
              <span className="text-green-400 text-xl">✓</span>
            </div>
            <div className="space-y-2">
              <p className="font-mono text-xs text-green-400 tracking-widest">{t('transmission_received')}</p>
              <p className="font-sans text-lg font-semibold text-text">{t('application_logged')}</p>
              <p className="font-mono text-xs text-text-muted">
                {t('label_codename')} <span className="text-accent">{form.codename.toUpperCase()}</span> {t('app_pending_note')}
              </p>
            </div>
            <div className="border border-border/60 p-3 text-left space-y-1 font-mono text-[10px] text-text-muted">
              <p>{'>'} {t('app_status_pending')} <span className="text-yellow-400">PENDING</span></p>
              <p>{t('app_review_window')}</p>
              <p>{t('app_no_duplicate')}</p>
            </div>
          </div>
          <button onClick={() => router.push('/')} className="mcb-btn-ghost w-full">
            {t('btn_return_terminal')}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('nav_apply').toUpperCase() + ' — PERSONNEL APPLICATION'} subtitle="BUREAU INTAKE FORM" classified>
      <div className="py-6 max-w-2xl">
        <div className="border border-accent/20 bg-accent/5 p-4 mb-6 font-mono text-[11px] text-text-dim space-y-1">
          <p>{t('form_header')}</p>
          <p>{t('form_warning')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 stagger">

          <FormSection label={t('section_identity')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('label_full_name')} error={errors.full_name}>
                <input type="text" className="mcb-input" placeholder="First Last"
                  value={form.full_name} onChange={e => update('full_name', e.target.value)} />
              </FormField>

              <FormField label={t('label_codename_field')} error={errors.codename} hint={t('hint_codename')}>
                <input type="text" className="mcb-input uppercase" placeholder="GHOST-7 / BLACKOUT / VIPER"
                  value={form.codename} onChange={e => update('codename', e.target.value.toUpperCase())} />
              </FormField>

              <FormField label={t('label_age')} error={errors.age}>
                <input type="number" className="mcb-input" placeholder="18–80" min={18} max={80}
                  value={form.age} onChange={e => update('age', e.target.value)} />
              </FormField>

              <FormField label={t('label_nationality')} error={errors.nationality}>
                <input type="text" className="mcb-input" placeholder="e.g. American"
                  value={form.nationality} onChange={e => update('nationality', e.target.value)} />
              </FormField>
            </div>
          </FormSection>

          <FormSection label={t('section_assignment')}>
            <FormField label={t('label_role')} error={errors.role_applied}>
              <select className="mcb-input" value={form.role_applied} onChange={e => update('role_applied', e.target.value)}>
                <option value="">— Select Role —</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </FormField>
          </FormSection>

          <FormSection label={t('section_background')}>
            <FormField label={t('label_background')} error={errors.background_story} hint={t('hint_background')}>
              <textarea className="mcb-input resize-none" rows={5}
                placeholder="Describe your relevant background, previous assignments, and reason for applying to the Bureau..."
                value={form.background_story} onChange={e => update('background_story', e.target.value)} />
              <p className="font-mono text-[10px] text-text-muted mt-1 text-right">{form.background_story.length} chars</p>
            </FormField>

            <FormField label={t('label_skills')} error={errors.skills} hint={t('hint_skills')}>
              <input type="text" className="mcb-input" placeholder="Combat Operations, Cryptography, Surveillance..."
                value={form.skills} onChange={e => update('skills', e.target.value)} />
            </FormField>

            <FormField label={t('label_notes')} error={errors.notes} hint={t('hint_notes')}>
              <textarea className="mcb-input resize-none" rows={3}
                placeholder="Any additional information you wish to disclose..."
                value={form.notes} onChange={e => update('notes', e.target.value)} />
            </FormField>

            <FormField label={t('label_attach')} hint="Optional. Stored in Supabase Storage bucket `applications`.">
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                className="mcb-input file:mr-3 file:border-0 file:bg-transparent file:font-mono file:text-[10px] file:text-accent"
                onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
            </FormField>
          </FormSection>

          {apiErr && (
            <div className="border border-red-500/40 bg-red-500/10 p-3 font-mono text-xs text-red-400">
              ✗ {apiErr}
            </div>
          )}

          <div className="pt-2">
            <button type="submit" disabled={loading} className="mcb-btn-primary w-full py-3 text-sm tracking-[0.3em]">
              {loading ? <><span className="animate-blink">▌</span> {t('submitting')}</> : t('btn_submit_app')}
            </button>
            <p className="font-mono text-[10px] text-text-muted text-center mt-2">{t('directive_agree')}</p>
          </div>

        </form>
      </div>
    </Layout>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mcb-panel p-5 space-y-4">
      <p className="mcb-section-header">{label}</p>
      {children}
    </div>
  );
}

function FormField({
  label, error, hint, children,
}: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="font-mono text-[10px] text-text-muted tracking-widest uppercase block">
        {label}
      </label>
      {children}
      {hint  && !error && <p className="font-mono text-[10px] text-text-muted">{hint}</p>}
      {error && <p className="font-mono text-[10px] text-red-400">✗ {error}</p>}
    </div>
  );
}
