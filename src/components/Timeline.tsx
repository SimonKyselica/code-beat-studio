import { useStudioStore } from "../store/useStudioStore";
import type { Track } from "../types";

const DRUM_WIDTH_BEATS = 0.5;
const LABEL_WIDTH = 92;

function trackSummary(track: Track): string {
  if (track.isDrum) return "drums";
  return track.instrument ? track.instrument.type : "—";
}

function TrackRow({ track, totalBeats }: { track: Track; totalBeats: number }) {
  return (
    <div className="flex items-stretch border-b border-edge/60">
      <div className="shrink-0 px-3 py-2 text-xs" style={{ width: LABEL_WIDTH }}>
        <div className="truncate font-medium text-neutral-200" title={track.name}>
          {track.name}
        </div>
        <div className="truncate text-[10px] uppercase tracking-wide text-neutral-500">
          {trackSummary(track)}
        </div>
      </div>
      <div className="relative my-1 flex-1 rounded bg-panel2/60">
        {track.events.map((ev, i) => {
          const widthBeats = ev.kind === "note" ? ev.duration : DRUM_WIDTH_BEATS;
          const left = (ev.time / totalBeats) * 100;
          const width = Math.max(0.4, (widthBeats / totalBeats) * 100);
          const label = ev.kind === "note" ? ev.notes.join(" ") : ev.drum;
          return (
            <div
              key={i}
              className="absolute top-1 bottom-1 rounded-[3px] border border-black/40 transition-opacity hover:opacity-100"
              style={{
                left: `${left}%`,
                // Subtract a couple of px so adjacent blocks have a visible gap.
                width: `calc(${width}% - 2px)`,
                minWidth: 2,
                backgroundColor: track.color,
                backgroundImage:
                  "linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.06) 45%, rgba(0,0,0,0.22) 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
              }}
              title={`${label} · ${widthBeats} beat${widthBeats === 1 ? "" : "s"} @ ${ev.time.toFixed(2)}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function Timeline() {
  const song = useStudioStore((s) => s.song);
  const positionSec = useStudioStore((s) => s.positionSec);

  if (!song || song.tracks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-neutral-600">
        Write some tracks and press Play to see them appear here.
      </div>
    );
  }

  const { tempo, duration, beatsPerBar } = song.config;
  const songBeats = (duration * tempo) / 60;
  const totalBeats = Math.max(songBeats, ...song.tracks.map((t) => t.length), 1);
  const barCount = Math.ceil(totalBeats / beatsPerBar);
  const playheadPct = Math.min(
    100,
    Math.max(0, ((positionSec * tempo) / 60 / totalBeats) * 100)
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-edge px-3 py-2 text-xs text-neutral-400">
        <span className="font-medium text-neutral-300">Timeline</span>
        <span>
          {song.tracks.length} tracks · {barCount} bars · {tempo} BPM
        </span>
      </div>

      <div className="relative flex-1 overflow-auto">
        {/* Overlay aligned exactly to the lane region (right of the labels). */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 right-0 z-10"
          style={{ left: LABEL_WIDTH }}
        >
          {Array.from({ length: barCount + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-edge/70"
              style={{ left: `${((i * beatsPerBar) / totalBeats) * 100}%` }}
            />
          ))}
          <div
            className="absolute top-0 bottom-0 w-px bg-accent-soft"
            style={{ left: `${playheadPct}%`, boxShadow: "0 0 8px #a78bfa" }}
          />
        </div>

        {song.tracks.map((track, i) => (
          <TrackRow key={i} track={track} totalBeats={totalBeats} />
        ))}
      </div>
    </div>
  );
}
