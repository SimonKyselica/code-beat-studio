// Cyberpunk: fast, hard, distorted kick, acid resonant bass, bitcrushed lead.
export const cyberpunk = `config {
  tempo: 140,
  signature: "4/4",
  duration: 30
}

track("pad") {
  instrument: synth("pad", wave: "sawtooth"),
  effects: [phaser(0.4), reverb(40), filter("lowpass", cutoff: 1200)],
  volume: 0.22,
  adsr(0.4, 0.3, 0.7, 1.2),

  loop(5) {
    chord("Cm", 4)
    chord("Gm", 4)
    chord("Fm", 4)
    chord("Ab", 4)
  }
}

track("bass") {
  instrument: synth("bass", wave: "sawtooth"),
  effects: [distortion(0.4), filter("lowpass", cutoff: 300, resonance: 15)],
  volume: 0.5,
  adsr(0.01, 0.15, 0.4, 0.2),

  loop(40) {
    play("C2", 0.5)
    rest(0.25)
    play("C2", 0.25)
    play("Eb2", 0.5)
    rest(0.5)
  }
}

track("melody") {
  instrument: synth("lead", wave: "square"),
  effects: [bitcrusher(6), delay(0.25, feedback: 0.35), reverb(30)],
  volume: 0.32,

  arpeggio(["C4", "Eb4", "G4", "Bb4", "C5", "Bb4", "G4", "Eb4"], speed: 0.25, pattern: "up")
}

track("drums") {
  volume: 0.6,

  loop(20) {
    beat("kick")
    beat("hihat", volume: 0.3)
    beat("snare")
    beat("hihat", volume: 0.3)
    beat("kick")
    beat("hihat", volume: 0.3)
    beat("snare")
    beat("hihat", volume: 0.3)
  }
}

track("noise") {
  instrument: synth("lead", wave: "sawtooth"),
  effects: [bitcrusher(4), filter("highpass", cutoff: 2000), reverb(50)],
  volume: 0.08,

  loop(80) {
    play("C6", 0.1)
    rest(0.9)
  }
}
`;
