'use client';
/**
 * StarField — full-viewport animated star canvas, fixed behind everything.
 * z-index 0 so content renders above it.
 */
import { useEffect, useRef } from 'react';

function safeR(r: number, min = 0.1) { return Math.max(min, Math.abs(r)); }

export default function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let mounted = true;

    const stars = Array.from({ length: 320 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: safeR(Math.random() * 1.6, 0.2),
      a: Math.random() * Math.PI * 2,
      sp: 0.002 + Math.random() * 0.006,
    }));

    function resize() {
      canvas!.width  = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!mounted) return;
      const w = canvas!.width, h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      stars.forEach(s => {
        s.a += s.sp;
        const alpha = Math.max(0, 0.15 + Math.sin(s.a) * 0.45);
        ctx!.beginPath();
        ctx!.arc(s.x * w, s.y * h, safeR(s.r), 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(210,228,255,${alpha})`;
        ctx!.fill();
      });

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      mounted = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
