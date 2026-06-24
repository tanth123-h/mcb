'use client';
/**
 * WorldMap — decorative SVG world map with MCB sector markers.
 * Simplified Robinson-like continent outlines, fixed proportions.
 */
import { useEffect, useState } from 'react';

interface Sector {
  id: string;
  label: string;
  x: string; // percentage
  y: string;
  status: 'active' | 'critical' | 'unknown';
  detail: string;
}

const SECTORS: Sector[] = [
  { id: 'OMEGA',  label: 'SECTOR OMEGA',   x: '51%', y: '56%', status: 'critical', detail: 'Congo Basin — Impact Epicenter' },
  { id: 'NA-1',   label: 'MCB-NA',         x: '20%', y: '35%', status: 'active',   detail: 'North American Command' },
  { id: 'EU-1',   label: 'MCB-EU',         x: '47%', y: '28%', status: 'active',   detail: 'European Bureau HQ' },
  { id: 'AS-1',   label: 'MCB-AS',         x: '72%', y: '35%', status: 'active',   detail: 'Asia-Pacific Division' },
  { id: 'AU-1',   label: 'MCB-AU',         x: '76%', y: '68%', status: 'active',   detail: 'Southern Command' },
  { id: 'SA-1',   label: 'MCB-SA',         x: '28%', y: '65%', status: 'unknown',  detail: 'South American Sector' },
];

const STATUS_COLORS = {
  active:   { dot: '#4ADE80', ring: 'rgba(74,222,128,0.3)', label: 'text-green-400' },
  critical: { dot: '#F87171', ring: 'rgba(248,113,113,0.4)', label: 'text-red-400' },
  unknown:  { dot: '#94A3B8', ring: 'rgba(148,163,184,0.2)', label: 'text-slate-400' },
};

export default function WorldMap({ className = '' }: { className?: string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPulse(p => p + 1), 50);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`relative w-full select-none ${className}`}>
      <svg
        viewBox="0 0 900 460"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 0 20px rgba(122,162,247,0.05))' }}
      >
        {/* Grid lines */}
        <defs>
          <pattern id="mapgrid" width="60" height="46" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 46" fill="none" stroke="rgba(122,162,247,0.04)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="omegaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F87171" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#F87171" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="900" height="460" fill="url(#mapgrid)" />

        {/* Simplified continent fills */}
        {/* North America */}
        <path d="M 90 60 L 140 55 L 190 60 L 220 80 L 240 100 L 250 130 L 240 160 L 220 190 L 200 220 L 180 240 L 160 260 L 140 270 L 120 260 L 100 240 L 85 210 L 75 180 L 70 150 L 75 120 L 80 90 Z"
          fill="rgba(50,80,60,0.25)" stroke="rgba(80,120,90,0.35)" strokeWidth="1"/>
        {/* South America */}
        <path d="M 180 280 L 210 270 L 240 275 L 255 295 L 260 320 L 255 350 L 240 375 L 220 395 L 195 400 L 175 385 L 160 360 L 155 335 L 158 310 Z"
          fill="rgba(50,80,60,0.2)" stroke="rgba(80,120,90,0.3)" strokeWidth="1"/>
        {/* Europe */}
        <path d="M 390 55 L 430 50 L 470 55 L 500 70 L 510 90 L 500 110 L 480 120 L 460 115 L 440 120 L 420 115 L 400 100 L 385 80 Z"
          fill="rgba(50,80,60,0.2)" stroke="rgba(80,120,90,0.3)" strokeWidth="1"/>
        {/* Africa */}
        <path d="M 420 130 L 460 125 L 500 135 L 520 160 L 525 200 L 515 240 L 500 275 L 480 300 L 455 315 L 430 310 L 410 290 L 395 260 L 390 225 L 392 190 L 400 160 Z"
          fill="rgba(70,100,55,0.3)" stroke="rgba(100,150,70,0.45)" strokeWidth="1.5"/>
        {/* Europe-Asia connector */}
        <path d="M 490 60 L 560 55 L 640 60 L 700 75 L 740 85 L 760 100 L 750 120 L 720 130 L 680 125 L 640 120 L 600 115 L 560 110 L 520 105 L 500 95 L 495 80 Z"
          fill="rgba(50,80,60,0.2)" stroke="rgba(80,120,90,0.3)" strokeWidth="1"/>
        {/* East Asia */}
        <path d="M 690 80 L 740 75 L 790 85 L 820 105 L 825 130 L 810 155 L 785 165 L 760 155 L 740 140 L 720 125 L 705 105 Z"
          fill="rgba(50,80,60,0.2)" stroke="rgba(80,120,90,0.3)" strokeWidth="1"/>
        {/* Australia */}
        <path d="M 690 310 L 740 305 L 790 315 L 820 335 L 825 360 L 810 380 L 780 385 L 750 375 L 720 360 L 700 340 Z"
          fill="rgba(50,80,60,0.2)" stroke="rgba(80,120,90,0.3)" strokeWidth="1"/>

        {/* Containment wall ring around Sector Omega */}
        <circle cx="459" cy="257" r="45"
          fill="none"
          stroke="rgba(248,113,113,0.25)"
          strokeWidth="1.5"
          strokeDasharray="4 3"/>
        <circle cx="459" cy="257" r="60"
          fill="none"
          stroke="rgba(248,113,113,0.12)"
          strokeWidth="1"
          strokeDasharray="2 4"/>

        {/* Sector markers */}
        {SECTORS.map((sector) => {
          const x = parseFloat(sector.x) / 100 * 900;
          const y = parseFloat(sector.y) / 100 * 460;
          const col = STATUS_COLORS[sector.status];
          const isHov = hovered === sector.id;
          const isOmega = sector.id === 'OMEGA';
          const pulseScale = isOmega ? 1 + Math.sin(pulse * 0.12) * 0.3 : 1 + Math.sin(pulse * 0.08 + x) * 0.2;

          return (
            <g key={sector.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(sector.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Pulse ring */}
              <circle cx={x} cy={y}
                r={isOmega ? 18 * pulseScale : 10 * pulseScale}
                fill="none"
                stroke={col.ring}
                strokeWidth={isOmega ? 1.5 : 1}
                opacity={0.6}
              />
              {/* Dot */}
              <circle cx={x} cy={y}
                r={isOmega ? 6 : 4}
                fill={col.dot}
                opacity={0.9}
              />
              {/* Crosshair for Omega */}
              {isOmega && (
                <>
                  <line x1={x - 12} y1={y} x2={x + 12} y2={y} stroke={col.dot} strokeWidth="0.8" opacity="0.6"/>
                  <line x1={x} y1={y - 12} x2={x} y2={y + 12} stroke={col.dot} strokeWidth="0.8" opacity="0.6"/>
                </>
              )}
              {/* Label */}
              <text x={x + (isOmega ? 10 : 8)} y={y - 4}
                fill={col.dot}
                fontSize={isOmega ? 8 : 7}
                fontFamily="'Share Tech Mono', monospace"
                opacity={isHov ? 1 : 0.7}
                letterSpacing="1"
              >
                {sector.label}
              </text>
              {/* Hover tooltip */}
              {isHov && (
                <g>
                  <rect x={x + 8} y={y + 4} width={120} height={16} rx="1"
                    fill="rgba(13,21,32,0.9)" stroke="rgba(122,162,247,0.3)" strokeWidth="0.5"/>
                  <text x={x + 12} y={y + 15}
                    fill="rgba(139,153,166,0.9)" fontSize="6.5"
                    fontFamily="'Share Tech Mono', monospace">
                    {sector.detail}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Border frame */}
        <rect x="1" y="1" width="898" height="458"
          fill="none" stroke="rgba(122,162,247,0.08)" strokeWidth="1"/>

        {/* Corner ticks */}
        {[[0,0,14,0,0,14],[900,0,-14,0,0,14],[0,460,14,0,0,-14],[900,460,-14,0,0,-14]].map(([ox,oy,dx1,dy1,dx2,dy2],i) => (
          <g key={i}>
            <line x1={ox} y1={oy} x2={ox+dx1} y2={oy+dy1} stroke="rgba(122,162,247,0.3)" strokeWidth="1"/>
            <line x1={ox} y1={oy} x2={ox+dx2} y2={oy+dy2} stroke="rgba(122,162,247,0.3)" strokeWidth="1"/>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-3 flex items-center gap-3">
        {(['active','critical','unknown'] as const).map(s => (
          <div key={s} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: STATUS_COLORS[s].dot }}/>
            <span className="font-mono text-[8px] text-text-muted tracking-widest uppercase">{s}</span>
          </div>
        ))}
      </div>

      {/* Top-right label */}
      <div className="absolute top-2 right-3">
        <span className="font-mono text-[8px] text-accent/40 tracking-[0.3em]">GLOBAL SURVEILLANCE // LIVE</span>
      </div>
    </div>
  );
}
