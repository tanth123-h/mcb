/**
 * app/page.tsx — MCB Landing Page v3
 * - Full-viewport star field
 * - Logged-in users → /dashboard
 * - World map decoration on landing
 */
'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WorldMap from '@/components/WorldMap';
import { getSession, generateBootLogs } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

function safeR(r: number, min = 0.1): number { return Math.max(min, Math.abs(r)); }

export default function LandingPage() {
  const router    = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [booting, setBooting] = useState(true);
  const [logs,    setLogs]    = useState<string[]>([]);
  const [time,    setTime]    = useState('');
  const { t } = useI18n();

  useEffect(() => {
    const s = getSession();
    if (s) { router.replace('/dashboard'); return; }

    const allLogs = generateBootLogs(5);
    let i = 0;
    const iv = setInterval(() => {
      if (i < allLogs.length) setLogs(p => [...p, allLogs[i++]]);
      else { clearInterval(iv); setBooting(false); }
    }, 320);
    const clk = setInterval(() =>
      setTime(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'), 1000);
    setTime(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    return () => { clearInterval(iv); clearInterval(clk); };
  }, [router]);

  useEffect(() => {
    if (booting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let moonY = -120;
    let impacted = false;
    let glowPulse = 0;
    let mounted = true;

    function resize() {
      canvas!.width  = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!mounted || !ctx) return;
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      const w = canvas!.width, h = canvas!.height;

      const targetY = h * 0.42;
      if (!impacted) {
        moonY += (targetY - moonY) * 0.008;
        if (Math.abs(moonY - targetY) < 1) impacted = true;
      }
      glowPulse += 0.015;

      const glowR = safeR(70 + Math.sin(glowPulse) * 8, 10);

      // Glow halo
      const grd = ctx.createRadialGradient(w / 2, moonY, safeR(glowR * 0.15, 1), w / 2, moonY, safeR(glowR * 2.5, 20));
      grd.addColorStop(0, 'rgba(122,162,247,0.18)');
      grd.addColorStop(0.5, 'rgba(122,162,247,0.05)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(w / 2, moonY, safeR(glowR * 2.5, 20), 0, Math.PI * 2);
      ctx.fill();

      // Moon body
      const moonR = 56;
      const mg = ctx.createRadialGradient(w / 2 - 16, moonY - 16, 4, w / 2, moonY, moonR);
      mg.addColorStop(0, '#D0DAE8');
      mg.addColorStop(0.4, '#8FA0B4');
      mg.addColorStop(1, '#3E4F63');
      ctx.beginPath();
      ctx.arc(w / 2, moonY, moonR, 0, Math.PI * 2);
      ctx.fillStyle = mg;
      ctx.fill();

      // Craters
      ([
        [w / 2 - 16, moonY - 10, 9],
        [w / 2 + 18, moonY + 7,  6],
        [w / 2 - 4,  moonY + 20, 4.5],
        [w / 2 + 7,  moonY - 22, 3.5],
      ] as [number, number, number][]).forEach(([cx, cy, cr]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, safeR(cr, 1), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(25,35,50,0.45)';
        ctx.fill();
      });

      if (impacted) {
        const cx = w / 2, cy = moonY + moonR;
        ctx.strokeStyle = 'rgba(122,162,247,0.2)';
        ctx.lineWidth = 1;
        [[-38, 28], [-18, 48], [0, 56], [18, 48], [38, 28]].forEach(([dx, dy]) => {
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx, cy + dy); ctx.stroke();
        });
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      mounted = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [booting]);

  return (
    <div className="min-h-[calc(100vh-52px)] relative flex flex-col">

      {/* Boot screen */}
      {booting && (
        <div className="fixed inset-0 z-20 bg-bg flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-2">
            {logs.map((log, i) => (
              <p key={i} className="font-mono text-xs text-accent/80 animate-fadeIn">
                <span className="text-text-muted mr-2">{'>'}</span>{log}
              </p>
            ))}
            <p className="font-mono text-xs text-accent animate-blink">_</p>
          </div>
        </div>
      )}

      {/* Hero section */}
      <div className={`relative flex-1 min-h-[72vh] flex flex-col items-center justify-center transition-opacity duration-700 ${booting ? 'opacity-0' : 'opacity-100'}`}
        style={{ zIndex: 2 }}>
        {/* Moon canvas — overlaid on star field */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 2 }} />

        <div className="relative text-center px-4 space-y-5" style={{ zIndex: 3 }}>
          <p className="font-mono text-[10px] tracking-[0.6em] text-red-400/70 uppercase">{t('classified_transmission')}</p>
          <h1 className="font-sans text-5xl sm:text-8xl font-bold tracking-[0.10em] uppercase leading-none drop-shadow-[0_0_40px_rgba(122,162,247,0.15)]">
            {t('moonfall')}<br />
            <span className="text-accent">{t('incident')}</span><br />
            <span className="text-text-muted text-3xl sm:text-5xl font-light tracking-[0.2em]">{t('day0')}</span>
          </h1>
          <p className="font-mono text-[10px] sm:text-xs text-text-muted tracking-[0.4em] uppercase">
            {t('global_authority')}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-bg to-transparent pointer-events-none" style={{ zIndex: 3 }} />
      </div>

      {/* Content below hero */}
      <div className={`relative transition-opacity duration-700 delay-300 ${booting ? 'opacity-0' : 'opacity-100'}`}
        style={{ zIndex: 2 }}>

        {/* Incident report */}
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          <div className="border border-red-500/20 bg-red-500/5 p-5 space-y-3 backdrop-blur-sm">
            <p className="font-mono text-[10px] text-red-400/70 tracking-widest">{t('incident_report')}</p>
            <p className="font-mono text-xs text-text-dim leading-relaxed">
              {t('incident_body1')} <span className="text-text">{t('far_worse')}</span>{t('incident_body2')}
            </p>
            <p className="font-mono text-xs text-text-dim leading-relaxed">
              {t('incident_body3')} <span className="text-accent">{t('to_contain')}</span>
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/30" />
            <div className="w-1.5 h-1.5 rotate-45 bg-accent/50" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/30" />
          </div>

          {/* CTA buttons */}
          <div className="space-y-3">
            <Link href="/lore" className="mcb-btn-primary w-full block text-center py-3 tracking-[0.3em]">{t('btn_access_files')}</Link>
            <div className="grid grid-cols-3 gap-2">
              <Link href="/moonfall" className="mcb-btn-ghost text-center text-[10px]">{t('btn_incident_log')}</Link>
              <Link href="/apply"    className="mcb-btn-ghost text-center text-[10px]">{t('btn_apply')}</Link>
              <Link href="/access"   className="mcb-btn-ghost text-center text-[10px]">{t('btn_personnel')}</Link>
            </div>
          </div>

          {/* Status bar */}
          <div className="panel p-3 grid grid-cols-3 gap-2 text-center backdrop-blur-sm">
            {([[t('sys_integrity'),t('stable'),'text-green-400'],[t('containment_wall'),t('holding'),'text-accent'],[t('threat_level'),t('critical'),'text-red-400']] as [string,string,string][]).map(([l,v,c]) => (
              <div key={l}>
                <p className="font-mono text-[8px] text-text-muted tracking-widest mb-1">{l}</p>
                <p className={`font-mono text-[10px] font-bold ${c}`}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* World map section */}
        <div className="max-w-4xl mx-auto px-6 pb-10 space-y-3">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/20" />
            <p className="font-mono text-[9px] text-text-muted tracking-[0.4em]">GLOBAL SECTOR OVERVIEW</p>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/20" />
          </div>
          <div className="panel overflow-hidden backdrop-blur-sm">
            <WorldMap className="h-52 sm:h-72" />
          </div>
          <p className="font-mono text-[9px] text-text-muted text-center">{time} // NODE-7 // SECTOR-OMEGA</p>
        </div>

      </div>
    </div>
  );
}
