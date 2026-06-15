// Lo-fi chill: slow jazzy maj7/m7 chords on a wobbly electric piano, round sub
// bass, a soft boom-bap beat, and a sparse music-box melody. (Original.)
export const lofi = `config {
  tempo: 75,
  signature: "4/4",
  duration: 32
}

// Electric piano chords with light bitcrush + slow chorus = tape wobble.
track("keys") {
  instrument: synth("piano", wave: "sine"),
  effects: [bitcrusher(12), chorus(0.4, rate: 0.25), filter("lowpass", cutoff: 1800), reverb(35)],
  volume: 0.35,
  adsr(0.01, 1.4, 0.4, 1.4),

  loop(3) {
    chord("Cmaj7", 4)
    chord("Am7", 4)
    chord("Dm7", 4)
    chord("G7", 4)
  }
}

// Warm pad underneath for glue, heavily filtered and reverbed.
track("pad") {
  instrument: synth("pad", wave: "triangle"),
  effects: [reverb(75), chorus(0.5, rate: 0.2), filter("lowpass", cutoff: 850)],
  volume: 0.18,
  adsr(1.2, 0.6, 0.85, 2.5),

  loop(3) {
    chord("Cmaj7", 4)
    chord("Am7", 4)
    chord("Dm7", 4)
    chord("G7", 4)
  }
}

// Round, soft sub bass following the chord roots.
track("bass") {
  instrument: synth("bass", wave: "sine"),
  effects: [filter("lowpass", cutoff: 400)],
  volume: 0.45,
  adsr(0.02, 0.3, 0.6, 0.4),

  loop(3) {
    play("C2", 1) rest(0.5) play("C2", 0.5) rest(2)
    play("A1", 1) rest(0.5) play("A1", 0.5) rest(2)
    play("D2", 1) rest(0.5) play("D2", 0.5) rest(2)
    play("G1", 1) rest(0.5) play("G1", 0.5) rest(2)
  }
}

// Sparse, dreamy music-box melody (chord tones over the progression).
track("melody") {
  instrument: synth("pluck", wave: "triangle"),
  effects: [delay(0.375, feedback: 0.3), filter("lowpass", cutoff: 2600), reverb(45)],
  volume: 0.22,

  at(0)  { play("E5", 1) play("G5", 1) rest(2) }
  at(8)  { play("F5", 1) play("A5", 1) rest(2) }
  at(16) { play("E5", 1.5) rest(0.5) play("C5", 2) }
  at(24) { play("A5", 1) play("F5", 1) rest(2) }
  at(32) { play("G5", 1) play("E5", 1) rest(2) }
}

// Laid-back boom-bap: soft kick, gentle back-beat snare, muffled hats.
track("drums") {
  effects: [filter("lowpass", cutoff: 4000), reverb(25)],
  volume: 0.5,

  loop(10) {
    beat("kick", volume: 0.5)
    beat("hihat", volume: 0.18)
    beat("snare", volume: 0.35)
    beat("hihat", volume: 0.18)
    beat("kick", volume: 0.4)
    beat("hihat", volume: 0.18)
    beat("snare", volume: 0.35)
    beat("hihat", volume: 0.18)
  }
}
`;
