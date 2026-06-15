// Walks the AST and produces a Song: a config plus a list of tracks, each
// holding a flat array of scheduled events with beat-based timing. The audio
// scheduler later maps those beats onto Tone.Transport at the song tempo.

import { parse } from "./parser";
import type { Arg, CallStatement, Statement, ValueNode } from "./ast";
import { arpeggioOrder, parseChord, type ArpeggioPattern } from "../theory";
import { PRESETS } from "../presets";
import type {
  ADSR,
  DrumName,
  EffectSpec,
  FilterType,
  InstrumentSpec,
  InstrumentType,
  ScheduledEvent,
  Song,
  SongConfig,
  Track,
  WaveType,
} from "../types";

export class InterpretError extends Error {
  line: number | null;
  constructor(message: string, line: number | null = null) {
    super(message);
    this.name = "InterpretError";
    this.line = line;
  }
}

const DRUM_STEP = 0.5; // beats advanced by a bare beat()
const MAX_PRESET_DEPTH = 4;

const INSTRUMENT_TYPES: InstrumentType[] = [
  "pad",
  "lead",
  "bass",
  "pluck",
  "strings",
  "piano",
];
const DRUM_NAMES: DrumName[] = [
  "kick",
  "snare",
  "hihat",
  "clap",
  "tom",
  "cymbal",
];
const FILTER_TYPES: FilterType[] = ["lowpass", "highpass", "bandpass"];
const WAVES: WaveType[] = ["sine", "square", "sawtooth", "triangle"];

const TRACK_COLORS = [
  "#7c3aed",
  "#06b6d4",
  "#f59e0b",
  "#ec4899",
  "#22c55e",
  "#ef4444",
  "#3b82f6",
  "#eab308",
];

const DEFAULT_WAVE: Record<InstrumentType, WaveType> = {
  pad: "sine",
  lead: "square",
  bass: "sawtooth",
  pluck: "triangle",
  strings: "sawtooth",
  piano: "sine",
};

// ---- argument helpers -------------------------------------------------------

interface ArgSet {
  pos: ValueNode[];
  named: Map<string, ValueNode>;
}

function collectArgs(args: Arg[]): ArgSet {
  const pos: ValueNode[] = [];
  const named = new Map<string, ValueNode>();
  for (const a of args) {
    if (a.name) named.set(a.name, a.value);
    else pos.push(a.value);
  }
  return { pos, named };
}

function asNumber(v: ValueNode | undefined, what: string, line: number): number {
  if (!v) throw new InterpretError(`missing number for ${what}`, line);
  if (v.type === "number") return v.value;
  throw new InterpretError(`expected a number for ${what}`, v.line);
}

function asString(v: ValueNode | undefined, what: string, line: number): string {
  if (!v) throw new InterpretError(`missing value for ${what}`, line);
  if (v.type === "string" || v.type === "ident") return v.value;
  if (v.type === "number") return String(v.value);
  throw new InterpretError(`expected a string for ${what}`, v.line);
}

function numberOr(v: ValueNode | undefined, fallback: number): number {
  if (!v) return fallback;
  if (v.type === "number") return v.value;
  return fallback;
}

function pick(set: ArgSet, posIndex: number, name: string): ValueNode | undefined {
  return set.named.get(name) ?? set.pos[posIndex];
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// ---- effects & instruments --------------------------------------------------

function parseInstrument(v: ValueNode): InstrumentSpec {
  if (v.type !== "call" || v.name !== "synth") {
    throw new InterpretError(
      `instrument must be a synth(...) call`,
      v.line
    );
  }
  const set = collectArgs(v.args);
  const type = asString(set.pos[0], "instrument type", v.line) as InstrumentType;
  if (!INSTRUMENT_TYPES.includes(type)) {
    throw new InterpretError(`unknown instrument "${type}"`, v.line);
  }
  const waveNode = pick(set, 1, "wave");
  let wave: WaveType = DEFAULT_WAVE[type];
  if (waveNode) {
    const w = asString(waveNode, "wave", v.line) as WaveType;
    if (!WAVES.includes(w)) {
      throw new InterpretError(`unknown waveform "${w}"`, waveNode.line);
    }
    wave = w;
  }
  return { type, wave };
}

function parseEffect(v: ValueNode): EffectSpec {
  if (v.type !== "call") {
    throw new InterpretError(`effects must be effect calls like reverb(80)`, v.line);
  }
  const set = collectArgs(v.args);
  const line = v.line;
  switch (v.name) {
    case "reverb": {
      let wet = numberOr(set.pos[0], 50);
      if (wet > 1) wet /= 100; // accept percent (e.g. reverb(80))
      return { type: "reverb", wet: clamp01(wet) };
    }
    case "delay": {
      const time = numberOr(pick(set, 0, "time"), 0.25);
      const feedback = clamp01(numberOr(pick(set, 1, "feedback"), 0.3));
      return { type: "delay", time, feedback };
    }
    case "chorus": {
      const depth = clamp01(numberOr(pick(set, 0, "depth"), 0.5));
      const rate = numberOr(pick(set, 1, "rate"), 1.5);
      return { type: "chorus", depth, rate };
    }
    case "distortion": {
      const amount = clamp01(numberOr(pick(set, 0, "amount"), 0.3));
      return { type: "distortion", amount };
    }
    case "bitcrusher": {
      const bits = Math.max(1, Math.round(numberOr(pick(set, 0, "bits"), 4)));
      return { type: "bitcrusher", bits };
    }
    case "filter": {
      const filterType = asString(set.pos[0], "filter type", line) as FilterType;
      if (!FILTER_TYPES.includes(filterType)) {
        throw new InterpretError(`unknown filter type "${filterType}"`, line);
      }
      const cutoff = numberOr(pick(set, 1, "cutoff"), 1000);
      const resonance = numberOr(pick(set, 2, "resonance"), 1);
      return { type: "filter", filterType, cutoff, resonance };
    }
    case "phaser": {
      const freq = numberOr(pick(set, 0, "freq"), 0.5);
      return { type: "phaser", freq };
    }
    case "pan": {
      const value = Math.max(-1, Math.min(1, numberOr(set.pos[0], 0)));
      return { type: "pan", value };
    }
    case "fadeIn":
      return { type: "fadeIn", seconds: numberOr(set.pos[0], 1) };
    case "fadeOut":
      return { type: "fadeOut", seconds: numberOr(set.pos[0], 1) };
    default:
      throw new InterpretError(`unknown effect "${v.name}"`, line);
  }
}

// ---- track interpretation ---------------------------------------------------

interface TrackBuild {
  instrument: InstrumentSpec | null;
  effects: EffectSpec[];
  volume: number;
  adsr: ADSR | null;
  pitch: number;
  events: ScheduledEvent[];
}

function interpretTrack(
  name: string,
  body: Statement[],
  config: SongConfig
): Track {
  const tb: TrackBuild = {
    instrument: null,
    effects: [],
    volume: 0.8,
    adsr: null,
    pitch: 0,
    events: [],
  };

  const totalBeats = (config.duration * config.tempo) / 60;
  let cursor = 0;

  for (const stmt of body) {
    cursor = runTrackStatement(stmt, tb, cursor, totalBeats, true);
  }

  const hasNotes = tb.events.some((e) => e.kind === "note");
  if (tb.instrument === null && hasNotes) {
    tb.instrument = { type: "lead", wave: "triangle" };
  }
  const isDrum = tb.instrument === null;

  let length = 0;
  for (const e of tb.events) {
    const end = e.kind === "note" ? e.time + e.duration : e.time + DRUM_STEP;
    if (end > length) length = end;
  }

  return {
    name,
    isDrum,
    instrument: tb.instrument,
    effects: tb.effects,
    volume: tb.volume,
    adsr: tb.adsr,
    pitch: tb.pitch,
    color: "#7c3aed",
    events: tb.events.sort((a, b) => a.time - b.time),
    length,
  };
}

function runTrackStatement(
  stmt: Statement,
  tb: TrackBuild,
  cursor: number,
  totalBeats: number,
  isTrackTop: boolean
): number {
  if (stmt.type === "property") {
    applyProperty(stmt.key, stmt.value, tb, stmt.line);
    return cursor;
  }
  return runCall(stmt, tb, cursor, totalBeats, isTrackTop);
}

function applyProperty(
  key: string,
  value: ValueNode,
  tb: TrackBuild,
  line: number
): void {
  switch (key) {
    case "instrument":
      tb.instrument = parseInstrument(value);
      break;
    case "effects": {
      if (value.type !== "array") {
        throw new InterpretError(`effects must be an array`, line);
      }
      tb.effects.push(...value.items.map(parseEffect));
      break;
    }
    case "volume":
      tb.volume = clamp01(asNumber(value, "volume", line));
      break;
    case "pitch":
      tb.pitch = asNumber(value, "pitch", line);
      break;
    default:
      throw new InterpretError(`unknown track property "${key}"`, line);
  }
}

function runCall(
  stmt: CallStatement,
  tb: TrackBuild,
  cursor: number,
  totalBeats: number,
  isTrackTop: boolean
): number {
  const set = collectArgs(stmt.args);
  const line = stmt.line;

  switch (stmt.name) {
    // --- track configuration directives (do not advance the cursor) ---
    case "instrument":
      tb.instrument = parseInstrument({ type: "call", name: "synth", args: stmt.args, line });
      return cursor;
    case "volume":
      tb.volume = clamp01(asNumber(set.pos[0], "volume", line));
      return cursor;
    case "pitch":
      tb.pitch = asNumber(set.pos[0], "pitch", line);
      return cursor;
    case "adsr":
      tb.adsr = {
        attack: asNumber(set.pos[0], "attack", line),
        decay: asNumber(set.pos[1], "decay", line),
        sustain: clamp01(asNumber(set.pos[2], "sustain", line)),
        release: asNumber(set.pos[3], "release", line),
      };
      return cursor;
    case "pan":
    case "fadeIn":
    case "fadeOut":
      tb.effects.push(parseEffect({ type: "call", name: stmt.name, args: stmt.args, line }));
      return cursor;

    // --- timed playback ---
    case "play": {
      const note = asString(set.pos[0], "note", line);
      const dur = numberOr(set.pos[1], 1);
      tb.events.push({
        kind: "note",
        time: cursor,
        notes: [note],
        duration: dur,
        velocity: 0.85,
      });
      return cursor + dur;
    }
    case "rest": {
      const dur = numberOr(set.pos[0], 1);
      return cursor + dur;
    }
    case "chord": {
      const chordName = asString(set.pos[0], "chord", line);
      const dur = numberOr(set.pos[1], 1);
      tb.events.push({
        kind: "note",
        time: cursor,
        notes: parseChord(chordName),
        duration: dur,
        velocity: 0.7,
      });
      return cursor + dur;
    }
    case "beat": {
      const drum = asString(set.pos[0], "drum", line) as DrumName;
      if (!DRUM_NAMES.includes(drum)) {
        throw new InterpretError(`unknown drum "${drum}"`, line);
      }
      const vol = clamp01(numberOr(pick(set, 1, "volume"), 0.9));
      tb.events.push({ kind: "drum", time: cursor, drum, velocity: vol });
      return cursor + DRUM_STEP;
    }
    case "arpeggio":
      return runArpeggio(set, tb, cursor, totalBeats, isTrackTop, line);

    // --- structure ---
    case "at": {
      const startBeat = asNumber(set.pos[0], "beat position", line);
      const block = stmt.block ?? [];
      let inner = startBeat;
      for (const s of block) {
        inner = runTrackStatement(s, tb, inner, totalBeats, false);
      }
      return inner;
    }
    case "loop": {
      const count = Math.max(0, Math.round(asNumber(set.pos[0], "loop count", line)));
      const block = stmt.block ?? [];
      let inner = cursor;
      for (let i = 0; i < count; i++) {
        for (const s of block) {
          inner = runTrackStatement(s, tb, inner, totalBeats, false);
        }
      }
      return inner;
    }

    default:
      throw new InterpretError(`unknown directive "${stmt.name}"`, line);
  }
}

function runArpeggio(
  set: ArgSet,
  tb: TrackBuild,
  cursor: number,
  totalBeats: number,
  isTrackTop: boolean,
  line: number
): number {
  const notesNode = set.pos[0] ?? set.named.get("notes");
  if (!notesNode || notesNode.type !== "array") {
    throw new InterpretError(`arpeggio needs an array of notes`, line);
  }
  const notes = notesNode.items.map((n) => asString(n, "arpeggio note", line));
  if (notes.length === 0) {
    throw new InterpretError(`arpeggio note list is empty`, line);
  }
  const speed = numberOr(pick(set, 1, "speed"), 0.25);
  const pattern = (
    set.named.has("pattern")
      ? asString(set.named.get("pattern"), "pattern", line)
      : "up"
  ) as ArpeggioPattern;
  const ordered = arpeggioOrder(notes, pattern);

  // At the track top level an arpeggio fills the whole song; inside a block it
  // plays exactly one cycle from the cursor.
  const start = isTrackTop ? 0 : cursor;
  const end = isTrackTop ? totalBeats : cursor + ordered.length * speed;

  let t = start;
  let idx = 0;
  while (t < end - 1e-6) {
    const note = ordered[idx % ordered.length];
    tb.events.push({
      kind: "note",
      time: t,
      notes: [note],
      duration: speed,
      velocity: 0.8,
    });
    t += speed;
    idx++;
  }
  return isTrackTop ? cursor : end;
}

// ---- config -----------------------------------------------------------------

function beatsPerBar(signature: string): number {
  const top = parseInt(signature.split("/")[0], 10);
  return Number.isFinite(top) && top > 0 ? top : 4;
}

function interpretConfig(body: Statement[]): SongConfig {
  let tempo = 120;
  let signature = "4/4";
  let duration = 30;
  for (const stmt of body) {
    if (stmt.type !== "property") {
      throw new InterpretError(`config only accepts key: value entries`, stmt.line);
    }
    switch (stmt.key) {
      case "tempo":
        tempo = asNumber(stmt.value, "tempo", stmt.line);
        break;
      case "signature":
        signature = asString(stmt.value, "signature", stmt.line);
        break;
      case "duration":
        duration = asNumber(stmt.value, "duration", stmt.line);
        break;
      default:
        throw new InterpretError(`unknown config key "${stmt.key}"`, stmt.line);
    }
  }
  return { tempo, signature, duration, beatsPerBar: beatsPerBar(signature) };
}

// ---- top level --------------------------------------------------------------

export function interpret(source: string, depth = 0): Song {
  if (depth > MAX_PRESET_DEPTH) {
    throw new InterpretError(`preset nesting too deep`);
  }
  const program = parse(source);

  // Resolve config first so tracks can compute song length (for arpeggios).
  let config: SongConfig | null = null;
  for (const stmt of program) {
    if (stmt.type === "call" && stmt.name === "config") {
      config = interpretConfig(stmt.block ?? []);
      break;
    }
  }
  const userConfigSet = config !== null;
  if (!config) {
    config = { tempo: 120, signature: "4/4", duration: 30, beatsPerBar: 4 };
  }

  const tracks: Track[] = [];
  let adoptedPresetConfig = false;

  for (const stmt of program) {
    if (stmt.type === "property") {
      throw new InterpretError(
        `unexpected "${stmt.key}:" at the top level`,
        stmt.line
      );
    }
    switch (stmt.name) {
      case "config":
        break; // already handled
      case "track": {
        const set = collectArgs(stmt.args);
        const name = asString(set.pos[0], "track name", stmt.line);
        tracks.push(interpretTrack(name, stmt.block ?? [], config));
        break;
      }
      case "preset": {
        const set = collectArgs(stmt.args);
        const presetName = asString(set.pos[0], "preset name", stmt.line);
        const presetSource = PRESETS[presetName];
        if (!presetSource) {
          throw new InterpretError(`unknown preset "${presetName}"`, stmt.line);
        }
        const presetSong = interpret(presetSource, depth + 1);
        if (!userConfigSet && !adoptedPresetConfig) {
          config = presetSong.config;
          adoptedPresetConfig = true;
        }
        tracks.push(...presetSong.tracks);
        break;
      }
      default:
        throw new InterpretError(
          `unknown statement "${stmt.name}" at the top level`,
          stmt.line
        );
    }
  }

  tracks.forEach((t, i) => {
    t.color = TRACK_COLORS[i % TRACK_COLORS.length];
  });

  return { config, tracks };
}
