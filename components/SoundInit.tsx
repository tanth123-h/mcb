/**
 * components/SoundInit.tsx
 * Thin client component that bootstraps the global sound engine.
 * Must be a Client Component to use hooks; kept minimal.
 */

'use client';

import { useSound } from '@/lib/hooks/useSound';

/** 
 * Renders nothing — side effect only.
 * Calling useSound() here wires up the global keypress listener
 * and restores mute state from localStorage.
 */
export default function SoundInit() {
  useSound(); // bootstraps the engine + keypress listener
  return null;
}
