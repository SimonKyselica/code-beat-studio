// Dreampunk: a dreamcore x cyberpunk fusion — lush detuned pads and electric
// piano over a driving resonant bassline and crisp hybrid drums. (Original.)
export const dreampunk = `config {
  tempo: 100,
  signature: "4/4",
  duration: 32
}

// Wide, phased, heavily-reverbed pad — the dreamy bed.
track("pad") {
  instrument: synth("pad", wave: "sawtooth"),
  effects: [reverb(85), chorus(0.6, rate: 0.4), phaser(0.3), filter("lowpass", cutoff: 1100)],
  volume: 0.28,
  adsr(0.9, 0.5, 0.85, 2.5),

  loop(3) {
    chord("Am7", 4)
    chord("Fmaj7", 4)
    chord("Cmaj7", 4)
    chord("G", 4)
  }
}

// Electric-piano arpeggio washing across the whole song.
track("keys") {
  instrument: synth("piano", wave: "sine"),
  effects: [delay(0.33, feedback: 0.4), reverb(55), filter("lowpass", cutoff: 2600)],
  volume: 0.3,

  arpeggio(["A3", "C4", "E4", "G4", "B4", "G4", "E4", "C4"], speed: 0.25, pattern: "up")
}

// Acid-ish resonant bass with a little grit.
track("bass") {
  instrument: synth("bass", wave: "sawtooth"),
  effects: [distortion(0.25), filter("lowpass", cutoff: 450, resonance: 9)],
  volume: 0.5,
  adsr(0.01, 0.2, 0.45, 0.25),

  loop(27) {
    play("A1", 0.5)
    rest(0.25)
    play("A1", 0.25)
    play("E2", 0.5)
    rest(0.5)
  }
}

// Glassy bitcrushed lead phrases, entering after the intro.
track("lead") {
  instrument: synth("lead", wave: "square"),
  effects: [bitcrusher(8), delay(0.25, feedback: 0.3), reverb(45)],
  volume: 0.22,

  at(8)  { play("A4", 1) play("C5", 0.5) play("E5", 1.5) }
  at(16) { play("G4", 1) play("B4", 0.5) play("D5", 1.5) }
  at(24) { play("E4", 1) play("A4", 0.5) play("C5", 1.5) }
  at(32) { play("F4", 1) play("A4", 0.5) play("C5", 1.5) }
  at(40) { play("G4", 1) play("E5", 0.5) play("A5", 1.5) }
}

// Punchy kick + airy snare with a short reverb tail.
track("drums") {
  effects: [reverb(30)],
  volume: 0.55,

  loop(14) {
    beat("kick")
    beat("hihat", volume: 0.25)
    beat("snare")
    beat("hihat", volume: 0.25)
    beat("kick")
    beat("hihat", volume: 0.25)
    beat("snare")
    beat("hihat", volume: 0.25)
  }
}
`;
