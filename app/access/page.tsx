/**
 * app/access/page.tsx — Personnel login with codename + password
 */
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { lookupPersonnelByCredentials } from '@/lib/data';
import { saveSession, getSession } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

const SCAN_MSGS_EN = ['Initializing secure handshake...','Cross-referencing MCB registry...','Verifying credentials...','Decrypting personnel file...','Establishing secure channel...'];
const SCAN_MSGS_TH = ['กำลังเริ่มการสื่อสารที่ปลอดภัย...','ตรวจสอบทะเบียน MCB...','ยืนยันข้อมูลรับรอง...','ถอดรหัสไฟล์บุคลากร...','สร้างช่องทางที่ปลอดภัย...'];

export default function AccessPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [codename, setCodename] = useState('');
  const [password, setPassword] = useState('');
  const [phase, setPhase]   = useState<'idle'|'scanning'|'error'|'success'>('idle');
  const [scanMsg, setScanMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const s = getSession(); if (s) router.replace(`/profile/${s.id}`);
  }, [router]);

  async function handleAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!codename.trim() || !password.trim()) return;
    setPhase('scanning'); setErrorMsg('');

    const msgs = lang === 'th' ? SCAN_MSGS_TH : SCAN_MSGS_EN;
    for (const msg of msgs) {
      setScanMsg(msg); await delay(280 + Math.random() * 160);
    }

    const { data, error } = await lookupPersonnelByCredentials(codename.trim(), password.trim());

    if (error || !data) {
      setPhase('error');
      setErrorMsg(t('creds_invalid'));
      return;
    }

    saveSession(data);
    setPhase('success');
    setScanMsg(lang === 'th' ? 'อนุญาตการเข้าถึง กำลังเปลี่ยนเส้นทาง...' : 'Access granted. Redirecting...');
    await delay(700);
    router.push(`/profile/${data.id}`);
  }

  return (
    <Layout title={t('credential_verification')} subtitle={t('restricted_terminal')}>
      <div className="min-h-[60vh] flex items-center justify-center py-8">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 border border-accent/40 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <span className="text-accent text-2xl">⬡</span>
            </div>
            <p className="font-mono text-[10px] text-text-muted tracking-[0.4em] uppercase">{t('restricted_terminal')}</p>
            <p className="font-mono text-xs text-text-dim">{t('enter_credentials')}</p>
          </div>

          <div className="panel p-6">
            <p className="mcb-section-header mb-4">{t('credential_verification')}</p>
            <form onSubmit={handleAccess} className="space-y-4">
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-text-muted tracking-widest uppercase">{t('label_codename')}</label>
                <input type="text" className="mcb-input uppercase" placeholder={t('placeholder_codename')}
                  value={codename} onChange={e => setCodename(e.target.value.toUpperCase())}
                  disabled={phase !== 'idle'} autoComplete="off" />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-text-muted tracking-widest uppercase">{t('label_access_key')}</label>
                <input type="password" className="mcb-input" placeholder={t('placeholder_password')}
                  value={password} onChange={e => setPassword(e.target.value)}
                  disabled={phase !== 'idle'} autoComplete="off" />
              </div>

              {(phase === 'scanning' || phase === 'success') && (
                <div className="border border-accent/30 bg-accent/5 p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="font-mono text-[11px] text-accent">{scanMsg}</span>
                  </div>
                  <div className="h-px bg-border overflow-hidden">
                    <div className="h-full bg-accent/60 transition-all duration-500" style={{ width: phase === 'success' ? '100%' : '70%' }} />
                  </div>
                </div>
              )}

              {phase === 'error' && (
                <div className="border border-red-500/40 bg-red-500/5 p-3">
                  <p className="font-mono text-[11px] text-red-400">✗ {errorMsg}</p>
                  <button type="button" onClick={() => setPhase('idle')} className="font-mono text-[10px] text-text-muted hover:text-text mt-2 underline">
                    {t('try_again')}
                  </button>
                </div>
              )}

              <button type="submit" disabled={phase !== 'idle' || !codename || !password} className="mcb-btn-primary w-full mt-2 tracking-[0.25em]">
                {phase === 'scanning' ? <><span className="animate-blink">▌</span> {t('scanning')}</> : t('btn_request_access')}
              </button>
            </form>
          </div>

          <div className="border border-border/40 p-3 font-mono text-[10px] text-text-muted space-y-1">
            <p>{t('creds_note1')}</p>
            <p>{t('creds_note2')} <span className="text-red-400">{t('creds_note2b')}</span>.</p>
          </div>
          <p className="text-center font-mono text-[10px] text-text-muted">
            {t('not_operative')}{' '}
            <a href="/apply" className="text-accent hover:underline">{t('submit_application')}</a>
          </p>
        </div>
      </div>
    </Layout>
  );
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
