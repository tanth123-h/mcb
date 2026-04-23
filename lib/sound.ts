/**
 * lib/sound.ts
 * MCB Terminal Sound Engine
 * Pure Web Audio API — no external dependencies, no asset files.
 * All sounds are synthesized procedurally.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Master volume (0–1) */
let masterVolume = 0.4;
let muted = false;

export function setVolume(v: number) { masterVolume = Math.max(0, Math.min(1, v)); }
export function toggleMute() { muted = !muted; return muted; }
export function isMuted() { return muted; }

// ── Core oscillator helper ────────────────────────────────────────────────────

function playTone(opts: {
  frequency:  number;
  type?:      OscillatorType;
  duration:   number;   // seconds
  gain?:      number;   // 0–1
  attack?:    number;
  decay?:     number;
  detune?:    number;
  filterFreq?: number;
}) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;

  const {
    frequency, type = 'square', duration,
    gain = 0.3, attack = 0.002, decay = 0.05,
    detune = 0, filterFreq,
  } = opts;

  const now = c.currentTime;

  const osc = c.createOscillator();
  const gainNode = c.createGain();

  osc.type      = type;
  osc.frequency.setValueAtTime(frequency, now);
  osc.detune.setValueAtTime(detune, now);

  // Envelope
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(gain * masterVolume, now + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration + decay);

  if (filterFreq) {
    const filter = c.createBiquadFilter();
    filter.type            = 'lowpass';
    filter.frequency.value = filterFreq;
    osc.connect(filter);
    filter.connect(gainNode);
  } else {
    osc.connect(gainNode);
  }

  gainNode.connect(c.destination);

  osc.start(now);
  osc.stop(now + duration + decay + 0.05);
}

function playNoise(opts: {
  duration: number;
  gain?:    number;
  filterFreq?: number;
}) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;

  const { duration, gain = 0.1, filterFreq = 2000 } = opts;
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = c.createBufferSource();
  source.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type            = 'bandpass';
  filter.frequency.value = filterFreq;
  filter.Q.value         = 0.5;

  const gainNode = c.createGain();
  const now = c.currentTime;
  gainNode.gain.setValueAtTime(gain * masterVolume, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(c.destination);

  source.start(now);
  source.stop(now + duration + 0.05);
}

// ── Public sound API ──────────────────────────────────────────────────────────

/** Single keypress — short sharp click */
export function soundKeypress() {
  playTone({ frequency: 800, type: 'square', duration: 0.04, gain: 0.15, filterFreq: 1200 });
}

/** Enter key / confirm — slightly deeper */
export function soundEnter() {
  playTone({ frequency: 440, type: 'square', duration: 0.08, gain: 0.25, attack: 0.001 });
  setTimeout(() =>
    playTone({ frequency: 660, type: 'square', duration: 0.06, gain: 0.15 }), 60
  );
}

/** Error / denied */
export function soundError() {
  playTone({ frequency: 200, type: 'sawtooth', duration: 0.15, gain: 0.3 });
  setTimeout(() =>
    playTone({ frequency: 150, type: 'sawtooth', duration: 0.2, gain: 0.2 }), 120
  );
}

/** Success / access granted */
export function soundSuccess() {
  [523, 659, 784].forEach((f, i) =>
    setTimeout(() => playTone({ frequency: f, type: 'sine', duration: 0.12, gain: 0.25 }), i * 80)
  );
}

/** Alert / notification ping */
export function soundAlert() {
  playTone({ frequency: 1046, type: 'sine', duration: 0.1, gain: 0.3 });
  setTimeout(() =>
    playTone({ frequency: 880,  type: 'sine', duration: 0.15, gain: 0.2 }), 120
  );
}

/** Status change — dramatic */
export function soundStatusChange() {
  playNoise({ duration: 0.08, gain: 0.15, filterFreq: 3000 });
  setTimeout(() =>
    playTone({ frequency: 300, type: 'sawtooth', duration: 0.12, gain: 0.2 }), 80
  );
  setTimeout(() =>
    playTone({ frequency: 600, type: 'square', duration: 0.1, gain: 0.15 }), 180
  );
}

/** Boot / scan beep sequence */
export function soundScan() {
  const freqs = [440, 550, 440, 660];
  freqs.forEach((f, i) =>
    setTimeout(() => playTone({ frequency: f, type: 'square', duration: 0.05, gain: 0.15 }), i * 120)
  );
}

/** Glitch burst */
export function soundGlitch() {
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      playTone({
        frequency: 200 + Math.random() * 800,
        type:      'sawtooth',
        duration:  0.03,
        gain:      0.1,
      });
    }, i * 30);
  }
}

/** Hover beep — very subtle */
export function soundHover() {
  playTone({ frequency: 1200, type: 'sine', duration: 0.03, gain: 0.05 });
}
