// A heavily-commented starter song. It teaches the DSL and plays a simple,
// pleasant loop. Loaded from the Presets dropdown as "tutorial".
export const tutorial = `// ===========================================================
//  CodeBeat Studio - TUTORIAL
//  Lines starting with // are comments and are ignored.
//  Press the Play button below to hear this, then edit and
//  press Play again. Open "Docs" (top-right) for the full list.
// ===========================================================

// 1) config sets the global tempo (beats per minute), the time
//    signature, and how many seconds the song lasts.
config {
  tempo: 96,
  signature: "4/4",
  duration: 20
}

// 2) A track() is ONE instrument plus its own effects. "chords"
//    is just a label you pick. All tracks play at the same time.
track("chords") {
  // Choose a sound with synth(type, wave).
  // types: pad, lead, bass, pluck, strings, piano
  // waves: sine, square, sawtooth, triangle
  instrument: synth("piano", wave: "sine"),

  // effects: [ ... ] is a chain applied in order.
  effects: [reverb(45), filter("lowpass", cutoff: 2200)],

  // volume goes from 0.0 (silent) to 1.0 (loud).
  volume: 0.35,

  // chord("name", beats) plays a chord. Statements happen one
  // after another in time. Try Cmaj7, Am7, G7, Fsus4, Dm...
  chord("C", 2)
  chord("Am", 2)
  chord("F", 2)
  chord("G", 2)

  // loop(n) { ... } repeats a block n times to fill more time.
  loop(6) {
    chord("C", 1)
    chord("G", 1)
    chord("Am", 1)
    chord("F", 1)
  }
}

// 3) play("note", beats) plays single notes; rest(beats) waits.
track("bass") {
  instrument: synth("bass", wave: "sawtooth"),
  effects: [filter("lowpass", cutoff: 500)],
  volume: 0.5,

  loop(8) {
    play("C2", 1)
    play("A1", 1)
    play("F1", 1)
    play("G1", 1)
  }
}

// 4) arpeggio(notes, speed, pattern) auto-plays notes in order.
//    pattern: up, down, updown, or random. speed is beats-per-note.
//    A track-level arpeggio automatically fills the whole song.
track("sparkle") {
  instrument: synth("pluck", wave: "triangle"),
  effects: [delay(0.3, feedback: 0.35), reverb(50)],
  volume: 0.25,

  arpeggio(["C5", "E5", "G5", "B5"], speed: 0.25, pattern: "updown")
}

// 5) Drums use beat("name").
//    names: kick, snare, hihat, clap, tom, cymbal
//    add volume: 0.3 to soften a hit. A bare beat lasts half a beat.
track("drums") {
  volume: 0.5,

  loop(16) {
    beat("kick")
    beat("hihat", volume: 0.3)
    beat("snare")
    beat("hihat", volume: 0.3)
  }
}

// ----- NOW TRY THIS -----
//  * Change tempo: 96 to tempo: 140 for a faster feel.
//  * Swap synth("piano", ...) for synth("strings", ...).
//  * Shape a sound: add  adsr(0.01, 0.2, 0.5, 0.3)  to a track.
//  * Load "dreampunk" or "cyberpunk" from the Presets dropdown.
`;
