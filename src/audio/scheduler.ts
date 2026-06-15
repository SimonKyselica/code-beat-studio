// Builds the Tone audio graph for a song and schedules every event onto the
// active transport. Works for both live playback and offline rendering because
// it relies on Tone.getTransport()/getDestination(), which Tone.Offline swaps
// to the offline context during rendering.

import * as Tone from "tone";
import type { Song } from "../types";
import { transposeNote } from "../theory";
import { createDrumKit, createInstrument } from "./instruments";
import { createEffect } from "./effects";

export interface ScheduledSong {
  dispose(): void;
}

export function scheduleSong(song: Song): ScheduledSong {
  const transport = Tone.getTransport();
  const destination = Tone.getDestination();
  const disposables: { dispose(): void }[] = [];

  transport.bpm.value = song.config.tempo;
  transport.timeSignature = song.config.beatsPerBar;

  const secPerBeat = 60 / song.config.tempo;
  const songDurationSec = song.config.duration;

  for (const track of song.tracks) {
    const gain = new Tone.Gain(track.volume);
    gain.connect(destination);
    disposables.push(gain);

    // Separate real effect nodes from the fade pseudo-effects.
    const fxNodes: Tone.ToneAudioNode[] = [];
    let fadeIn = 0;
    let fadeOut = 0;
    for (const spec of track.effects) {
      if (spec.type === "fadeIn") {
        fadeIn = spec.seconds;
        continue;
      }
      if (spec.type === "fadeOut") {
        fadeOut = spec.seconds;
        continue;
      }
      const node = createEffect(spec);
      if (node) {
        fxNodes.push(node);
        disposables.push(node);
      }
    }

    let sourceOut: Tone.ToneAudioNode | null = null;

    if (track.isDrum) {
      const kit = createDrumKit();
      disposables.push(kit);
      sourceOut = kit.output;
      for (const ev of track.events) {
        if (ev.kind !== "drum") continue;
        const t = ev.time * secPerBeat;
        transport.schedule((time) => kit.trigger(ev.drum, time, ev.velocity), t);
      }
    } else if (track.instrument) {
      const inst = createInstrument(track.instrument, track.adsr);
      disposables.push(inst);
      sourceOut = inst.output;
      for (const ev of track.events) {
        if (ev.kind !== "note") continue;
        const notes = track.pitch
          ? ev.notes.map((n) => transposeNote(n, track.pitch))
          : ev.notes;
        const t = ev.time * secPerBeat;
        const dur = Math.max(0.05, ev.duration * secPerBeat);
        transport.schedule(
          (time) => inst.triggerNote(notes, dur, time, ev.velocity),
          t
        );
      }
    }

    if (!sourceOut) continue;

    if (fxNodes.length) {
      sourceOut.chain(...fxNodes, gain);
    } else {
      sourceOut.connect(gain);
    }

    // Fades ride the channel gain, scheduled on the transport timeline so the
    // ramp times line up with playback start.
    if (fadeIn > 0) {
      transport.schedule((time) => {
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(track.volume, time + fadeIn);
      }, 0);
    }
    if (fadeOut > 0) {
      transport.schedule((time) => {
        gain.gain.setValueAtTime(track.volume, time);
        gain.gain.linearRampToValueAtTime(0, time + fadeOut);
      }, Math.max(0, songDurationSec - fadeOut));
    }
  }

  return {
    dispose: () => {
      for (const d of disposables) {
        try {
          d.dispose();
        } catch {
          /* node may already be disposed */
        }
      }
    },
  };
}
