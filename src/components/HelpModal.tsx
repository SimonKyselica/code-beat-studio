import { useEffect } from "react";
import { useStudioStore } from "../store/useStudioStore";

interface DocRow {
  syntax: string;
  desc: string;
}

function Section({ title, rows }: { title: string; rows: DocRow[] }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent-soft">
        {title}
      </h3>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.syntax}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-3 text-xs"
          >
            <code className="break-words font-mono text-[12px] text-green-300">
              {r.syntax}
            </code>
            <span className="text-neutral-400">{r.desc}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const STRUCTURE: DocRow[] = [
  { syntax: 'config { tempo, signature, duration }', desc: "Global tempo (BPM), time signature, and length in seconds." },
  { syntax: 'track("name") { ... }', desc: "One instrument + its effects + its notes." },
  { syntax: "loop(n) { ... }", desc: "Repeat a block n times." },
  { syntax: "at(beat) { ... }", desc: "Place a block at an absolute beat position." },
];

const PLAYBACK: DocRow[] = [
  { syntax: 'play("C4", 0.5)', desc: "Play a note for a number of beats." },
  { syntax: "rest(0.25)", desc: "Wait (advance the cursor) without sound." },
  { syntax: 'chord("Cm7", 4)', desc: "Play a chord. Try maj7, m7, sus4, dim, aug, 9…" },
  { syntax: 'arpeggio([...], speed: 0.25, pattern: "up")', desc: "Auto-play notes; pattern: up | down | updown | random." },
];

const DRUMS: DocRow[] = [
  { syntax: 'beat("kick")', desc: "kick · snare · hihat · clap · tom · cymbal." },
  { syntax: 'beat("snare", volume: 0.4)', desc: "A bare beat advances half a beat." },
];

const INSTRUMENTS: DocRow[] = [
  { syntax: 'synth("piano", wave: "sine")', desc: "Types: pad · lead · bass · pluck · strings · piano." },
  { syntax: 'wave: "sine"', desc: "Waves: sine · square · sawtooth · triangle." },
];

const EFFECTS: DocRow[] = [
  { syntax: "reverb(80)", desc: "Wetness 0–1 or a percentage." },
  { syntax: "delay(0.3, feedback: 0.4)", desc: "Echo time (s) and feedback." },
  { syntax: "chorus(0.6, rate: 0.4)", desc: "Depth + LFO rate — lush tape wobble." },
  { syntax: "distortion(0.3)", desc: "Drive amount 0–1." },
  { syntax: "bitcrusher(6)", desc: "Lo-fi crush, bit depth (1–16)." },
  { syntax: 'filter("lowpass", cutoff: 800, resonance: 8)', desc: "lowpass · highpass · bandpass." },
  { syntax: "phaser(0.4)", desc: "Sweeping phaser at the given rate." },
  { syntax: "pan(-0.5)", desc: "Stereo position, -1 (left) to 1 (right)." },
  { syntax: "fadeIn(2) / fadeOut(3)", desc: "Volume fades in seconds." },
];

const SHAPING: DocRow[] = [
  { syntax: "adsr(0.01, 0.2, 0.5, 0.3)", desc: "Attack, decay, sustain, release of the sound." },
  { syntax: "volume(0.4)", desc: "Track loudness, 0–1 (or volume: 0.4)." },
  { syntax: "pitch(-3)", desc: "Transpose the whole track by semitones." },
];

const PRESETS: DocRow[] = [
  { syntax: 'preset("dreampunk")', desc: "Drop a whole preset song into your code." },
];

export default function HelpModal() {
  const open = useStudioStore((s) => s.helpOpen);
  const setHelpOpen = useStudioStore((s) => s.setHelpOpen);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelpOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setHelpOpen]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={() => setHelpOpen(false)}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-edge bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-edge px-5 py-3">
          <h2 className="text-sm font-semibold">
            How to use <span className="text-accent-soft">CodeBeat Studio</span>
          </h2>
          <button
            onClick={() => setHelpOpen(false)}
            className="rounded px-2 py-1 text-neutral-400 transition-colors hover:bg-panel2 hover:text-neutral-200"
            aria-label="Close documentation"
          >
            ✕
          </button>
        </div>

        <div className="overflow-auto px-5 py-4">
          <p className="mb-4 text-xs leading-relaxed text-neutral-400">
            Write code in the left editor, then press{" "}
            <span className="text-neutral-200">▶ Play</span> (the first click also
            unlocks browser audio). Each <code className="text-green-300">track</code>{" "}
            runs at the same time. Times and durations are measured in{" "}
            <span className="text-neutral-200">beats</span>. Pick{" "}
            <span className="text-neutral-200">tutorial</span> from the Presets
            dropdown for a guided, commented song, then experiment.
          </p>

          <Section title="Structure" rows={STRUCTURE} />
          <Section title="Notes & Playback" rows={PLAYBACK} />
          <Section title="Drums" rows={DRUMS} />
          <Section title="Instruments" rows={INSTRUMENTS} />
          <Section title="Effects" rows={EFFECTS} />
          <Section title="Sound shaping" rows={SHAPING} />
          <Section title="Presets" rows={PRESETS} />

          <p className="mt-2 text-xs text-neutral-500">
            Tip: errors show in the console at the bottom with the line number.
            Use <span className="text-neutral-300">Export WAV</span> to render and
            download your song.
          </p>
        </div>
      </div>
    </div>
  );
}
