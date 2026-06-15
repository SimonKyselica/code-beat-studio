# CodeBeat Studio

A browser-based music programming environment. Write short, readable code in a
custom DSL and hear a full song play back — no backend, fully static.

Built with **Vite + React + TypeScript**, **Tone.js** (audio), **CodeMirror 6**
(editor), **Tailwind CSS** (styling), and **Zustand** (state). The DSL is parsed
by a handwritten lexer → parser → interpreter.

## Run it

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build into dist/
```

Open the local URL Vite prints. Click **▶ Play** (the first click also unlocks
the browser audio context).

## The DSL

```text
config {
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

track("drums") {
  loop(8) {
    beat("kick")
    rest(0.5)
    beat("hihat", volume: 0.3)
    beat("snare")
  }
}
```

### Reference

- **Structure** — `config { }`, `track("name") { }`, `at(beat) { }`, `loop(n) { }`
- **Playback** — `play("C4", duration)`, `rest(duration)`, `chord("Cm7", duration)`,
  `arpeggio(["C4","E4","G4"], speed: 0.25, pattern: "up" | "down" | "updown" | "random")`
- **Drums** — `beat("kick" | "snare" | "hihat" | "clap" | "tom" | "cymbal", volume?)`
- **Instruments** — `synth("pad" | "lead" | "bass" | "pluck" | "strings" | "piano", wave?)`
  where `wave` is `sine | square | sawtooth | triangle`
- **Effects** — `reverb(wet)`, `delay(time, feedback)`, `chorus(depth, rate?)`,
  `distortion(amount)`, `bitcrusher(bits)`, `filter(type, cutoff, resonance?)`,
  `phaser(freq)`, `pan(value)`, `fadeIn(seconds)`, `fadeOut(seconds)`
- **Sound shaping** — `adsr(attack, decay, sustain, release)`, `volume(0-1)`,
  `pitch(semitones)`
- **Presets** — `preset("tutorial")`, `preset("dreamcore")`, `preset("cyberpunk")`,
  `preset("dreampunk")` (also available from the toolbar **Presets** dropdown; the
  **Docs** button next to it opens the in-app reference)

Notes:

- All times/durations are in **beats**; the transport maps them to seconds at the
  song tempo. The transport stops at `config.duration` seconds.
- `reverb()` accepts either `0–1` or a percentage (e.g. `reverb(80)`).
- A bare `beat()` advances the cursor by half a beat.
- A track-level `arpeggio(...)` fills the whole song; inside a block it plays one
  cycle.

## Export

**Export WAV** renders the song offline with `Tone.Offline`, encodes it to 16-bit
PCM WAV in pure JS, and downloads the file.

## Project layout

```text
src/
  components/   Editor, Timeline, Toolbar (+ TransportBar), ErrorConsole, dslLanguage
  audio/        engine, instruments, effects, scheduler, export
  parser/       lexer, parser, ast, interpreter
  presets/      dreamcore, cyberpunk
  store/        useStudioStore (Zustand)
  theory.ts     note/chord/transpose helpers
  types.ts      shared domain types
```
