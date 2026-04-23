/**
 * components/SoundToggle.tsx
 * Mute/unmute button for the MCB sound engine.
 * Designed to live in the top status bar.
 */

'use client';

import { useSound } from '@/lib/hooks/useSound';

export default function SoundToggle() {
  const { muted, toggleMute } = useSound();

  return (
    <button
      onClick={toggleMute}
      title={muted ? 'Enable sound' : 'Mute sound'}
      className="font-mono text-[10px] text-text-muted hover:text-accent transition-colors tracking-widest flex items-center gap-1"
    >
      {muted ? (
        <><span>◻</span><span className="hidden sm:inline">AUDIO:OFF</span></>
      ) : (
        <><span className="text-green-400/70">◼</span><span className="hidden sm:inline">AUDIO:ON</span></>
      )}
    </button>
  );
}
