// Web Audio engine — reverse-engineered from rhythmicgeometry.com.
// Uses raw Web Audio API (no Tone.js). Oscillators with sine wave,
// short exponential envelopes, master gain + compressor.
// Frequencies mapped from color hue to a pentatonic scale.

import { colorToFreq, midiToFreq } from "./types";

type VoiceKind = "sine" | "triangle" | "square" | "sawtooth";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private comp: DynamicsCompressorNode | null = null;
  private muted = false;
  private lastFireByOrbit = new Map<string, number>();
  private fireCount = 0;
  private firstFireTime = 0;

  private ensure(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        (typeof window !== "undefined" &&
          ((window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)) ||
        undefined;
      if (!Ctor) throw new Error("Web Audio unavailable");
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.62;
      this.comp = this.ctx.createDynamicsCompressor();
      this.comp.threshold.value = -18;
      this.comp.knee.value = 18;
      this.comp.ratio.value = 12;
      this.comp.attack.value = 0.003;
      this.comp.release.value = 0.12;
      this.master.connect(this.comp);
      this.comp.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  resume() {
    try {
      this.ensure();
    } catch {
      // no-op
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.62, this.ctx.currentTime, 0.02);
    }
  }

  isMuted() {
    return this.muted;
  }

  close() {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.master = null;
      this.comp = null;
    }
    this.lastFireByOrbit.clear();
    this.fireCount = 0;
    this.firstFireTime = 0;
  }

  // Estimated fire rate (fires/sec) over the last 500ms window.
  private fireRate(): number {
    const now = performance.now();
    if (this.firstFireTime <= 0) this.firstFireTime = now;
    this.fireCount++;
    const elapsed = Math.max(1, now - this.firstFireTime);
    const rate = (this.fireCount / Math.max(100, elapsed)) * 1000;
    if (elapsed > 500) {
      this.fireCount = 0;
      this.firstFireTime = now;
    }
    return rate;
  }

  // Throttle per-orbit so a fast orbit does not flood the engine.
  private throttled(orbitId: string, rate: number): boolean {
    const now = performance.now();
    const minInterval = rate >= 220 ? 24 : rate >= 140 ? 14 : rate >= 70 ? 7 : 0;
    if (minInterval <= 0) return false;
    const last = this.lastFireByOrbit.get(orbitId) ?? 0;
    if (now - last < minInterval) return true;
    this.lastFireByOrbit.set(orbitId, now);
    return false;
  }

  // The original "blip" — a sine tone with a fast exponential envelope.
  blip(opts: {
    color?: string;
    freq?: number;
    orbitId: string;
    velocity?: number; // 1..N, higher = quieter (cap)
    kind?: VoiceKind;
    duration?: number;
  }) {
    if (this.muted) return;
    try {
      const ctx = this.ensure();
      const now = ctx.currentTime;
      const rate = this.fireRate();
      if (this.throttled(opts.orbitId, rate)) return;

      const freq = opts.freq ?? colorToFreq(opts.color ?? "#00FFAA");
      const velocity = Math.max(1, opts.velocity ?? 1);
      const peakAmp = Math.min(0.15, 0.15 / Math.sqrt(velocity));
      const duration = opts.duration ?? 0.1;

      const osc = ctx.createOscillator();
      osc.type = opts.kind ?? "sine";
      osc.frequency.setValueAtTime(freq, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peakAmp, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.master ?? ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // ignore
    }
  }

  // Drum-style hit for the Riff mode.
  drumHit(opts: {
    midi: number;
    color: string;
    accent: boolean;
    trackId: string;
  }) {
    if (this.muted) return;
    try {
      const ctx = this.ensure();
      const now = ctx.currentTime;
      const freq = midiToFreq(opts.midi);
      const peak = opts.accent ? 0.22 : 0.13;

      // Body (sine, fast decay)
      const osc = ctx.createOscillator();
      osc.type = opts.midi < 50 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now);
      if (opts.midi < 50) {
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.12);
      }
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.master ?? ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);

      // Click (noise burst) for higher pitches
      if (opts.midi >= 50) {
        const click = ctx.createOscillator();
        click.type = "square";
        click.frequency.setValueAtTime(freq * 4, now);
        const cg = ctx.createGain();
        cg.gain.setValueAtTime(0, now);
        cg.gain.linearRampToValueAtTime(peak * 0.3, now + 0.001);
        cg.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        click.connect(cg);
        cg.connect(this.master ?? ctx.destination);
        click.start(now);
        click.stop(now + 0.05);
      }
    } catch {
      // ignore
    }
  }
}

// Singleton — created lazily on the client.
let engine: AudioEngine | null = null;

export function getAudio(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}

export function closeAudio() {
  if (engine) {
    engine.close();
    engine = null;
  }
}
