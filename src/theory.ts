// Lightweight music-theory helpers: note <-> MIDI conversion, chord spelling,
// and transposition. Note names follow Tone.js convention (e.g. "C4", "Eb3").

const SHARP_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const LETTER_SEMITONE: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

// Chord quality -> intervals (semitones from the root).
const CHORD_QUALITIES: Record<string, number[]> = {
  "": [0, 4, 7],
  maj: [0, 4, 7],
  major: [0, 4, 7],
  M: [0, 4, 7],
  m: [0, 3, 7],
  min: [0, 3, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  "6": [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  "7": [0, 4, 7, 10],
  dom7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  M7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  min7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
  "9": [0, 4, 7, 10, 14],
  add9: [0, 4, 7, 14],
};

const BASE_CHORD_OCTAVE = 3;

function accidentalOffset(acc: string): number {
  if (acc === "#") return 1;
  if (acc === "b") return -1;
  return 0;
}

/** Parse a note name like "C4", "Eb3", "F#2" into a MIDI number. */
export function noteToMidi(name: string, defaultOctave = 4): number {
  const match = /^([A-Ga-g])([#b]?)(-?\d+)?$/.exec(name.trim());
  if (!match) {
    throw new Error(`invalid note "${name}"`);
  }
  const letter = match[1].toUpperCase();
  const acc = match[2];
  const octave = match[3] !== undefined ? parseInt(match[3], 10) : defaultOctave;
  const semitone = LETTER_SEMITONE[letter] + accidentalOffset(acc);
  return (octave + 1) * 12 + semitone;
}

/** Convert a MIDI number back to a sharp-spelled note name (e.g. 60 -> "C4"). */
export function midiToNote(midi: number): string {
  const rounded = Math.round(midi);
  const octave = Math.floor(rounded / 12) - 1;
  const name = SHARP_NAMES[((rounded % 12) + 12) % 12];
  return `${name}${octave}`;
}

/** Transpose a note name by a number of semitones, preserving Tone-style naming. */
export function transposeNote(name: string, semitones: number): string {
  if (!semitones) return name;
  return midiToNote(noteToMidi(name) + semitones);
}

/**
 * Spell a chord name like "Cm", "Ab", "C#m7", "Fsus4" into note names.
 * Octave is fixed at a sensible mid range; transpose the track to move it.
 */
export function parseChord(name: string): string[] {
  const match = /^([A-Ga-g])([#b]?)(.*)$/.exec(name.trim());
  if (!match) {
    throw new Error(`invalid chord "${name}"`);
  }
  const letter = match[1].toUpperCase();
  const acc = match[2];
  const quality = match[3];
  const intervals = CHORD_QUALITIES[quality];
  if (!intervals) {
    throw new Error(`unknown chord quality "${quality}" in "${name}"`);
  }
  const rootSemitone = LETTER_SEMITONE[letter] + accidentalOffset(acc);
  const rootMidi = (BASE_CHORD_OCTAVE + 1) * 12 + rootSemitone;
  return intervals.map((i) => midiToNote(rootMidi + i));
}

export type ArpeggioPattern = "up" | "down" | "updown" | "random";

/** Reorder a set of notes into one cycle of an arpeggio pattern. */
export function arpeggioOrder(
  notes: string[],
  pattern: ArpeggioPattern
): string[] {
  switch (pattern) {
    case "down":
      return [...notes].reverse();
    case "updown": {
      if (notes.length <= 1) return [...notes];
      const down = [...notes].reverse().slice(1, -1);
      return [...notes, ...down];
    }
    case "random": {
      const shuffled = [...notes];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    case "up":
    default:
      return [...notes];
  }
}
