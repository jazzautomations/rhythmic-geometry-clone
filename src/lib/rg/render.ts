// Offline renderer — uses OfflineAudioContext to render a scene to a WAV file.
// Reuses the same audio chain (reverb + delay + comp + limiter) as the live
// AudioEngine, but runs faster than realtime (no throttling, no analyser).

import { midiToFreq } from "./types";
import { TONE_PRESETS, type TonePreset, type Cycle } from "./presets";
import type { AudioSettings } from "./audio";
import { SCALES } from "./audio";
import { audioBufferToWav, downloadBlob } from "./wav";

// Build a synthesized impulse response (same as live engine).
function buildImpulse(ctx: OfflineAudioContext, seconds: number, decay: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * seconds));
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.pow(1 - t, decay);
      data[i] = (Math.random() * 2 - 1) * env;
    }
  }
  return buf;
}

// RenderEngine — parallel to AudioEngine but for offline rendering.
export class RenderEngine {
  ctx: OfflineAudioContext;
  master: GainNode;
  comp: DynamicsCompressorNode;
  limiter: DynamicsCompressorNode;
  reverb: ConvolverNode;
  reverbWet: GainNode;
  reverbDry: GainNode;
  delay: DelayNode;
  delayFeedback: GainNode;
  delayWet: GainNode;
  delayDry: GainNode;
  settings: AudioSettings;
  private noiseBuf: AudioBuffer | null = null;

  constructor(ctx: OfflineAudioContext, settings: AudioSettings) {
    this.ctx = ctx;
    this.settings = { ...settings, muted: false };

    this.master = ctx.createGain();
    this.master.gain.value = settings.masterVolume;

    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -18;
    this.comp.knee.value = 18;
    this.comp.ratio.value = 12;
    this.comp.attack.value = 0.003;
    this.comp.release.value = 0.12;

    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -3;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.001;
    this.limiter.release.value = 0.05;

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = buildImpulse(ctx, 2.6, 2.4);
    this.reverbWet = ctx.createGain();
    this.reverbWet.gain.value = settings.reverbAmount;
    this.reverbDry = ctx.createGain();
    this.reverbDry.gain.value = 1 - settings.reverbAmount * 0.5;

    this.delay = ctx.createDelay(2.0);
    this.delay.delayTime.value = settings.delayTime;
    this.delayFeedback = ctx.createGain();
    this.delayFeedback.gain.value = settings.delayFeedback;
    this.delayWet = ctx.createGain();
    this.delayWet.gain.value = settings.delayAmount;
    this.delayDry = ctx.createGain();
    this.delayDry.gain.value = 1 - settings.delayAmount * 0.5;
    this.delay.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delay);

    // Voices -> master -> 3 parallel paths -> master destination chain
    this.master.connect(this.reverbDry);
    this.master.connect(this.reverb);
    this.reverb.connect(this.reverbWet);
    this.master.connect(this.delay);
    this.delay.connect(this.delayWet);

    this.reverbDry.connect(this.comp);
    this.reverbWet.connect(this.comp);
    this.delayDry.connect(this.comp);
    this.delayWet.connect(this.comp);

    this.comp.connect(this.limiter);
    this.limiter.connect(ctx.destination);
  }

  // Resolve a MIDI note from a noteIndex into the active TonePreset's noteSet.
  noteIndexToMidi(noteIndex: number): number {
    const preset = TONE_PRESETS.find((p) => p.id === this.settings.tonePresetId) ?? TONE_PRESETS[0];
    const offset = preset.noteSet[noteIndex % preset.noteSet.length] ?? 0;
    const octave = Math.floor(noteIndex / preset.noteSet.length);
    return preset.keyCenter + offset + octave * 12;
  }

  colorToScaleFreq(color: string): number {
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
      const d = max - min;
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    const scale = SCALES[this.settings.scale] ?? SCALES.majorPentatonic;
    const PENTATONIC = [130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0];
    const octaveCount = Math.floor(PENTATONIC.length / scale.length);
    const idxInScale = Math.floor(h * scale.length * octaveCount);
    const octave = Math.floor(idxInScale / scale.length);
    const degree = idxInScale % scale.length;
    const semitones = scale[degree] + octave * 12 + this.settings.rootNote;
    return 440 * Math.pow(2, (semitones - 69 + 12) / 12);
  }

  applyTonePreset(preset: TonePreset) {
    this.settings.reverbAmount = preset.reverb;
    this.settings.delayAmount = preset.delay;
    this.settings.filterCutoff = preset.filter;
    this.settings.subOsc = preset.warmth > 0.55;
    this.settings.release = 0.25 + preset.padMix * 0.6;
    this.reverbWet.gain.value = preset.reverb;
    this.reverbDry.gain.value = 1 - preset.reverb * 0.5;
    this.delayWet.gain.value = preset.delay;
    this.delayDry.gain.value = 1 - preset.delay * 0.5;
  }

  blip(opts: {
    color?: string;
    freq?: number;
    noteIndex?: number;
    voiceId: string;
    velocity?: number;
    duration?: number;
    pan?: number;
    type?: Cycle["type"];
    when: number; // required for offline
  }) {
    try {
      const ctx = this.ctx;
      const now = opts.when;

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
      const typeBoost = type === "bass" ? 1.4 : type === "spark" ? 0.55 : type === "ghost" ? 0.35 : 1;
      const peakAmp = Math.min(0.28, (0.22 / Math.sqrt(velocity)) * typeBoost);
      const duration = opts.duration ?? this.settings.release;
      const pan = opts.pan ?? 0;
      const attack = this.settings.attack;

      if (type === "bass") freq *= 0.5;
      if (type === "spark") freq *= 2;

      const voiceBus = ctx.createGain();
      voiceBus.gain.value = 0;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = this.settings.filterResonance;
      filter.frequency.setValueAtTime(this.settings.filterCutoff * 2.2, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(120, this.settings.filterCutoff), now + duration * 0.7);

      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;

      const oscs: OscillatorNode[] = [];
      const sine = ctx.createOscillator();
      sine.type = "sine";
      sine.frequency.setValueAtTime(freq, now);
      oscs.push(sine);
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

      const sineGain = ctx.createGain();
      sineGain.gain.value = 0.6;
      sine.connect(sineGain);
      sineGain.connect(filter);

      voiceBus.gain.setValueAtTime(0, now);
      voiceBus.gain.linearRampToValueAtTime(peakAmp, now + attack);
      voiceBus.gain.exponentialRampToValueAtTime(0.001, now + duration);

      filter.connect(voiceBus);
      voiceBus.connect(panner);
      panner.connect(this.master);

      for (const o of oscs) {
        o.start(now);
        o.stop(now + duration + 0.05);
      }
    } catch {
      // ignore
    }
  }

  drumHit(opts: {
    midi: number;
    color: string;
    accent: boolean;
    trackId: string;
    pan?: number;
    when: number;
  }) {
    try {
      const ctx = this.ctx;
      const now = opts.when;
      const pan = opts.pan ?? 0;
      const peak = opts.accent ? 0.32 : 0.2;
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      panner.connect(this.master);

      if (opts.midi < 50) {
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

  private getNoiseBuffer(): AudioBuffer {
    if (this.noiseBuf) return this.noiseBuf;
    const ctx = this.ctx;
    const len = ctx.sampleRate * 1.0;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    return buf;
  }
}

// ---- Scene renderers ----

import type { OrbitScenePreset } from "./presets";
import type { StudyScene, RiffScene } from "./types";
import { lcm } from "./types";

export interface RenderOptions {
  durationSec?: number; // override default
  tailSec?: number; // reverb tail after last event
  sampleRate?: number;
  filename?: string;
  onProgress?: (frac: number) => void;
}

// Render an Orbit scene to WAV.
export async function renderOrbitToWav(
  scene: OrbitScenePreset,
  settings: AudioSettings,
  opts: RenderOptions = {},
): Promise<Blob> {
  const bpm = scene.tempo;
  const speed = 1;
  const cyclesPerSec = (bpm / 60) * speed;
  // Default: render 1 full cycle (cycleSeconds), with a 2.5s tail for reverb
  const cycleSec = scene.cycleSeconds;
  const durationSec = opts.durationSec ?? cycleSec;
  const tailSec = opts.tailSec ?? 2.5;
  const totalSec = durationSec + tailSec;
  const sampleRate = opts.sampleRate ?? 44100;

  const ctx = new OfflineAudioContext(2, Math.ceil(totalSec * sampleRate), sampleRate);
  const engine = new RenderEngine(ctx, settings);
  const tone = TONE_PRESETS.find((t) => t.id === scene.soundId);
  if (tone) engine.applyTonePreset(tone);

  // Schedule all pulses for each cycle
  for (let i = 0; i < scene.cycles.length; i++) {
    const c = scene.cycles[i];
    if (c.pulseCount <= 0) continue;
    const pulseIntervalSec = 1 / (cyclesPerSec * c.pulseCount);
    const startOffset = (c.phase ?? 0) / cyclesPerSec;
    let p = 0;
    while (true) {
      const t = p * pulseIntervalSec + startOffset;
      if (t >= durationSec) break;
      engine.blip({
        color: c.color,
        voiceId: c.id,
        noteIndex: c.noteIndex + p,
        velocity: scene.cycles.length,
        duration: 0.5,
        pan: c.pan ?? (i % 2 === 0 ? 0.3 : -0.3),
        type: c.type,
        when: t,
      });
      p++;
    }
  }

  opts.onProgress?.(0.5);
  const rendered = await ctx.startRendering();
  opts.onProgress?.(1);
  return audioBufferToWav(rendered);
}

// Render a Study scene to WAV.
export async function renderStudyToWav(
  scene: StudyScene,
  settings: AudioSettings,
  opts: RenderOptions = {},
): Promise<Blob> {
  const bpm = scene.baseBPM;
  const totalSteps = scene.stepsPerBar * scene.bars;
  const layerLcm = scene.layers.reduce((acc, l) => lcm(acc, l.pulseCount), 1);
  const effectiveSteps = Math.max(totalSteps, layerLcm);
  const stepDurationSec = 60 / bpm;
  const durationSec = opts.durationSec ?? effectiveSteps * stepDurationSec;
  const tailSec = opts.tailSec ?? 2.5;
  const totalSec = durationSec + tailSec;
  const sampleRate = opts.sampleRate ?? 44100;

  const ctx = new OfflineAudioContext(2, Math.ceil(totalSec * sampleRate), sampleRate);
  const engine = new RenderEngine(ctx, settings);

  for (let s = 0; s < effectiveSteps; s++) {
    const t = s * stepDurationSec;
    if (t >= durationSec) break;
    scene.layers.forEach((layer, idx) => {
      const pulseEvery = effectiveSteps / layer.pulseCount;
      if (s % Math.round(pulseEvery) === 0) {
        engine.blip({
          color: layer.color,
          voiceId: layer.id,
          noteIndex: s % 8,
          velocity: scene.layers.length,
          duration: 0.5,
          pan: idx % 2 === 0 ? 0.3 : -0.3,
          type: "tone",
          when: t,
        });
      }
    });
  }

  opts.onProgress?.(0.5);
  const rendered = await ctx.startRendering();
  opts.onProgress?.(1);
  return audioBufferToWav(rendered);
}

// Render a Riff scene to WAV.
export async function renderRiffToWav(
  scene: RiffScene,
  settings: AudioSettings,
  opts: RenderOptions = {},
): Promise<Blob> {
  const bpm = scene.baseBPM;
  const totalSteps = scene.stepsPerBar * scene.bars;
  const stepDur = 60 / bpm / 2; // 8th-note resolution
  // Render 2 loops by default
  const loops = opts.durationSec ? 1 : 2;
  const durationSec = opts.durationSec ?? totalSteps * stepDur * loops;
  const tailSec = opts.tailSec ?? 2.0;
  const totalSec = durationSec + tailSec;
  const sampleRate = opts.sampleRate ?? 44100;

  const ctx = new OfflineAudioContext(2, Math.ceil(totalSec * sampleRate), sampleRate);
  const engine = new RenderEngine(ctx, settings);

  for (let loop = 0; loop < loops; loop++) {
    for (let s = 0; s < totalSteps; s++) {
      const t = (loop * totalSteps + s) * stepDur;
      if (t >= durationSec) break;
      scene.tracks.forEach((track, idx) => {
        const step = track.steps[s];
        if (step?.hit) {
          engine.drumHit({
            midi: track.pitch,
            color: track.color,
            accent: step.accent,
            trackId: track.id,
            pan: idx % 2 === 0 ? 0.2 : -0.2,
            when: t,
          });
        }
      });
    }
  }

  opts.onProgress?.(0.5);
  const rendered = await ctx.startRendering();
  opts.onProgress?.(1);
  return audioBufferToWav(rendered);
}

// Helper: render + download in one shot.
export async function exportOrbitWav(scene: OrbitScenePreset, settings: AudioSettings, filename?: string) {
  const blob = await renderOrbitToWav(scene, settings);
  downloadBlob(blob, filename ?? `${scene.id}.wav`);
}

export async function exportStudyWav(scene: StudyScene, settings: AudioSettings, filename?: string) {
  const blob = await renderStudyToWav(scene, settings);
  downloadBlob(blob, filename ?? `polyrhythm-${scene.layers.map((l) => l.label).join("v")}.wav`);
}

export async function exportRiffWav(scene: RiffScene, settings: AudioSettings, filename?: string) {
  const blob = await renderRiffToWav(scene, settings);
  downloadBlob(blob, filename ?? `riff-${scene.baseBPM}bpm.wav`);
}
