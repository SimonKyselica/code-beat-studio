// Dreamcore: slow, washed-out, heavy reverb, lo-fi tape wobble, pitched down.
export const dreamcore = `config {
  tempo: 70,
  signature: "4/4",
  duration: 30
}

track("pad") {
  instrument: synth("pad", wave: "sine"),
  effects: [reverb(90), chorus(0.8, rate: 0.3), filter("lowpass", cutoff: 600)],
  volume: 0.45,
  pitch: -3,
  adsr(1.5, 0.6, 0.85, 3.5),

  at(0)  { chord("Cm7", 8) }
  at(8)  { chord("Abmaj7", 8) }
  at(16) { chord("Ebmaj7", 8) }
  at(24) { chord("Bb", 8) }
}

track("bells") {
  instrument: synth("pluck", wave: "sine"),
  effects: [reverb(85), delay(0.5, feedback: 0.45), filter("lowpass", cutoff: 1400)],
  volume: 0.3,
  pitch: -3,

  arpeggio(["C5", "Eb5", "G5", "Bb5"], speed: 0.5, pattern: "updown")
}

track("drums") {
  effects: [reverb(60)],
  volume: 0.5,

  loop(8) {
    beat("kick", volume: 0.6)
    rest(1.5)
    beat("snare", volume: 0.45)
    rest(1.5)
  }
}
`;
