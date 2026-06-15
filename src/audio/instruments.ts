// Melodic instrument factory. Each instrument exposes a single output node and a
// triggerNote() that schedules a note or chord at a precise audio time.

import * as Tone from "tone";
import type { ADSR, DrumName, InstrumentSpec } from "../types";

export interface Voice {
  output: Tone.ToneAudioNode;
  triggerNote(
    notes: string[],
    durationSec: number,
    time: number,
    velocity: number
  ): void;
  dispose(): void;
}

const DEFAULT_ENVELOPE: Record<InstrumentSpec["type"], ADSR> = {
  pad: { attack: 0.8, decay: 0.4, sustain: 0.8, release: 2.5 },
  lead: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.4 },
  bass: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3 },
  pluck: { attack: 0.005, decay: 0.2, sustain: 0.2, release: 0.6 },
  strings: { attack: 0.5, decay: 0.3, sustain: 0.85, release: 1.6 },
  piano: { attack: 0.005, decay: 1.4, sustain: 0.15, release: 1.1 },
};

export function createInstrument(spec: InstrumentSpec, adsr: ADSR | null): Voice {
  const env = adsr ?? DEFAULT_ENVELOPE[spec.type];

  if (spec.type === "bass") {
    const mono = new Tone.MonoSynth({
      oscillator: { type: spec.wave },
      envelope: env,
      filterEnvelope: {
        attack: 0.01,
        decay: 0.25,
        sustain: 0.4,
        release: 0.4,
        baseFrequency: 120,
        octaves: 3,
      },
    });
    return {
      output: mono,
      triggerNote: (notes, dur, time, vel) => {
        // Monophonic: play the lowest note of a chord.
        mono.triggerAttackRelease(notes[0], dur, time, vel);
      },
      dispose: () => mono.dispose(),
    };
  }

  if (spec.type === "piano") {
    // FM voice with a percussive envelope — an electric-piano-ish tone that
    // needs no samples (keeps the app fully static/offline).
    const poly = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.01,
      modulationIndex: 12,
      oscillator: { type: spec.wave },
      envelope: env,
      modulation: { type: "square" },
      modulationEnvelope: {
        attack: 0.002,
        decay: 0.25,
        sustain: 0,
        release: 0.2,
      },
    });
    poly.maxPolyphony = 24;
    return {
      output: poly,
      triggerNote: (notes, dur, time, vel) => {
        poly.triggerAttackRelease(notes, dur, time, vel);
      },
      dispose: () => poly.dispose(),
    };
  }

  if (spec.type === "pluck") {
    const pluck = new Tone.PluckSynth({
      attackNoise: 1,
      dampening: 3500,
      resonance: 0.9,
    });
    return {
      output: pluck,
      triggerNote: (notes, _dur, time, _vel) => {
        // Pluck is a one-shot; strum chord notes together.
        for (const n of notes) pluck.triggerAttack(n, time);
      },
      dispose: () => pluck.dispose(),
    };
  }

  // pad / lead / strings -> polyphonic subtractive synth
  const poly = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: spec.wave },
    envelope: env,
  });
  poly.maxPolyphony = 24;
  return {
    output: poly,
    triggerNote: (notes, dur, time, vel) => {
      poly.triggerAttackRelease(notes, dur, time, vel);
    },
    dispose: () => poly.dispose(),
  };
}

// ---- drums ------------------------------------------------------------------

export interface DrumKit {
  output: Tone.ToneAudioNode;
  trigger(drum: DrumName, time: number, velocity: number): void;
  dispose(): void;
}

export function createDrumKit(): DrumKit {
  const out = new Tone.Gain(1);

  const kick = new Tone.MembraneSynth({
    octaves: 6,
    pitchDecay: 0.05,
    envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 },
  }).connect(out);

  const tom = new Tone.MembraneSynth({
    octaves: 4,
    pitchDecay: 0.1,
    envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.3 },
  }).connect(out);

  const snareNoise = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
  }).connect(out);

  const snareBody = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
  }).connect(out);

  const clap = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
  }).connect(out);

  const hihat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.1, release: 0.02 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }).connect(out);
  hihat.frequency.value = 380;

  const cymbal = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 1.2, release: 0.3 },
    harmonicity: 5.1,
    modulationIndex: 40,
    resonance: 6000,
    octaves: 1.5,
  }).connect(out);
  cymbal.frequency.value = 280;

  const trigger: DrumKit["trigger"] = (drum, time, vel) => {
    switch (drum) {
      case "kick":
        kick.triggerAttackRelease("C1", "8n", time, vel);
        break;
      case "tom":
        tom.triggerAttackRelease("G2", "8n", time, vel);
        break;
      case "snare":
        snareNoise.triggerAttackRelease("16n", time, vel);
        snareBody.triggerAttackRelease("G3", "16n", time, vel * 0.6);
        break;
      case "clap":
        clap.triggerAttackRelease("16n", time, vel);
        break;
      case "hihat":
        hihat.triggerAttackRelease("32n", time, vel);
        break;
      case "cymbal":
        cymbal.triggerAttackRelease("1n", time, vel);
        break;
    }
  };

  return {
    output: out,
    trigger,
    dispose: () => {
      kick.dispose();
      tom.dispose();
      snareNoise.dispose();
      snareBody.dispose();
      clap.dispose();
      hihat.dispose();
      cymbal.dispose();
      out.dispose();
    },
  };
}
