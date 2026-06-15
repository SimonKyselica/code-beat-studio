import { useEffect, type ReactNode } from "react";
import { useStudioStore } from "../store/useStudioStore";

interface DocRow {
  syntax: string;
  desc: string;
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 mt-6 border-b border-edge/60 pb-1 text-xs font-semibold uppercase tracking-wider text-accent-soft">
      {children}
    </h3>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs leading-relaxed text-neutral-300">{children}</p>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="my-2 overflow-x-auto rounded border border-edge bg-[#0a0a0a] p-3 font-mono text-[11.5px] leading-relaxed text-neutral-300">
      {children}
    </pre>
  );
}

function K({ children }: { children: ReactNode }) {
  return <code className="font-mono text-[11.5px] text-green-300">{children}</code>;
}

function Table({ rows }: { rows: DocRow[] }) {
  return (
    <div className="mb-2 space-y-1.5">
      {rows.map((r) => (
        <div
          key={r.syntax}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-3 text-xs"
        >
          <code className="break-words font-mono text-[11.5px] text-green-300">
            {r.syntax}
          </code>
          <span className="text-neutral-400">{r.desc}</span>
        </div>
      ))}
    </div>
  );
}

const STRUCTURE: DocRow[] = [
  { syntax: "config { tempo, signature, duration }", desc: "Global tempo (BPM), time signature, length in seconds." },
  { syntax: 'track("name") { ... }', desc: "One instrument + its effects + its notes." },
  { syntax: "loop(n) { ... }", desc: "Repeat a block n times." },
  { syntax: "at(beat) { ... }", desc: "Place a block at an absolute beat position." },
];
const PLAYBACK: DocRow[] = [
  { syntax: 'play("C4", 0.5)', desc: "Play a note for a number of beats." },
  { syntax: "rest(0.25)", desc: "Stay silent (advance time)." },
  { syntax: 'chord("Cm7", 4)', desc: "Play several notes at once." },
  { syntax: 'arpeggio([...], speed: 0.25, pattern: "up")', desc: "Auto-play notes: up | down | updown | random." },
];
const DRUMS: DocRow[] = [
  { syntax: 'beat("kick")', desc: "kick · snare · hihat · clap · tom · cymbal." },
  { syntax: 'beat("snare", volume: 0.4)', desc: "A bare beat lasts half a beat." },
];
const INSTRUMENTS: DocRow[] = [
  { syntax: 'synth("piano", wave: "sine")', desc: "pad · lead · bass · pluck · strings · piano." },
  { syntax: 'wave: "sawtooth"', desc: "sine · triangle · square · sawtooth." },
];
const EFFECTS: DocRow[] = [
  { syntax: "reverb(80)", desc: "Space / room. 0–1 or a percentage." },
  { syntax: "delay(0.3, feedback: 0.4)", desc: "Echo: time (s) + how much it repeats." },
  { syntax: "chorus(0.6, rate: 0.4)", desc: "Width / wobble (depth + LFO rate)." },
  { syntax: "distortion(0.3)", desc: "Grit / drive, 0–1." },
  { syntax: "bitcrusher(6)", desc: "Lo-fi crunch (bit depth 1–16)." },
  { syntax: 'filter("lowpass", cutoff: 800, resonance: 8)', desc: "Tone shaping: lowpass · highpass · bandpass." },
  { syntax: "phaser(0.4)", desc: "Sweeping movement." },
  { syntax: "pan(-0.5)", desc: "Stereo position, -1 left … 1 right." },
  { syntax: "fadeIn(2) / fadeOut(3)", desc: "Volume fades, in seconds." },
];
const SHAPING: DocRow[] = [
  { syntax: "adsr(0.01, 0.2, 0.5, 0.3)", desc: "Attack, decay, sustain, release." },
  { syntax: "volume(0.4)", desc: "Track loudness 0–1 (or volume: 0.4)." },
  { syntax: "pitch(-3)", desc: "Transpose the track in semitones." },
];

export default function HelpModal() {
  const open = useStudioStore((s) => s.helpOpen);
  const setHelpOpen = useStudioStore((s) => s.setHelpOpen);
  const loadPreset = useStudioStore((s) => s.loadPreset);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelpOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setHelpOpen]);

  if (!open) return null;

  const openTutorial = () => {
    loadPreset("tutorial");
    setHelpOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={() => setHelpOpen(false)}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-edge bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-edge px-5 py-3">
          <h2 className="text-sm font-semibold">
            Make music with <span className="text-accent-soft">CodeBeat Studio</span>
          </h2>
          <button
            onClick={() => setHelpOpen(false)}
            className="rounded px-2 py-1 text-neutral-400 transition-colors hover:bg-panel2 hover:text-neutral-200"
            aria-label="Close documentation"
          >
            ✕
          </button>
        </div>

        <div className="overflow-auto px-6 py-4">
          {/* ---------- Intro ---------- */}
          <P>
            CodeBeat Studio turns short, readable code into music. You describe a
            song as a set of <K>track</K>s; every track plays at the same time,
            like layers in a band. Write in the left editor, then press{" "}
            <span className="text-neutral-200">▶ Play</span> (the first click also
            unlocks browser audio). The fastest way to learn is to load the{" "}
            <button
              onClick={openTutorial}
              className="text-accent-soft underline underline-offset-2 hover:text-white"
            >
              commented tutorial song
            </button>{" "}
            and tweak it.
          </P>

          {/* ---------- Core ideas ---------- */}
          <Heading>1 · The core ideas</Heading>
          <P>
            <b className="text-neutral-200">Time is measured in beats, not seconds.</b>{" "}
            A “beat” is one tap of the foot; <K>tempo</K> sets how many beats fit in
            a minute (higher = faster). <K>duration</K> is the only value in
            seconds — it’s simply when playback stops.
          </P>
          <P>
            <b className="text-neutral-200">Statements happen in order.</b> Inside a
            track there’s an invisible “playhead” that starts at beat 0.{" "}
            <K>play</K>, <K>chord</K>, <K>rest</K> and <K>beat</K> push it forward;{" "}
            <K>loop</K> repeats a block; <K>at(beat)</K> jumps the playhead to an
            exact beat.
          </P>
          <P>
            <b className="text-neutral-200">Tracks are independent and parallel.</b>{" "}
            The drums, bass, and melody each have their own timeline, instrument,
            and effects, and they all start together at beat 0.
          </P>

          {/* ---------- First song ---------- */}
          <Heading>2 · Build your first song</Heading>
          <P>
            Start with the tempo and length, then add tracks one at a time. Press
            Play after each addition so you can hear what each layer contributes.
          </P>
          <Code>{`config {
  tempo: 100,
  signature: "4/4",
  duration: 16
}

// 1. The groove: drums first
track("drums") {
  loop(8) {
    beat("kick")
    beat("hihat", volume: 0.3)
    beat("snare")
    beat("hihat", volume: 0.3)
  }
}

// 2. The foundation: a bassline
track("bass") {
  instrument: synth("bass", wave: "sawtooth"),
  effects: [filter("lowpass", cutoff: 500)],
  volume: 0.5,
  loop(4) {
    play("C2", 1)
    play("G1", 1)
    play("A1", 1)
    play("F1", 1)
  }
}

// 3. The harmony: chords on a soft pad
track("pad") {
  instrument: synth("pad", wave: "sine"),
  effects: [reverb(60)],
  volume: 0.3,
  loop(2) {
    chord("C", 2)
    chord("G", 2)
    chord("Am", 2)
    chord("F", 2)
  }
}`}</Code>
          <P>
            That’s a complete song: a drum groove, a bass that outlines the chord
            roots, and pads that fill in the harmony. Add a melody on top with a{" "}
            <K>lead</K> or <K>piano</K> track when you’re ready.
          </P>

          {/* ---------- Notes & chords ---------- */}
          <Heading>3 · Notes, octaves &amp; chords</Heading>
          <P>
            A note is a letter <K>A</K>–<K>G</K>, an optional <K>#</K> (sharp) or{" "}
            <K>b</K> (flat), and an octave number: <K>C4</K>, <K>F#3</K>,{" "}
            <K>Eb5</K>. Bigger octave number = higher pitch; middle range is around
            octave 4. Bass usually lives in octaves 1–2, melodies in 4–5.
          </P>
          <P>
            A <K>chord</K> is a root note plus a “quality”. Common ones:{" "}
            <K>C</K> (major), <K>Cm</K> (minor), <K>C7</K>, <K>Cmaj7</K>,{" "}
            <K>Cm7</K>, <K>Csus4</K>, <K>Cdim</K>, <K>Caug</K>, <K>C9</K>. If
            you’re unsure what sounds good, these four-chord loops almost always
            work:
          </P>
          <Code>{`// Happy / pop (key of C)
chord("C", 2)  chord("G", 2)  chord("Am", 2)  chord("F", 2)

// Dreamy / emotional (key of A minor)
chord("Am7", 2)  chord("Fmaj7", 2)  chord("Cmaj7", 2)  chord("G", 2)`}</Code>
          <P>
            <K>arpeggio</K> plays the notes of a chord one at a time instead of
            together — great for sparkly bells and synth lines. A track-level
            arpeggio automatically repeats to fill the whole song.
          </P>

          {/* ---------- Rhythm ---------- */}
          <Heading>4 · Rhythm &amp; timing</Heading>
          <P>
            Durations are in beats: <K>1</K> is a quarter note, <K>0.5</K> an
            eighth, <K>0.25</K> a sixteenth, <K>2</K> a half note. A bare{" "}
            <K>beat("kick")</K> advances the playhead by half a beat, so four drum
            hits make one bar in 4/4. Use <K>rest</K> to leave gaps:
          </P>
          <Code>{`loop(4) {
  beat("kick")               // strong beat
  rest(0.5)                  // skip the off-beat
  beat("snare")              // back-beat
  beat("hihat", volume: 0.3) // quiet tick
}`}</Code>
          <P>
            Use <K>at(beat)</K> when you want something to land at an exact spot,
            e.g. a fill or a melody phrase that enters after an 8-beat intro:{" "}
            <K>{`at(8) { play("E5", 2) }`}</K>.
          </P>

          {/* ---------- Arranging ---------- */}
          <Heading>5 · Layering a track that sounds good</Heading>
          <P>
            Build from the bottom up:{" "}
            <span className="text-neutral-200">drums → bass → chords → melody</span>.
            The drums and bass create the groove; chords add mood; the melody sits
            on top. Keep each instrument in its own pitch range so they don’t fight.
          </P>
          <P>
            <b className="text-neutral-200">Balance your volumes</b> — if everything
            is at 1.0 it turns to mud. A reliable starting mix:
          </P>
          <Table
            rows={[
              { syntax: "drums  ~ 0.5", desc: "Present but not overpowering." },
              { syntax: "bass   ~ 0.5", desc: "Felt more than heard." },
              { syntax: "pad    ~ 0.3", desc: "Sits behind everything." },
              { syntax: "lead   ~ 0.25", desc: "Cuts through on top." },
            ]}
          />

          {/* ---------- Sound design ---------- */}
          <Heading>6 · Shaping the sound</Heading>
          <P>
            The <K>wave</K> sets the raw character: <K>sine</K> is smooth and pure,{" "}
            <K>triangle</K> soft, <K>square</K> hollow and retro, <K>sawtooth</K>{" "}
            bright and buzzy (great for bass and leads).
          </P>
          <P>
            <K>adsr(attack, decay, sustain, release)</K> shapes the volume of every
            note over time. <b className="text-neutral-200">Attack</b> is the fade-in,{" "}
            <b className="text-neutral-200">release</b> the tail after the note ends.
            Slow attack + long release = lush pad; fast attack + short release =
            tight, plucky.
          </P>
          <Code>{`adsr(1.2, 0.5, 0.8, 2.5)   // dreamy pad: eases in, rings out
adsr(0.01, 0.2, 0.4, 0.2)  // snappy bass: instant, short`}</Code>
          <P>
            <K>pitch(semitones)</K> transposes a whole track — <K>12</K> is one
            octave up, <K>-12</K> one octave down.
          </P>

          {/* ---------- Effects ---------- */}
          <Heading>7 · Effects (the flavor)</Heading>
          <P>
            Effects in <K>effects: [ ... ]</K> are applied left to right. A natural
            order is <K>filter → distortion → delay → reverb</K>. The big four to
            start with:
          </P>
          <P>
            <K>reverb</K> adds space (a little for a room, a lot for a dream);{" "}
            <K>delay</K> is rhythmic echo; <K>filter("lowpass", cutoff: 800)</K>{" "}
            removes brightness for a warm/lo-fi tone; <K>distortion</K> adds grit
            for aggressive bass and leads. Full list below.
          </P>
          <Table rows={EFFECTS} />

          {/* ---------- Reference ---------- */}
          <Heading>Quick reference</Heading>
          <p className="mb-1 text-[11px] font-semibold text-neutral-400">Structure</p>
          <Table rows={STRUCTURE} />
          <p className="mb-1 mt-3 text-[11px] font-semibold text-neutral-400">Notes &amp; playback</p>
          <Table rows={PLAYBACK} />
          <p className="mb-1 mt-3 text-[11px] font-semibold text-neutral-400">Drums</p>
          <Table rows={DRUMS} />
          <p className="mb-1 mt-3 text-[11px] font-semibold text-neutral-400">Instruments</p>
          <Table rows={INSTRUMENTS} />
          <p className="mb-1 mt-3 text-[11px] font-semibold text-neutral-400">Sound shaping</p>
          <Table rows={SHAPING} />

          {/* ---------- Presets & export ---------- */}
          <Heading>Presets, errors &amp; export</Heading>
          <P>
            Learn by example: pick <K>lofi</K>, <K>dreampunk</K>,{" "}
            <K>dreamcore</K> or <K>cyberpunk</K> from the{" "}
            <span className="text-neutral-200">Presets</span>{" "}
            dropdown and read how they’re built. You can also drop a whole preset
            into your own code with <K>preset("dreampunk")</K>. Mistakes appear in
            the red console at the bottom with the exact line number. When you’re
            happy, <span className="text-neutral-200">Export WAV</span> renders the
            song and downloads it as an audio file.
          </P>
        </div>
      </div>
    </div>
  );
}
