/**
 * lib/hooks/useSound.ts
 * React hook wrapping the MCB sound engine.
 * Handles mute state persistence + keyboard sound injection.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import * as Sound from '@/lib/sound';

export function useSound() {
  const [muted, setMuted] = useState(false);

  // Persist mute state
  useEffect(() => {
    const stored = localStorage.getItem('mcb_muted');
    if (stored === 'true') {
      Sound.toggleMute();
      setMuted(true);
    }
  }, []);

  // Global keypress sound (captures all typing)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        Sound.soundEnter();
      } else if (e.key.length === 1 || e.key === 'Backspace') {
        Sound.soundKeypress();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleMute = useCallback(() => {
    const nowMuted = Sound.toggleMute();
    setMuted(nowMuted);
    localStorage.setItem('mcb_muted', String(nowMuted));
  }, []);

  return {
    muted,
    toggleMute,
    sounds: Sound,
  };
}

/**
 * useSoundButton — attach sound to any button/interactive element.
 * Usage: <button {...soundProps}>
 */
export function useSoundButton() {
  return {
    onMouseEnter: () => Sound.soundHover(),
    onClick:      () => Sound.soundEnter(),
  };
}
