import { create } from "zustand";
import type { Song, StudioError } from "../types";
import { interpret, InterpretError } from "../parser/interpreter";
import { ParseError } from "../parser/ast";
import { LexError } from "../parser/lexer";
import { playSong, stopSong } from "../audio/engine";
import { exportWav } from "../audio/export";
import { PRESETS } from "../presets";

export const INITIAL_CODE = `config {
  tempo: 90,
  signature: "4/4",
  duration: 24
}

track("pad") {
  instrument: synth("pad", wave: "sine"),
  effects: [reverb(70), chorus(0.5), filter("lowpass", cutoff: 900)],
  volume: 0.4,

  loop(3) {
    chord("Cm7", 4)
    chord("Abmaj7", 4)
  }
}

track("bass") {
  instrument: synth("bass", wave: "sawtooth"),
  effects: [distortion(0.2), filter("lowpass", cutoff: 500, resonance: 6)],
  adsr(0.01, 0.2, 0.5, 0.3),
  volume: 0.5,

  loop(12) {
    play("C2", 0.5)
    rest(0.25)
    play("G2", 0.5)
    rest(0.75)
  }
}

track("melody") {
  instrument: synth("lead", wave: "square"),
  effects: [delay(0.3, feedback: 0.4), reverb(40)],
  volume: 0.3,

  arpeggio(["C4", "Eb4", "G4", "Bb4"], speed: 0.25, pattern: "up")
}

track("drums") {
  volume: 0.5,

  loop(9) {
    beat("kick")
    rest(0.5)
    beat("hihat", volume: 0.3)
    beat("snare")
    beat("hihat", volume: 0.3)
  }
}
`;

/** Normalise any thrown value into a StudioError carrying a source line. */
function toStudioError(err: unknown): StudioError {
  if (err instanceof LexError || err instanceof ParseError) {
    return { line: err.line, message: err.message, stage: "parse" };
  }
  if (err instanceof InterpretError) {
    return { line: err.line, message: err.message, stage: "runtime" };
  }
  const message = err instanceof Error ? err.message : String(err);
  return { line: null, message, stage: "runtime" };
}

interface StudioState {
  code: string;
  /** Most recent successfully parsed song (drives the timeline). */
  song: Song | null;
  errors: StudioError[];
  isPlaying: boolean;
  isExporting: boolean;
  positionSec: number;
  helpOpen: boolean;
  /** Name of the preset currently loaded verbatim, or "" once edited. */
  currentPreset: string;

  setCode: (code: string) => void;
  loadPreset: (name: string) => void;
  play: () => Promise<void>;
  stop: () => void;
  exportSong: () => Promise<void>;
  setPosition: (sec: number) => void;
  setHelpOpen: (open: boolean) => void;
}

/** Parse without surfacing errors (used for the live timeline preview). */
function safeParse(code: string): { song: Song | null; errors: StudioError[] } {
  try {
    return { song: interpret(code), errors: [] };
  } catch (err) {
    return { song: null, errors: [toStudioError(err)] };
  }
}

const initial = safeParse(INITIAL_CODE);

export const useStudioStore = create<StudioState>((set, get) => ({
  code: INITIAL_CODE,
  song: initial.song,
  errors: [],
  isPlaying: false,
  isExporting: false,
  positionSec: 0,
  helpOpen: false,
  currentPreset: "",

  setCode: (code) => {
    const { song, errors } = safeParse(code);
    set((state) => {
      // The dropdown keeps showing the preset only while the code matches it
      // verbatim; once the user edits, it reverts to the "Presets" placeholder.
      const stillPreset =
        state.currentPreset !== "" && code === PRESETS[state.currentPreset];
      return {
        code,
        // Keep the last good song so the timeline doesn't blank out mid-edit.
        song: song ?? state.song,
        errors,
        currentPreset: stillPreset ? state.currentPreset : "",
      };
    });
  },

  loadPreset: (name) => {
    const source = PRESETS[name];
    if (!source) return;
    get().stop();
    const { song, errors } = safeParse(source);
    set({ code: source, song, errors, currentPreset: name });
  },

  play: async () => {
    const { code } = get();
    let song: Song;
    try {
      song = interpret(code);
    } catch (err) {
      set({ errors: [toStudioError(err)], isPlaying: false });
      return;
    }
    set({ song, errors: [], isPlaying: true, positionSec: 0 });
    try {
      await playSong(song, () => set({ isPlaying: false, positionSec: 0 }));
    } catch (err) {
      set({ errors: [toStudioError(err)], isPlaying: false });
    }
  },

  stop: () => {
    stopSong();
    set({ isPlaying: false, positionSec: 0 });
  },

  exportSong: async () => {
    const { code, isExporting } = get();
    if (isExporting) return;
    let song: Song;
    try {
      song = interpret(code);
    } catch (err) {
      set({ errors: [toStudioError(err)] });
      return;
    }
    set({ song, errors: [], isExporting: true });
    try {
      await exportWav(song);
    } catch (err) {
      set({ errors: [toStudioError(err)] });
    } finally {
      set({ isExporting: false });
    }
  },

  setPosition: (sec) => set({ positionSec: sec }),

  setHelpOpen: (open) => set({ helpOpen: open }),
}));
