// Thin wrapper around Tone.Transport for live playback: start/stop, auto-stop at
// the song duration, and node disposal. Offline rendering lives in export.ts.

import * as Tone from "tone";
import type { Song } from "../types";
import { scheduleSong, type ScheduledSong } from "./scheduler";

let current: ScheduledSong | null = null;

/** Resume the AudioContext. Must be called from a user gesture. */
export async function startAudio(): Promise<void> {
  await Tone.start();
}

/** Tear down the current graph and reset the transport to the start. */
export function stopSong(): void {
  const transport = Tone.getTransport();
  transport.stop();
  transport.cancel(0);
  transport.position = 0;
  if (current) {
    current.dispose();
    current = null;
  }
}

/**
 * Schedule and play a song. `onEnd` fires once the song reaches its configured
 * duration so the UI can flip back to the stopped state.
 */
export async function playSong(song: Song, onEnd: () => void): Promise<void> {
  await Tone.start();
  stopSong();

  const transport = Tone.getTransport();
  current = scheduleSong(song);

  transport.scheduleOnce(() => {
    // Defer disposal off the audio callback onto the main thread.
    setTimeout(() => {
      stopSong();
      onEnd();
    }, 0);
  }, song.config.duration + 0.05);

  transport.start();
}

/** Current playback position in seconds (for the scrubber). */
export function getPositionSeconds(): number {
  return Math.max(0, Tone.getTransport().seconds);
}

export function isTransportRunning(): boolean {
  return Tone.getTransport().state === "started";
}
