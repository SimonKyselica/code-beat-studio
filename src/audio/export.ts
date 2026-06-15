// Offline render -> 16-bit PCM WAV -> browser download. The render reuses the
// exact same graph builder as live playback via scheduleSong().

import * as Tone from "tone";
import type { Song } from "../types";
import { scheduleSong } from "./scheduler";

/** Encode an AudioBuffer as a 16-bit PCM WAV file. */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const out = new ArrayBuffer(44 + dataSize);
  const view = new DataView(out);

  let offset = 0;
  const writeString = (s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i));
  };
  const writeUint32 = (v: number) => {
    view.setUint32(offset, v, true);
    offset += 4;
  };
  const writeUint16 = (v: number) => {
    view.setUint16(offset, v, true);
    offset += 2;
  };

  // RIFF header
  writeString("RIFF");
  writeUint32(36 + dataSize);
  writeString("WAVE");
  // fmt chunk
  writeString("fmt ");
  writeUint32(16);
  writeUint16(1); // PCM
  writeUint16(numChannels);
  writeUint32(sampleRate);
  writeUint32(sampleRate * blockAlign);
  writeUint16(blockAlign);
  writeUint16(16); // bits per sample
  // data chunk
  writeString("data");
  writeUint32(dataSize);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = Math.max(-1, Math.min(1, channels[c][i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return out;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Render the full song offline and download it as a WAV file. */
export async function exportWav(
  song: Song,
  filename = "codebeat-song.wav"
): Promise<void> {
  const toneBuffer = await Tone.Offline(async () => {
    scheduleSong(song);
    Tone.getTransport().start(0);
  }, song.config.duration, 2);

  const audioBuffer = toneBuffer.get();
  if (!audioBuffer) {
    throw new Error("offline render produced no audio");
  }

  const wav = audioBufferToWav(audioBuffer);
  downloadBlob(new Blob([wav], { type: "audio/wav" }), filename);
}
