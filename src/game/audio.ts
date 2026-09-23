/** Tiny 8-bit sound effects made with oscillators, so the site ships no audio files. */
let ctx: AudioContext | null = null;
let enabled = false;

export function setSound(on: boolean): void {
  enabled = on;
  if (on && !ctx) ctx = new AudioContext();
  if (on && ctx?.state === 'suspended') void ctx.resume();
}

function tone(type: OscillatorType, from: number, to: number, dur: number, vol = 0.08, delay = 0): void {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

export const sfx = {
  jump: () => tone('square', 260, 620, 0.16),
  lane: () => tone('square', 440, 520, 0.06, 0.05),
  crumb: () => {
    tone('square', 880, 880, 0.06, 0.06);
    tone('square', 1320, 1320, 0.1, 0.06, 0.06);
  },
  honk: () => {
    tone('sawtooth', 330, 320, 0.12, 0.05);
    tone('sawtooth', 330, 320, 0.18, 0.05, 0.16);
  },
  squeak: () => tone('square', 1400, 500, 0.28, 0.07),
  chop: () => tone('triangle', 180, 60, 0.2, 0.15),
  hi: () => tone('square', 700, 1100, 0.12, 0.05),
};
