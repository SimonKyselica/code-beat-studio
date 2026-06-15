// Shared domain types used across the parser, interpreter, and audio engine.

export type WaveType = "sine" | "square" | "sawtooth" | "triangle";

export type InstrumentType =
  | "pad"
  | "lead"
  | "bass"
  | "pluck"
  | "strings"
  | "piano";

export type DrumName = "kick" | "snare" | "hihat" | "clap" | "tom" | "cymbal";

export type FilterType = "lowpass" | "highpass" | "bandpass";

export interface InstrumentSpec {
  type: InstrumentType;
  wave: WaveType;
}

export interface ADSR {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export type EffectSpec =
  | { type: "reverb"; wet: number }
  | { type: "delay"; time: number; feedback: number }
  | { type: "chorus"; depth: number; rate: number }
  | { type: "distortion"; amount: number }
  | { type: "bitcrusher"; bits: number }
  | { type: "filter"; filterType: FilterType; cutoff: number; resonance: number }
  | { type: "phaser"; freq: number }
  | { type: "pan"; value: number }
  | { type: "fadeIn"; seconds: number }
  | { type: "fadeOut"; seconds: number };

/** A pitched note or chord hit. Times/durations are expressed in beats. */
export interface NoteEvent {
  kind: "note";
  time: number;
  notes: string[];
  duration: number;
  velocity: number;
}

/** A percussion hit. Time is expressed in beats. */
export interface DrumEvent {
  kind: "drum";
  time: number;
  drum: DrumName;
  velocity: number;
}

export type ScheduledEvent = NoteEvent | DrumEvent;

export interface Track {
  name: string;
  /** Drum tracks have no melodic instrument; each beat() picks its own voice. */
  isDrum: boolean;
  instrument: InstrumentSpec | null;
  effects: EffectSpec[];
  volume: number;
  adsr: ADSR | null;
  /** Transpose every note on this track by N semitones. */
  pitch: number;
  /** UI color for the timeline row. */
  color: string;
  events: ScheduledEvent[];
  /** Last beat occupied by an event (for timeline scaling). */
  length: number;
}

export interface SongConfig {
  tempo: number;
  signature: string;
  /** Song length in seconds; the transport stops here. */
  duration: number;
  /** Beats per bar derived from the time signature. */
  beatsPerBar: number;
}

export interface Song {
  config: SongConfig;
  tracks: Track[];
}

/** Error carrying a 1-based source line for the error console. */
export interface StudioError {
  line: number | null;
  message: string;
  /** "parse" for lexer/parser, "runtime" for interpreter/audio. */
  stage: "parse" | "runtime";
}
