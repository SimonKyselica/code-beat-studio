// Effect factory. Returns a Tone effect node for each spec, or null for the
// pseudo-effects (fadeIn/fadeOut) that the scheduler applies to the channel gain.

import * as Tone from "tone";
import type { EffectSpec } from "../types";

export function createEffect(spec: EffectSpec): Tone.ToneAudioNode | null {
  switch (spec.type) {
    case "reverb":
      // Freeverb is synchronous (no impulse-response generation), which keeps
      // offline rendering reliable.
      return new Tone.Freeverb({
        roomSize: Math.min(0.97, 0.6 + spec.wet * 0.37),
        dampening: 2500,
        wet: spec.wet,
      });
    case "delay":
      return new Tone.FeedbackDelay({
        delayTime: spec.time,
        feedback: spec.feedback,
        wet: 0.4,
      });
    case "chorus": {
      const chorus = new Tone.Chorus({
        frequency: spec.rate,
        delayTime: 3.5,
        depth: spec.depth,
        wet: 0.5,
      });
      chorus.start();
      return chorus;
    }
    case "distortion":
      return new Tone.Distortion({ distortion: spec.amount, wet: 0.85 });
    case "bitcrusher":
      return new Tone.BitCrusher({ bits: spec.bits });
    case "filter":
      return new Tone.Filter({
        frequency: spec.cutoff,
        type: spec.filterType,
        Q: spec.resonance,
      });
    case "phaser":
      return new Tone.Phaser({
        frequency: spec.freq,
        octaves: 3,
        baseFrequency: 350,
      });
    case "pan":
      return new Tone.Panner(spec.value);
    case "fadeIn":
    case "fadeOut":
      return null;
  }
}
