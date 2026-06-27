// Upgraded Web Audio engine — reverse-engineered from rhythmicgeometry.com
// and pushed to a proper synth. Now uses the 5 TONE_PRESETS verbatim
// from the original bundle (Glass / Deep / Rain / Dream / Warm) with their
// exact keyCenter, noteSet, reverb, delay, filter and warmth values.
//
// Voice stack:
//   - Stacked oscillators (sine + triangle + sub) for richer timbre
//   - Per-voice lowpass filter with envelope
//   - Convolver reverb with synthesized impulse response
//   - Stereo delay/echo with feedback
//   - Master compressor + limiter
//   - Analyser for visual feedback (FFT)
//   - Drum synthesis (kick with pitch drop, snare with noise burst, hat with filtered noise)

import { colorToFreq, midiToFreq } from "./types";
import { TONE_PRESETS, type TonePreset, type Cycle } from "./presets";

type CycleType = Cycle["type"];

const PENTATONIC_FREQS = [
  130.81, 146.83, 164.81, 196.0, 220.0,
  261.63, 293.66, 329.63, 392.0, 440.0,
  523.25, 587.33, 659.25, 783.99, 880.0,
  1046.5, 1174.66, 1318.51, 1567.98, 1760.0,
];

const SCALES: Record<string, number[]> = {
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  wholeTone: [0, 2, 4, 6, 8, 10],
  diminished: [0, 2, 3, 5, 6, 8, 9, 11],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

export interface AudioSettings {
  masterVolume: number; // 0..1
  reverbAmount: number; // 0..1 wet
  delayAmount: number; // 0..1 wet
  delayTime: number; // seconds (0.05..0.7)
  delayFeedback: number; // 0..0.85
  filterCutoff: number; // Hz (200..8000)
  filterResonance: number; // 0..12 Q
  attack: number; // seconds (0.001..0.05)
  release: number; // seconds (0.05..1.2)
  subOsc: boolean; // add sub oscillator an octave below
  triangleLayer: boolean; // add triangle layer above
  scale: keyof typeof SCALES;
  rootNote: number; // 0..11 (C=0)
  muted: boolean;
  tonePresetId: string; // one of TONE_PRESETS — overrides reverb/delay/filter when applied
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 0.7,
  reverbAmount: 0.32,
  delayAmount: 0.22,
  delayTime: 0.28,
  delayFeedback: 0.4,
  filterCutoff: 4200,
  filterResonance: 1.2,
  attack: 0.004,
  release: 0.42,
  subOsc: true,
  triangleLayer: true,
  scale: "majorPentatonic",
  rootNote: 0,
  muted: false,
  tonePresetId: "glass",
};

// Build a synthesized impulse response for the convolver.
// Exponential decay noise — gives a smooth "hall" reverb.
function buildImpulse(ctx: AudioContext, seconds = 2.4, decay = 2.5): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * seconds));
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      // Slight pre-delay + exponential decay + stereo decorrelation
      const env = Math.pow(1 - t, decay);
      data[i] = (Math.random() * 2 - 1) * env;
    }
  }
  return buf;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private comp: DynamicsCompressorNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbWet: GainNode | null = null;
  private reverbDry: GainNode | null = null;
  private delay: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayWet: GainNode | null = null;
  private delayDry: GainNode | null = null;
  private stereo: ChannelStereoNode | null = null;
  private analyser: AnalyserNode | null = null;
  private fftData: Uint8Array<ArrayBuffer> | null = null;
  private waveformData: Uint8Array<ArrayBuffer> | null = null;

  private settings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };

  private lastFireByVoice = new Map<string, number>();
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

      // ---- Master chain ----
      this.master = this.ctx.createGain();
      this.master.gain.value = this.settings.masterVolume;

      this.comp = this.ctx.createDynamicsCompressor();
      this.comp.threshold.value = -18;
      this.comp.knee.value = 18;
      this.comp.ratio.value = 12;
      this.comp.attack.value = 0.003;
      this.comp.release.value = 0.12;

      this.limiter = this.ctx.createDynamicsCompressor();
      this.limiter.threshold.value = -3;
      this.limiter.knee.value = 0;
      this.limiter.ratio.value = 20;
      this.limiter.attack.value = 0.001;
      this.limiter.release.value = 0.05;

      // ---- Reverb (parallel wet/dry) ----
      this.reverb = this.ctx.createConvolver();
      this.reverb.buffer = buildImpulse(this.ctx, 2.6, 2.4);
      this.reverbWet = this.ctx.createGain();
      this.reverbWet.gain.value = this.settings.reverbAmount;
      this.reverbDry = this.ctx.createGain();
      this.reverbDry.gain.value = 1 - this.settings.reverbAmount * 0.5;

      // ---- Delay (stereo echo) ----
      this.delay = this.ctx.createDelay(2.0);
      this.delay.delayTime.value = this.settings.delayTime;
      this.delayFeedback = this.ctx.createGain();
      this.delayFeedback.gain.value = this.settings.delayFeedback;
      this.delayWet = this.ctx.createGain();
      this.delayWet.gain.value = this.settings.delayAmount;
      this.delayDry = this.ctx.createGain();
      this.delayDry.gain.value = 1 - this.settings.delayAmount * 0.5;
      this.delay.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delay);

      // ---- Stereo widener (Merger after two panned gains) ----
      this.stereo = createStereoWidener(this.ctx);

      // ---- Analyser ----
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.78;
      this.fftData = new Uint8Array(this.analyser.frequencyBinCount);
      this.waveformData = new Uint8Array(this.analyser.fftSize);

      // Connect: voices -> master -> [reverb parallel] -> [delay parallel] -> stereo -> comp -> limiter -> analyser -> destination
      // Voices connect into master. Master feeds three parallel paths (dry, reverb, delay) which sum back into stereo.
      this.master.connect(this.reverbDry);
      this.master.connect(this.reverb);
      this.reverb.connect(this.reverbWet);
      this.master.connect(this.delay);
      this.delay.connect(this.delayWet);

      // Sum dry + wet into stereo input
      this.reverbDry.connect(this.stereo.input);
      this.reverbWet.connect(this.stereo.input);
      this.delayDry.connect(this.stereo.input);
      this.delayWet.connect(this.stereo.input);

      this.stereo.output.connect(this.comp);
      this.comp.connect(this.limiter);
      this.limiter.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
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

  setSettings(patch: Partial<AudioSettings>) {
    const prev = this.settings;
    this.settings = { ...prev, ...patch };
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (patch.masterVolume !== undefined && this.master) {
      this.master.gain.setTargetAtTime(patch.masterVolume, now, 0.02);
    }
    if (patch.reverbAmount !== undefined && this.reverbWet) {
      this.reverbWet.gain.setTargetAtTime(patch.reverbAmount, now, 0.04);
      this.reverbDry?.gain.setTargetAtTime(1 - patch.reverbAmount * 0.5, now, 0.04);
    }
    if (patch.delayAmount !== undefined && this.delayWet) {
      this.delayWet.gain.setTargetAtTime(patch.delayAmount, now, 0.04);
      this.delayDry?.gain.setTargetAtTime(1 - patch.delayAmount * 0.5, now, 0.04);
    }
    if (patch.delayTime !== undefined && this.delay) {
      this.delay.delayTime.setTargetAtTime(patch.delayTime, now, 0.05);
    }
    if (patch.delayFeedback !== undefined && this.delayFeedback) {
      this.delayFeedback.gain.setTargetAtTime(patch.delayFeedback, now, 0.05);
    }
    if (patch.muted !== undefined && this.master) {
      this.master.gain.setTargetAtTime(patch.muted ? 0 : this.settings.masterVolume, now, 0.02);
    }
  }

  // Apply one of the 5 verbatim TonePresets from the original bundle.
  // Maps the preset's reverb/delay/filter values directly into audio settings.
  applyTonePreset(preset: TonePreset) {
    this.setSettings({
      tonePresetId: preset.id,
      reverbAmount: preset.reverb,
      delayAmount: preset.delay,
      filterCutoff: preset.filter,
      // warmth maps onto subOsc + triangle layer: warm presets keep both on,
      // bright presets drop the sub. padMix maps onto release length.
      subOsc: preset.warmth > 0.55,
      triangleLayer: true,
      release: 0.25 + preset.padMix * 0.6,
      attack: 0.004,
    });
  }

  // Resolve a MIDI note from a noteIndex into the active TonePreset's noteSet.
  noteIndexToMidi(noteIndex: number): number {
    const preset =
      TONE_PRESETS.find((p) => p.id === this.settings.tonePresetId) ?? TONE_PRESETS[0];
    const offset = preset.noteSet[noteIndex % preset.noteSet.length] ?? 0;
    const octave = Math.floor(noteIndex / preset.noteSet.length);
    return preset.keyCenter + offset + octave * 12;
  }

  getSettings(): AudioSettings {
    return this.settings;
  }

  close() {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.master = null;
      this.comp = null;
      this.limiter = null;
      this.reverb = null;
      this.reverbWet = null;
      this.reverbDry = null;
      this.delay = null;
      this.delayFeedback = null;
      this.delayWet = null;
      this.delayDry = null;
      this.stereo = null;
      this.analyser = null;
    }
    this.lastFireByVoice.clear();
    this.fireCount = 0;
    this.firstFireTime = 0;
  }

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

  private throttled(voiceId: string, rate: number): boolean {
    const now = performance.now();
    const minInterval = rate >= 220 ? 18 : rate >= 140 ? 10 : rate >= 70 ? 5 : 0;
    if (minInterval <= 0) return false;
    const last = this.lastFireByVoice.get(voiceId) ?? 0;
    if (now - last < minInterval) return true;
    this.lastFireByVoice.set(voiceId, now);
    return false;
  }

  // Convert a hex color into a frequency using the active scale + root.
  colorToScaleFreq(color: string): number {
    const hue = hexToHue01(color);
    const scale = SCALES[this.settings.scale] ?? SCALES.majorPentatonic;
    const octaveCount = Math.floor(PENTATONIC_FREQS.length / scale.length);
    const idxInScale = Math.floor(hue * scale.length * octaveCount);
    const octave = Math.floor(idxInScale / scale.length);
    const degree = idxInScale % scale.length;
    const semitones = scale[degree] + octave * 12 + this.settings.rootNote;
    // Use A4 (440Hz, MIDI 69) as reference
    return 440 * Math.pow(2, (semitones - 69 + 12) / 12);
  }

  // The main "blip" — a stacked synth voice with filter envelope.
  // If `noteIndex` is supplied, resolves through the active TonePreset's noteSet.
  blip(opts: {
    color?: string;
    freq?: number;
    noteIndex?: number;
    voiceId: string;
    velocity?: number;
    duration?: number;
    pan?: number; // -1..1
    type?: CycleType;
  }) {
    if (this.settings.muted) return;
    try {
      const ctx = this.ensure();
      const now = ctx.currentTime;
      const rate = this.fireRate();
      if (this.throttled(opts.voiceId, rate)) return;

      // Resolve frequency: explicit > noteIndex (via TonePreset) > color hue
      let freq: number;
      if (opts.freq) {
        freq = opts.freq;
      } else if (typeof opts.noteIndex === "number") {
        freq = midiToFreq(this.noteIndexToMidi(opts.noteIndex));
      } else {
        freq = this.colorToScaleFreq(opts.color ?? "#00FFAA");
      }

      const type = opts.type ?? "tone";
      const velocity = Math.max(1, opts.velocity ?? 1);
      // Type-based amplitude/timbre tweaks (mirrors the original `yr` defaults)
      const typeBoost = type === "bass" ? 1.4 : type === "spark" ? 0.55 : type === "ghost" ? 0.35 : 1;
      const peakAmp = Math.min(0.28, (0.22 / Math.sqrt(velocity)) * typeBoost);
      const duration = opts.duration ?? this.settings.release;
      const pan = opts.pan ?? 0;
      const attack = this.settings.attack;

      // Bass voices: drop an octave
      if (type === "bass") freq *= 0.5;
      // Spark voices: bump an octave
      if (type === "spark") freq *= 2;

      // ---- Voice bus ----
      const voiceBus = ctx.createGain();
      voiceBus.gain.value = 0;

      // Per-voice lowpass filter with envelope
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = this.settings.filterResonance;
      const cutoffStart = this.settings.filterCutoff * 2.2;
      const cutoffEnd = this.settings.filterCutoff;
      filter.frequency.setValueAtTime(cutoffStart, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(120, cutoffEnd), now + duration * 0.7);

      // Panner
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;

      // Stack oscillators
      const oscs: OscillatorNode[] = [];
      // 1) Sine (fundamental)
      const sine = ctx.createOscillator();
      sine.type = "sine";
      sine.frequency.setValueAtTime(freq, now);
      oscs.push(sine);
      // 2) Triangle an octave up (airy layer)
      if (this.settings.triangleLayer) {
        const tri = ctx.createOscillator();
        tri.type = "triangle";
        tri.frequency.setValueAtTime(freq * 2, now);
        const triGain = ctx.createGain();
        triGain.gain.value = 0.18;
        tri.connect(triGain);
        triGain.connect(filter);
        oscs.push(tri);
      }
      // 3) Sub an octave below
      if (this.settings.subOsc) {
        const sub = ctx.createOscillator();
        sub.type = "sine";
        sub.frequency.setValueAtTime(freq * 0.5, now);
        const subGain = ctx.createGain();
        subGain.gain.value = 0.4;
        sub.connect(subGain);
        subGain.connect(filter);
        oscs.push(sub);
      }

      // Main sine gain
      const sineGain = ctx.createGain();
      sineGain.gain.value = 0.6;
      sine.connect(sineGain);
      sineGain.connect(filter);

      // Amp envelope
      voiceBus.gain.setValueAtTime(0, now);
      voiceBus.gain.linearRampToValueAtTime(peakAmp, now + attack);
      voiceBus.gain.exponentialRampToValueAtTime(0.001, now + duration);

      filter.connect(voiceBus);
      voiceBus.connect(panner);
      panner.connect(this.master ?? ctx.destination);

      for (const o of oscs) {
        o.start(now);
        o.stop(now + duration + 0.05);
      }
    } catch {
      // ignore
    }
  }

  // Drum-style hit — synthesized kick / snare / hat based on pitch range.
  drumHit(opts: {
    midi: number;
    color: string;
    accent: boolean;
    trackId: string;
    pan?: number;
  }) {
    if (this.settings.muted) return;
    try {
      const ctx = this.ensure();
      const now = ctx.currentTime;
      const pan = opts.pan ?? 0;
      const peak = opts.accent ? 0.32 : 0.2;
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      panner.connect(this.master ?? ctx.destination);

      if (opts.midi < 50) {
        // ---- KICK ---- sine with pitch drop + click
        const osc = ctx.createOscillator();
        osc.type = "sine";
        const startFreq = midiToFreq(opts.midi) * 2.4;
        const endFreq = midiToFreq(opts.midi) * 0.6;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + 0.14);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(peak, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        // Click transient
        const click = ctx.createOscillator();
        click.type = "square";
        click.frequency.setValueAtTime(startFreq * 4, now);
        const cg = ctx.createGain();
        cg.gain.setValueAtTime(0, now);
        cg.gain.linearRampToValueAtTime(peak * 0.35, now + 0.001);
        cg.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(panner);
        click.connect(cg);
        cg.connect(panner);
        osc.start(now);
        osc.stop(now + 0.36);
        click.start(now);
        click.stop(now + 0.05);
      } else if (opts.midi < 70) {
        // ---- SNARE ---- noise burst + tone
        const noiseBuf = this.getNoiseBuffer();
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const nf = ctx.createBiquadFilter();
        nf.type = "highpass";
        nf.frequency.value = 1500;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0, now);
        ng.gain.linearRampToValueAtTime(peak * 0.9, now + 0.003);
        ng.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        noise.connect(nf);
        nf.connect(ng);
        ng.connect(panner);

        const tone = ctx.createOscillator();
        tone.type = "triangle";
        tone.frequency.setValueAtTime(midiToFreq(opts.midi), now);
        const tg = ctx.createGain();
        tg.gain.setValueAtTime(0, now);
        tg.gain.linearRampToValueAtTime(peak * 0.5, now + 0.003);
        tg.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        tone.connect(tg);
        tg.connect(panner);

        noise.start(now);
        noise.stop(now + 0.2);
        tone.start(now);
        tone.stop(now + 0.15);
      } else {
        // ---- HAT ---- filtered noise burst, short
        const noiseBuf = this.getNoiseBuffer();
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const nf = ctx.createBiquadFilter();
        nf.type = "highpass";
        nf.frequency.value = 6000;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0, now);
        ng.gain.linearRampToValueAtTime(peak * 0.7, now + 0.001);
        ng.gain.exponentialRampToValueAtTime(0.001, now + (opts.accent ? 0.12 : 0.06));
        noise.connect(nf);
        nf.connect(ng);
        ng.connect(panner);
        noise.start(now);
        noise.stop(now + 0.15);
      }
    } catch {
      // ignore
    }
  }

  private noiseBuf: AudioBuffer | null = null;
  private getNoiseBuffer(): AudioBuffer {
    if (this.noiseBuf) return this.noiseBuf;
    const ctx = this.ensure();
    const len = ctx.sampleRate * 1.0;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    return buf;
  }

  // ---- Analyser API ----
  getFFT(): Uint8Array<ArrayBuffer> | null {
    if (!this.analyser || !this.fftData) return null;
    this.analyser.getByteFrequencyData(this.fftData);
    return this.fftData;
  }
  getWaveform(): Uint8Array<ArrayBuffer> | null {
    if (!this.analyser || !this.waveformData) return null;
    this.analyser.getByteTimeDomainData(this.waveformData);
    return this.waveformData;
  }
  getLevel(): number {
    const fft = this.getFFT();
    if (!fft) return 0;
    let sum = 0;
    for (let i = 0; i < fft.length; i++) sum += fft[i];
    return sum / fft.length / 255;
  }
}

// ---- helpers ----

function hexToHue01(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return h;
}

// Stereo widener: split signal into L/R and apply slight delay + mid-side trick.
interface ChannelStereoNode {
  input: GainNode;
  output: GainNode;
}

function createStereoWidener(ctx: AudioContext): ChannelStereoNode {
  const input = ctx.createGain();
  const output = ctx.createGain();

  // Split into two panned channels
  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);
  const leftGain = ctx.createGain();
  const rightGain = ctx.createGain();
  const leftDelay = ctx.createDelay(0.05);
  leftDelay.delayTime.value = 0.012; // haas effect
  leftGain.gain.value = 0.95;
  rightGain.gain.value = 0.95;

  // Mid-side: keep mono core + slight haas on left
  input.connect(splitter);
  splitter.connect(leftGain, 0);
  splitter.connect(rightGain, 1);
  leftGain.connect(leftDelay);
  leftDelay.connect(merger, 0, 0);
  rightGain.connect(merger, 0, 1);
  merger.connect(output);
  // Also pass mono through to preserve center
  input.connect(output);

  return { input, output };
}

// Singleton
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

export { SCALES, PENTATONIC_FREQS };
