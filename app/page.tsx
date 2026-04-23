/**
 * app/page.tsx — MCB Landing Page v2
 * BUG FIX: All canvas arc() calls guarded with safeR() — no negative/zero radii.
 */
'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession, generateBootLogs } from '@/lib/utils';

/** Prevents IndexSizeError — always returns a radius >= min */
function safeR(r: number, min = 0.1): number {
  return Math.max(min, Math.abs(r));
}

export default function LandingPage() {
  const router    = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [booting, setBooting] = useState(true);
  const [logs,    setLogs]    = useState<string[]>([]);
  const [time,    setTime]    = useState('');

  useEffect(() => {
    const s = getSession();
    if (s) { router.replace(`/profile/${s.id}`); return; }
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
    let moonY    = -120;
    let impacted  = false;
    let glowPulse = 0;
    let mounted   = true;

    // Stars: radius guaranteed >= 0.3
    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.7,
      r: safeR(Math.random() * 1.5, 0.3),
      a: Math.random(),
    }));

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!mounted) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width, h = canvas.height;

      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#040810');
      sky.addColorStop(1, '#0A0F14');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      stars.forEach(s => {
        s.a += 0.005;
        if (s.a > 1) s.a = 0;
        ctx.beginPath();
        ctx.arc(s.x, s.y, safeR(s.r), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230,237,243,${0.3 + Math.sin(s.a) * 0.3})`;
        ctx.fill();
      });

      const targetY = h * 0.38;
      if (!impacted) {
        moonY += (targetY - moonY) * 0.008;
        if (Math.abs(moonY - targetY) < 1) impacted = true;
      }
      glowPulse += 0.015;

      // glowR: sin oscillates ±8 around 80 — always positive, but safeR for safety
      const glowR = safeR(80 + Math.sin(glowPulse) * 8, 10);

      // Glow halo
      const grd = ctx.createRadialGradient(w / 2, moonY, safeR(glowR * 0.15, 1), w / 2, moonY, safeR(glowR * 2, 20));
      grd.addColorStop(0, 'rgba(122,162,247,0.22)');
      grd.addColorStop(0.5, 'rgba(122,162,247,0.06)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(w / 2, moonY, safeR(glowR * 2, 20), 0, Math.PI * 2);
      ctx.fill();

      // Moon body
      const moonR = 62;
      const mg = ctx.createRadialGradient(w / 2 - 18, moonY - 18, 5, w / 2, moonY, moonR);
      mg.addColorStop(0, '#CBD5E1');
      mg.addColorStop(0.4, '#94A3B8');
      mg.addColorStop(1, '#475569');
      ctx.beginPath();
      ctx.arc(w / 2, moonY, moonR, 0, Math.PI * 2);
      ctx.fillStyle = mg;
      ctx.fill();

      // Craters — all radii safe
      ([
        [w / 2 - 18, moonY - 12, 10],
        [w / 2 + 20, moonY + 8,   7],
        [w / 2 - 5,  moonY + 22,  5],
        [w / 2 + 8,  moonY - 25,  4],
      ] as [number, number, number][]).forEach(([cx, cy, cr]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, safeR(cr, 1), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(30,41,59,0.5)';
        ctx.fill();
      });

      // Impact effect
      if (impacted) {
        const cx = w / 2, cy = moonY + moonR;
        ctx.strokeStyle = 'rgba(122,162,247,0.25)';
        ctx.lineWidth = 1;
        [[-40, 30], [-20, 50], [0, 60], [20, 50], [40, 30]].forEach(([dx, dy]) => {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + dx, cy + dy);
          ctx.stroke();
        });
        const impGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
        impGrd.addColorStop(0, 'rgba(122,162,247,0.08)');
        impGrd.addColorStop(1, 'transparent');
        ctx.fillStyle = impGrd;
        ctx.beginPath();
        ctx.arc(cx, cy, 60, 0, Math.PI * 2);
        ctx.fill();
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

      <div className={`relative flex-1 min-h-[70vh] flex flex-col items-center justify-center transition-opacity duration-700 ${booting ? 'opacity-0' : 'opacity-100'}`}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 text-center px-4 space-y-4">
          <p className="font-mono text-[10px] tracking-[0.6em] text-red-400/70 uppercase">⚠ CLASSIFIED TRANSMISSION</p>
          <h1 className="font-sans text-5xl sm:text-7xl font-bold tracking-[0.12em] uppercase leading-none">
            MOONFALL<br />
            <span className="text-accent">INCIDENT</span><br />
            <span className="text-text-muted text-3xl sm:text-4xl">DAY 0</span>
          </h1>
          <p className="font-mono text-xs text-text-muted tracking-[0.35em] uppercase">
            MOONFALL CONTAINMENT BUREAU // GLOBAL AUTHORITY
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
      </div>

      <div className={`relative z-10 transition-opacity duration-700 delay-300 ${booting ? 'opacity-0' : 'opacity-100'}`}>
        <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
          <div className="border border-red-500/20 bg-red-500/5 p-5 space-y-3">
            <p className="font-mono text-[10px] text-red-400/70 tracking-widest">FILE: INCIDENT-REPORT-001 // CLEARANCE LEVEL: OMEGA</p>
            <p className="font-mono text-xs text-text-dim leading-relaxed">
              On Day 0, the Moon left its orbit. Standard physics did not apply. There was no extinction event — only something <span className="text-text">far worse</span>. What emerged from the impact site defied every model, every simulation, every assumption we had about the boundaries of the natural world.
            </p>
            <p className="font-mono text-xs text-text-dim leading-relaxed">
              The Bureau was formed in the weeks that followed. Not to save the world — <span className="text-accent">to contain it.</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/30" />
            <div className="w-1.5 h-1.5 rotate-45 bg-accent/50" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/30" />
          </div>
          <div className="space-y-3">
            <Link href="/lore" className="mcb-btn-primary w-full block text-center py-3 tracking-[0.3em]">▶ ACCESS CLASSIFIED FILES</Link>
            <div className="grid grid-cols-3 gap-2">
              <Link href="/moonfall" className="mcb-btn-ghost text-center text-[10px]">INCIDENT LOG</Link>
              <Link href="/apply"    className="mcb-btn-ghost text-center text-[10px]">APPLY</Link>
              <Link href="/access"   className="mcb-btn-ghost text-center text-[10px]">PERSONNEL</Link>
            </div>
          </div>
          <div className="panel p-3 grid grid-cols-3 gap-2 text-center">
            {[['SYS INTEGRITY','STABLE','text-green-400'],['CONTAINMENT WALL','HOLDING','text-accent'],['THREAT LEVEL','CRITICAL','text-red-400']].map(([l,v,c])=>(
              <div key={l}><p className="font-mono text-[8px] text-text-muted tracking-widest mb-1">{l}</p><p className={`font-mono text-[10px] font-bold ${c}`}>{v}</p></div>
            ))}
          </div>
          <p className="font-mono text-[9px] text-text-muted text-center">{time} // NODE-7 // SECTOR-OMEGA</p>
        </div>
      </div>
    </div>
  );
}
