// Web Audio API Zero-Dependency ASMR Synthesizer for Scribe Playground

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays an organic, soft tactile silicone "pop/tap" sound.
 * Evokes the feeling of pressing or threading silicone noodles into rubber grooves.
 */
export function playSiliconePop(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    // Frequency drop gives that satisfying silicone squish
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  } catch {}
}

/**
 * Plays a gentle, peaceful harmonic chime from a pentatonic scale.
 * Triggered when a path or section is completed.
 */
const PENTATONIC_FREQS = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6
let noteCounter = 0;

export function playGentleChime(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const freq = PENTATONIC_FREQS[noteCounter % PENTATONIC_FREQS.length];
    noteCounter++;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const oscHarmonic = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    oscHarmonic.type = 'triangle';
    oscHarmonic.frequency.setValueAtTime(freq * 2, now);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    osc.connect(gain);
    oscHarmonic.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    oscHarmonic.start(now);
    osc.stop(now + 0.85);
    oscHarmonic.stop(now + 0.85);
  } catch {}
}

/**
 * Plays a calming meditation singing bowl bell for when the break timer completes.
 */
export function playMeditationBell(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [261.63, 523.25, 784.88]; // Fundamental + warm harmonics

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const amp = idx === 0 ? 0.25 : 0.1 / idx;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 2.6);
    });
  } catch {}
}
