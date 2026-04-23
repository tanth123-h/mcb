/**
 * app/moonfall/page.tsx
 * MCB Moonfall Visualization — Earth globe, Moon hits Africa.
 *
 * BUG FIX: IndexSizeError: arc() radius is negative
 * SOLUTION: safeR() helper enforces radius >= min everywhere.
 *           Particles filtered AND clamped before draw.
 *           All computed radii (sin-based, lerp-based) guarded.
 */
'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

/** CRITICAL GUARD — prevents IndexSizeError from negative/zero radii */
function safeR(r: number, min = 0.1): number {
  return Math.max(min, Math.abs(r));
}

const EVENTS = [
  { day: 'DAY 0',  col: '#94A3B8', title: 'ORBITAL DEPARTURE',       sub: 'The Moon departs orbit at 03:17 UTC. No warning. No natural explanation. All models indicate impossibility.' },
  { day: 'DAY 0',  col: '#F87171', title: 'IMPACT — SECTOR OMEGA',    sub: 'Partial embed confirmed. Epicenter: Congo Basin, Central Africa. Radius ~400km. Physics anomaly — no extinction.' },
  { day: 'DAY 3',  col: '#FB923C', title: 'ANOMALY SPREAD',           sub: 'Environmental impossibilities radiate outward. Atmosphere composition altered within 600km. Readings: unreliable.' },
  { day: 'DAY 12', col: '#FBBF24', title: 'INFECTION ZERO',           sub: 'Unknown pathogen detected 800km from impact. Spreads through unknown vector. Classification: OMEGA. Mortality: 34%.' },
  { day: 'DAY 19', col: '#A78BFA', title: 'CREATURE EMERGENCE',       sub: 'Unidentified lifeforms confirmed emerging from the impact perimeter. Origin: unknown. Threat level: CRITICAL.' },
  { day: 'DAY 28', col: '#7AA2F7', title: 'MCB ESTABLISHED',          sub: 'All 193 UN member states vote unanimously. The Moonfall Containment Bureau is formed. Global authority granted.' },
  { day: 'DAY 40', col: '#4ADE80', title: 'CONTAINMENT WALL COMPLETE',sub: '1,400km reinforced perimeter wall completed around Sector Omega. 47 million civilians evacuated. Wall: HOLDING.' },
  { day: 'NOW',    col: '#7AA2F7', title: 'OPERATIONS ONGOING',       sub: 'MCB maintains 24/7 surveillance. Zone expands slowly. True nature of Moonfall event: UNKNOWN. Bureau stands.' },
];

// Simplified continent outlines [lon, lat]
const CONTINENTS: Record<string, [number, number][]> = {
  africa: [[-18,16],[4,37],[15,37],[32,31],[45,12],[52,-2],[44,-22],[34,-35],[26,-34],[18,-35],[12,-18],[9,4],[2,6],[-6,5],[-16,10],[-18,16]],
  europe: [[-10,36],[3,44],[10,54],[20,55],[28,56],[32,64],[28,70],[22,70],[14,66],[4,52],[-5,48],[-10,38],[-10,36]],
  asia:   [[26,70],[40,72],[60,73],[80,73],[105,72],[140,72],[145,45],[140,35],[130,28],[120,22],[105,10],[80,8],[60,22],[50,24],[40,36],[32,36],[28,56],[22,70],[26,70]],
  northAm:[[-170,72],[-140,70],[-100,75],[-80,72],[-60,50],[-50,46],[-60,40],[-76,25],[-88,16],[-105,20],[-120,32],[-125,38],[-140,58],[-160,60],[-170,65],[-170,72]],
  southAm:[[-80,12],[-70,12],[-50,0],[-36,-5],[-38,-15],[-44,-24],[-44,-32],[-58,-38],[-68,-56],[-75,-50],[-72,-40],[-72,-30],[-80,-8],[-80,12]],
  australia:[[114,-22],[120,-14],[128,-14],[136,-12],[140,-18],[148,-22],[150,-30],[148,-38],[140,-38],[132,-32],[124,-32],[114,-28],[114,-22]],
};

interface Particle { x:number; y:number; vx:number; vy:number; r:number; life:number; maxLife:number; col:string; }
interface Wave     { x:number; y:number; r:number; alpha:number; speed:number; width:number; col:string; }

function projectLL(lon:number, lat:number, px:number, py:number, r:number, rot=0): {x:number;y:number;z:number}|null {
  const lonR = (lon + rot) * Math.PI / 180;
  const latR = lat * Math.PI / 180;
  const x3 = Math.cos(latR) * Math.sin(lonR);
  const y3 = Math.sin(latR);
  const z3 = Math.cos(latR) * Math.cos(lonR);
  if (z3 < -0.1) return null;
  return { x: px + x3 * r, y: py - y3 * r, z: z3 };
}

export default function MoonfallPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep]     = useState(0);
  const stepRef = useRef(0);

  // Keep ref in sync so canvas loop always sees current step
  useEffect(() => { stepRef.current = step; }, [step]);

  const goStep = useCallback((i: number) => {
    setStep(Math.max(0, Math.min(EVENTS.length - 1, i)));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;
    let mounted = true;
    let earthRot = 0;

    // Animation state — lerped toward target per step
    let curSpread    = 0;
    let curWall      = 0;
    let curInfect    = 0;
    let curMCB       = 0;
    let curMoonProg  = 0;  // 0=orbit, 1=impacted
    let impactDone   = false;

    const TARGET_SPREAD    = [0, 0, 0.18, 0.28, 0.35, 0.38, 0.42, 0.44];
    const TARGET_WALL      = [0, 0,    0,    0,    0,    0, 0.52, 0.52];
    const TARGET_INFECT    = [0, 0,    0,  0.6,  0.8, 0.85,  0.9,  0.9];
    const TARGET_MCB       = [0, 0,    0,    0,    0,  0.8,  0.8,  0.9];
    const TARGET_MOONPROG  = [0, 1,    1,    1,    1,    1,    1,    1];

    const particles: Particle[] = [];
    const waves:     Wave[]     = [];

    // Stars with safe radii
    const stars = Array.from({ length: 280 }, () => ({
      x: Math.random(), y: Math.random(),
      r: safeR(Math.random() * 1.3, 0.2),
      a: Math.random() * Math.PI * 2,
      sp: 0.3 + Math.random() * 0.8,
    }));

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

    function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
    resize();
    window.addEventListener('resize', resize);

    function getImpactPt(cx: number, cy: number, r: number, rot: number) {
      // Congo Basin approx lon=22E, lat=0
      const p = projectLL(22, 0, cx, cy, r, rot);
      return p ? { x: p.x, y: p.y } : { x: cx, y: cy };
    }

    function drawEarth(cx: number, cy: number, r: number) {
      // Ocean
      const og = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
      og.addColorStop(0, '#1a3a5c'); og.addColorStop(0.5, '#0e2340'); og.addColorStop(1, '#060f1e');
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = og; ctx.fill();

      // Atmosphere
      const ag = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.18);
      ag.addColorStop(0, 'rgba(30,80,160,0)'); ag.addColorStop(0.5, 'rgba(30,100,200,0.12)'); ag.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(cx, cy, safeR(r * 1.18), 0, Math.PI * 2);
      ctx.fillStyle = ag; ctx.fill();

      // Continents
      Object.entries(CONTINENTS).forEach(([name, poly]) => {
        ctx.beginPath();
        let first = true;
        poly.forEach(([lon, lat]) => {
          const p = projectLL(lon, lat, cx, cy, r, earthRot);
          if (!p) return;
          first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          first = false;
        });
        ctx.closePath();
        ctx.fillStyle   = name === 'africa' ? 'rgba(80,120,60,0.55)' : 'rgba(60,90,70,0.35)';
        ctx.strokeStyle = name === 'africa' ? 'rgba(100,160,80,0.5)' : 'rgba(80,110,90,0.25)';
        ctx.lineWidth   = name === 'africa' ? 1.5 : 0.8;
        ctx.fill(); ctx.stroke();
      });

      // Grid lines
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      for (let lat = -80; lat <= 80; lat += 20) {
        ctx.beginPath();
        const p1 = projectLL(-180, lat, cx, cy, r, earthRot);
        const p2 = projectLL(180, lat, cx, cy, r, earthRot);
        if (p1 && p2) { ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); }
        ctx.strokeStyle = 'rgba(122,162,247,0.4)'; ctx.lineWidth = 0.5; ctx.stroke();
      }
      for (let lon = -180; lon <= 180; lon += 20) {
        ctx.beginPath(); let first = true;
        for (let lat = -90; lat <= 90; lat += 6) {
          const p = projectLL(lon, lat, cx, cy, r, earthRot);
          if (!p) continue;
          first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          first = false;
        }
        ctx.strokeStyle = 'rgba(122,162,247,0.4)'; ctx.lineWidth = 0.5; ctx.stroke();
      }
      ctx.restore();

      // Specular + edge
      const sg = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 0, cx - r * 0.2, cy - r * 0.2, r * 0.6);
      sg.addColorStop(0, 'rgba(255,255,255,0.09)'); sg.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill();

      const eg = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r);
      eg.addColorStop(0, 'transparent'); eg.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = eg; ctx.fill();

      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(50,100,200,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
    }

    function drawMoon(mx: number, my: number, mr: number) {
      if (mr <= 0) return; // safety

      // Glow
      const gg = ctx.createRadialGradient(mx, my, safeR(mr * 0.5), mx, my, safeR(mr * 2.5));
      gg.addColorStop(0, 'rgba(180,180,210,0.18)'); gg.addColorStop(0.4, 'rgba(122,162,247,0.07)'); gg.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(mx, my, safeR(mr * 2.5), 0, Math.PI * 2); ctx.fillStyle = gg; ctx.fill();

      // Body
      const mb = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, safeR(mr * 0.1, 1), mx, my, mr);
      mb.addColorStop(0, '#D8E0EC'); mb.addColorStop(0.4, '#A0AABB'); mb.addColorStop(1, '#505870');
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fillStyle = mb; ctx.fill();

      // Craters
      ([[-0.28,-0.2,0.16],[0.3,0.12,0.11],[-0.08,0.35,0.09],[0.15,-0.38,0.07]] as [number,number,number][]).forEach(([dx,dy,cr]) => {
        const cr2 = safeR(cr * mr, 1);
        ctx.beginPath(); ctx.arc(mx + dx * mr, my + dy * mr, cr2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(30,35,50,0.45)'; ctx.fill();
        ctx.strokeStyle = 'rgba(80,90,110,0.3)'; ctx.lineWidth = 0.5; ctx.stroke();
      });

      // Shadow
      const sh = ctx.createRadialGradient(mx + mr * 0.4, my, safeR(mr * 0.4), mx + mr * 0.2, my, mr);
      sh.addColorStop(0, 'transparent'); sh.addColorStop(1, 'rgba(0,0,5,0.65)');
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fillStyle = sh; ctx.fill();
    }

    function spawnImpact(ip: {x:number;y:number}, r: number) {
      // Shockwaves
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          waves.push({ x: ip.x, y: ip.y, r: safeR(r * 0.05), alpha: 0.9, speed: 2 + i * 0.8, width: 2.5 - i * 0.4, col: '248,113,113' });
          waves.push({ x: ip.x, y: ip.y, r: safeR(r * 0.03), alpha: 0.6, speed: 1.2 + i * 0.6, width: 1, col: '251,191,36' });
        }, i * 140);
      }
      // Particles — r always positive from safeR
      for (let i = 0; i < 55; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 1 + Math.random() * 4;
        particles.push({
          x: ip.x, y: ip.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 2,
          r: safeR(1 + Math.random() * 2.5, 0.5),   // min 0.5px
          life: 50 + Math.random() * 50,
          maxLife: 100,
          col: Math.random() < 0.5 ? '248,113,113' : '251,146,60',
        });
      }
    }

    function drawWaves() {
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i];
        if (w.alpha < 0.01) { waves.splice(i, 1); continue; }
        // FIX: guard wave radius
        const wr = safeR(w.r);
        ctx.beginPath(); ctx.arc(w.x, w.y, wr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${w.col},${w.alpha})`;
        ctx.lineWidth = Math.max(0.5, w.width); ctx.stroke();
        w.r += w.speed;
        w.alpha *= 0.93;
      }
    }

    function drawParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // FIX: remove dead particles FIRST
        if (p.life <= 0) { particles.splice(i, 1); continue; }

        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.06; // gravity
        p.vx *= 0.98;
        p.life -= 1;

        // FIX: alpha and radius both clamped — can NEVER be negative
        const alpha = Math.max(0, p.life / p.maxLife);
        const drawR = safeR(p.r * alpha, 0.1);  // absolute minimum 0.1px

        ctx.beginPath();
        ctx.arc(p.x, p.y, drawR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.col},${alpha.toFixed(3)})`;
        ctx.fill();
      }
    }

    function draw() {
      if (!mounted) return;
      t += 0.015;
      earthRot += 0.005;

      const s = stepRef.current;
      const spd = 0.022;
      curSpread   = lerp(curSpread,   TARGET_SPREAD[s]   ?? 0, spd);
      curWall     = lerp(curWall,     TARGET_WALL[s]     ?? 0, spd);
      curInfect   = lerp(curInfect,   TARGET_INFECT[s]   ?? 0, spd);
      curMCB      = lerp(curMCB,      TARGET_MCB[s]      ?? 0, spd);
      curMoonProg = lerp(curMoonProg, TARGET_MOONPROG[s] ?? 0, spd * 0.5);

      // Trigger impact particles once
      if (s >= 1 && !impactDone && curMoonProg > 0.85) {
        impactDone = true;
        const W = canvas.width, H = canvas.height;
        const er = Math.min(W, H) * 0.32;
        const ip = getImpactPt(W / 2, H / 2 + er * 0.08, er, earthRot * 20);
        spawnImpact(ip, er);
      }
      if (s === 0) { impactDone = false; curMoonProg = lerp(curMoonProg, 0, 0.05); }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width, H = canvas.height;
      const CX = W / 2, CY = H / 2;
      const ER = Math.min(W, H) * 0.32;
      const earthCY = CY + ER * 0.08;

      // Space bg
      const bg = ctx.createRadialGradient(CX, CY * 0.5, 0, CX, CY, Math.max(W, H) * 0.8);
      bg.addColorStop(0, '#060A10'); bg.addColorStop(1, '#020408');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Stars
      stars.forEach(s2 => {
        const sa = 0.1 + Math.sin(t * s2.sp + s2.a) * 0.12;
        ctx.beginPath();
        ctx.arc(s2.x * W, s2.y * H, safeR(s2.r), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,230,243,${Math.max(0, sa)})`; ctx.fill();
      });

      drawEarth(CX, earthCY, ER);

      // Impact site position
      const ip = getImpactPt(CX, earthCY, ER, earthRot * 20);

      // Anomaly spread
      if (curSpread > 0.001) {
        const sr = safeR(curSpread * ER);
        const sg = ctx.createRadialGradient(ip.x, ip.y, 0, ip.x, ip.y, sr);
        sg.addColorStop(0, 'rgba(248,113,113,0.2)'); sg.addColorStop(0.5, 'rgba(251,146,60,0.1)'); sg.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(ip.x, ip.y, sr, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill();

        // Infection overlay
        if (curInfect > 0.01) {
          const ig = ctx.createRadialGradient(ip.x, ip.y, sr * 0.1, ip.x, ip.y, sr * 0.95);
          ig.addColorStop(0, 'transparent');
          ig.addColorStop(0.6, `rgba(251,191,36,${curInfect * 0.07})`);
          ig.addColorStop(1, `rgba(74,222,128,${curInfect * 0.04})`);
          ctx.beginPath(); ctx.arc(ip.x, ip.y, safeR(sr * 0.95), 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill();
        }

        // Spread border
        ctx.beginPath(); ctx.arc(ip.x, ip.y, sr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251,146,60,${0.25 + Math.sin(t * 2) * 0.08})`;
        ctx.lineWidth = 1; ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([]);

        // Creature emergence dots
        if (s >= 4) {
          for (let i = 0; i < 12; i++) {
            const ang = (i / 12) * Math.PI * 2 + t * 0.06;
            ctx.beginPath();
            ctx.arc(ip.x + Math.cos(ang) * sr * 0.78, ip.y + Math.sin(ang) * sr * 0.78, safeR(2.5), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(167,139,250,${0.5 + Math.sin(t * 3 + i) * 0.3})`; ctx.fill();
          }
        }
      }

      // Impact site marker
      if (s >= 1) {
        const ig2 = ctx.createRadialGradient(ip.x, ip.y, 0, ip.x, ip.y, safeR(ER * 0.1));
        ig2.addColorStop(0, 'rgba(248,113,113,0.45)'); ig2.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(ip.x, ip.y, safeR(ER * 0.1), 0, Math.PI * 2); ctx.fillStyle = ig2; ctx.fill();

        // Persistent pulse rings
        for (let i = 0; i < 3; i++) {
          const frac = ((t * 0.35 + i / 3) % 1);
          const rr = safeR(ER * (0.05 + frac * 0.18));
          ctx.beginPath(); ctx.arc(ip.x, ip.y, rr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(248,113,113,${(1 - frac) * 0.35})`; ctx.lineWidth = 1.5; ctx.stroke();
        }

        // Crosshair
        const hs = ER * 0.035;
        ctx.strokeStyle = 'rgba(248,113,113,0.9)'; ctx.lineWidth = 1.5;
        [[-hs, 0, hs, 0], [0, -hs, 0, hs]].forEach(([x1, y1, x2, y2]) => {
          ctx.beginPath(); ctx.moveTo(ip.x + x1, ip.y + y1); ctx.lineTo(ip.x + x2, ip.y + y2); ctx.stroke();
        });

        ctx.font = `${Math.max(7, ER * 0.055)}px 'Share Tech Mono',monospace`;
        ctx.fillStyle = 'rgba(248,113,113,0.8)'; ctx.textAlign = 'left';
        ctx.fillText('SECTOR OMEGA', ip.x + ER * 0.08, ip.y + ER * 0.02);
        ctx.fillText('IMPACT EPICENTER', ip.x + ER * 0.08, ip.y + ER * 0.06);
      }

      // Containment wall
      if (curWall > 0.01) {
        const wr = safeR(curWall * ER);
        const wg = ctx.createRadialGradient(ip.x, ip.y, safeR(wr * 0.85), ip.x, ip.y, safeR(wr * 1.12));
        wg.addColorStop(0, 'transparent');
        wg.addColorStop(0.5, `rgba(74,222,128,${curWall * 0.25})`);
        wg.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(ip.x, ip.y, safeR(wr * 1.12), 0, Math.PI * 2); ctx.fillStyle = wg; ctx.fill();

        ctx.beginPath(); ctx.arc(ip.x, ip.y, wr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(74,222,128,${curWall * 0.85 + Math.sin(t * 1.5) * 0.08})`;
        ctx.lineWidth = 3; ctx.stroke();

        // Tick marks
        for (let i = 0; i < 36; i++) {
          const ang = (i / 36) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(ip.x + Math.cos(ang) * (wr - 4), ip.y + Math.sin(ang) * (wr - 4));
          ctx.lineTo(ip.x + Math.cos(ang) * (wr + 4), ip.y + Math.sin(ang) * (wr + 4));
          ctx.strokeStyle = `rgba(74,222,128,${curWall * 0.5})`; ctx.lineWidth = 1; ctx.stroke();
        }

        ctx.font = `${Math.max(7, ER * 0.055)}px 'Share Tech Mono',monospace`;
        ctx.fillStyle = `rgba(74,222,128,${curWall * 0.75})`; ctx.textAlign = 'center';
        ctx.fillText('CONTAINMENT WALL — ALPHA-1', ip.x, ip.y - wr - 8);
      }

      // MCB nodes
      if (curMCB > 0.01) {
        const nodes: [number, number, string][] = [[-74, 40, 'MCB-NA'], [2, 48, 'MCB-EU'], [139, 35, 'MCB-AS'], [151, -33, 'MCB-AU']];
        nodes.forEach(([lon, lat, label]) => {
          const p2 = projectLL(lon, lat, CX, earthCY, ER, earthRot * 20);
          if (!p2 || p2.z < 0.2) return;
          const a = curMCB * p2.z;
          const pr = safeR(4);
          ctx.beginPath(); ctx.arc(p2.x, p2.y, pr, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(122,162,247,${a * 0.9})`; ctx.fill();
          const ringR = safeR(8 + Math.sin(t * 2 + lon) * 2);
          ctx.beginPath(); ctx.arc(p2.x, p2.y, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(122,162,247,${a * 0.35})`; ctx.lineWidth = 1; ctx.stroke();
          ctx.font = `7px 'Share Tech Mono',monospace`; ctx.fillStyle = `rgba(122,162,247,${a * 0.7})`; ctx.textAlign = 'center';
          ctx.fillText(label, p2.x, p2.y - 12);
        });
      }

      // Waves and particles
      drawWaves();
      drawParticles();

      // Moon
      const moonR = ER * 0.28;
      const moonTX = ip.x + ER * 0.1;
      const moonTY = ip.y - moonR;
      const moonSX = moonTX + ER * 0.3;
      const moonSY = ip.y - H * 0.5;
      const mp = Math.min(1, Math.max(0, curMoonProg));
      const mx = lerp(moonSX, moonTX, mp);
      const my = lerp(moonSY, moonTY, mp);

      if (mp < 0.97) {
        drawMoon(mx, my, safeR(moonR));
      } else {
        // Embedded — peek from surface
        ctx.save();
        ctx.beginPath(); ctx.arc(CX, earthCY, ER, 0, Math.PI * 2); ctx.clip();
        drawMoon(ip.x, ip.y + moonR * 0.3, safeR(moonR * 0.65));
        ctx.restore();
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      mounted = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []); // canvas loop runs once — reads step via ref

  return (
    <div className="min-h-[calc(100vh-52px)] flex flex-col pb-10">
      {/* Canvas */}
      <div className="relative h-[58vh] min-h-[320px]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-bg to-transparent pointer-events-none" />

        {/* Event overlay — top right */}
        <div className="absolute top-4 right-5 text-right space-y-1 max-w-[230px]">
          <p className="font-mono text-[10px] tracking-widest" style={{ color: EVENTS[step].col }}>
            {EVENTS[step].day}
          </p>
          <p className="font-sans text-lg font-bold tracking-widest uppercase text-text leading-tight">
            {EVENTS[step].title}
          </p>
          <p className="font-mono text-[10px] text-text-muted leading-relaxed">
            {EVENTS[step].sub}
          </p>
        </div>

        {/* Top-left coordinates */}
        <div className="absolute top-4 left-5 space-y-0.5">
          <p className="font-mono text-[9px] text-text-muted tracking-widest">IMPACT SITE</p>
          <p className="font-mono text-[10px] text-accent">CONGO BASIN, AFRICA</p>
          <p className="font-mono text-[9px] text-text-muted">1.2°N / 20.4°E</p>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-5">
        <p className="font-mono text-[9px] text-text-muted tracking-[0.3em] text-center uppercase">
          Navigate Incident Timeline
        </p>

        {/* Scrubber */}
        <div className="flex items-end gap-0.5">
          {EVENTS.map((e, i) => (
            <button key={i} onClick={() => goStep(i)} className="flex-1 flex flex-col items-center group relative">
              <div className={`h-1 w-full transition-all duration-300 ${i <= step ? 'opacity-100' : 'opacity-30'}`} style={{ background: i <= step ? e.col : '#1A2535' }} />
              <div className={`w-2.5 h-2.5 rotate-45 -mt-[5px] transition-all duration-300 ${i === step ? 'scale-125' : 'scale-90'}`}
                style={{ background: i === step ? e.col : i < step ? e.col + '80' : '#1A2535', boxShadow: i === step ? `0 0 8px ${e.col}80` : 'none' }} />
              <p className={`font-mono text-[8px] mt-2 tracking-widest transition-colors hidden sm:block ${i === step ? 'opacity-100' : 'opacity-40'}`}
                style={{ color: i === step ? e.col : '#4A5568' }}>
                {e.day}
              </p>
            </button>
          ))}
        </div>

        {/* Detail card */}
        <div className="panel p-4 space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold tracking-widest" style={{ color: EVENTS[step].col }}>{EVENTS[step].day}</span>
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[9px] text-text-muted">INCIDENT LOG</span>
          </div>
          <p className="font-sans text-lg font-bold tracking-widest uppercase text-text">{EVENTS[step].title}</p>
          <p className="font-mono text-xs text-text-dim leading-relaxed">{EVENTS[step].sub}</p>
        </div>

        {/* Nav */}
        <div className="flex gap-3">
          <button onClick={() => goStep(step - 1)} disabled={step === 0}
            className="mcb-btn-ghost flex-1 disabled:opacity-30">← PREV</button>
          <button onClick={() => goStep(step + 1)} disabled={step === EVENTS.length - 1}
            className="mcb-btn-primary flex-1 disabled:opacity-30">NEXT →</button>
        </div>

        <div className="flex gap-3">
          <Link href="/lore"  className="mcb-btn-ghost flex-1 text-center text-[10px]">← CLASSIFIED FILES</Link>
          <Link href="/apply" className="mcb-btn-primary flex-1 text-center text-[10px]">SUBMIT APPLICATION →</Link>
        </div>
      </div>
    </div>
  );
}
