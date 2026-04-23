/**
 * app/access/page.tsx — Personnel login with codename + password
 */
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { lookupPersonnelByCredentials } from '@/lib/data';
import { saveSession, getSession } from '@/lib/utils';

const SCAN_MSGS = ['Initializing secure handshake...','Cross-referencing MCB registry...','Verifying credentials...','Decrypting personnel file...','Establishing secure channel...'];

export default function AccessPage() {
  const router = useRouter();
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

    for (const msg of SCAN_MSGS) {
      setScanMsg(msg); await delay(280 + Math.random()*160);
    }

    const { data, error } = await lookupPersonnelByCredentials(codename.trim(), password.trim());

    if (error || !data) { setPhase('error'); setErrorMsg('CREDENTIALS INVALID — Record not found or access denied.'); return; }

    saveSession(data); setPhase('success'); setScanMsg('Access granted. Redirecting...');
    await delay(700); router.push(`/profile/${data.id}`);
  }

  return (
    <Layout title="PERSONNEL ACCESS" subtitle="SECURE TERMINAL">
      <div className="min-h-[60vh] flex items-center justify-center py-8">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 border border-accent/40 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <span className="text-accent text-2xl">⬡</span>
            </div>
            <p className="font-mono text-[10px] text-text-muted tracking-[0.4em] uppercase">Restricted Access Terminal</p>
            <p className="font-mono text-xs text-text-dim">Enter your bureau credentials. Issued upon acceptance only.</p>
          </div>

          <div className="panel p-6">
            <p className="mcb-section-header mb-4">CREDENTIAL VERIFICATION</p>
            <form onSubmit={handleAccess} className="space-y-4">
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-text-muted tracking-widest uppercase">CODENAME</label>
                <input type="text" className="mcb-input uppercase" placeholder="e.g. BLACKOUT"
                  value={codename} onChange={e=>setCodename(e.target.value.toUpperCase())}
                  disabled={phase!=='idle'} autoComplete="off" />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-text-muted tracking-widest uppercase">ACCESS KEY</label>
                <input type="password" className="mcb-input" placeholder="Bureau-issued password"
                  value={password} onChange={e=>setPassword(e.target.value)}
                  disabled={phase!=='idle'} autoComplete="off" />
              </div>

              {(phase==='scanning'||phase==='success') && (
                <div className="border border-accent/30 bg-accent/5 p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="font-mono text-[11px] text-accent">{scanMsg}</span>
                  </div>
                  <div className="h-px bg-border overflow-hidden">
                    <div className="h-full bg-accent/60 transition-all duration-500" style={{width:phase==='success'?'100%':'70%'}} />
                  </div>
                </div>
              )}

              {phase==='error' && (
                <div className="border border-red-500/40 bg-red-500/5 p-3">
                  <p className="font-mono text-[11px] text-red-400">✗ {errorMsg}</p>
                  <button type="button" onClick={()=>setPhase('idle')} className="font-mono text-[10px] text-text-muted hover:text-text mt-2 underline">Try again</button>
                </div>
              )}

              <button type="submit" disabled={phase!=='idle'||!codename||!password} className="mcb-btn-primary w-full mt-2 tracking-[0.25em]">
                {phase==='scanning' ? <><span className="animate-blink">▌</span> SCANNING...</> : '▶ REQUEST ACCESS'}
              </button>
            </form>
          </div>

          <div className="border border-border/40 p-3 font-mono text-[10px] text-text-muted space-y-1">
            <p>Credentials are issued by bureau administration upon acceptance.</p>
            <p>Pending or rejected applicants have <span className="text-red-400">no access</span>.</p>
          </div>
          <p className="text-center font-mono text-[10px] text-text-muted">
            Not yet a bureau operative?{' '}
            <a href="/apply" className="text-accent hover:underline">Submit Application</a>
          </p>
        </div>
      </div>
    </Layout>
  );
}
function delay(ms: number) { return new Promise(r=>setTimeout(r,ms)); }
