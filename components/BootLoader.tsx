/**
 * components/BootLoader.tsx
 * Animated fake loading screen — used for immersive transitions.
 */

'use client';

import { useEffect, useState } from 'react';
import { generateBootLogs } from '@/lib/utils';

interface BootLoaderProps {
  onComplete: () => void;
  message?:   string;
  duration?:  number; // ms
}

export default function BootLoader({
  onComplete,
  message  = 'LOADING MCB SYSTEM...',
  duration = 2000,
}: BootLoaderProps) {
  const [logs,    setLogs]    = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [done,    setDone]    = useState(false);

  useEffect(() => {
    const allLogs = generateBootLogs(6);
    let i = 0;

    const logInterval = setInterval(() => {
      if (i < allLogs.length) {
        setLogs(prev => [...prev, allLogs[i]]);
        setProgress(Math.min(100, ((i + 1) / allLogs.length) * 100));
        i++;
      }
    }, duration / (allLogs.length + 1));

    const doneTimer = setTimeout(() => {
      clearInterval(logInterval);
      setProgress(100);
      setDone(true);
      setTimeout(onComplete, 300);
    }, duration);

    return () => {
      clearInterval(logInterval);
      clearTimeout(doneTimer);
    };
  }, [onComplete, duration]);

  return (
    <div className="fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center p-6">
      {/* Decorative frame */}
      <div className="w-full max-w-md border border-accent/30 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="font-mono text-xs text-accent tracking-widest">MCB SYSTEM INIT</span>
          <span className="font-mono text-[10px] text-text-muted">v4.2.1</span>
        </div>

        {/* Log lines */}
        <div className="space-y-1 min-h-[120px]">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center gap-2 animate-fadeIn">
              <span className="text-accent/60 font-mono text-[10px]">{'>'}</span>
              <span className="font-mono text-[11px] text-text-dim">{log}</span>
            </div>
          ))}
          {!done && (
            <div className="flex items-center gap-2">
              <span className="text-accent/60 font-mono text-[10px]">{'>'}</span>
              <span className="font-mono text-[11px] text-accent animate-blink">_</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-px bg-border overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between font-mono text-[10px] text-text-muted">
            <span>{message}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
