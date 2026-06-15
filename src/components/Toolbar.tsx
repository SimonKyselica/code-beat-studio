import { useStudioStore } from "../store/useStudioStore";
import { PRESET_NAMES } from "../presets";

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

/** Top bar: branding, presets dropdown, export. */
export default function Toolbar() {
  const loadPreset = useStudioStore((s) => s.loadPreset);
  const exportSong = useStudioStore((s) => s.exportSong);
  const isExporting = useStudioStore((s) => s.isExporting);
  const setHelpOpen = useStudioStore((s) => s.setHelpOpen);
  const currentPreset = useStudioStore((s) => s.currentPreset);

  return (
    <header className="flex items-center justify-between border-b border-edge bg-panel px-4 py-2.5">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-accent text-sm font-bold text-white">
          ♪
        </div>
        <h1 className="text-sm font-semibold tracking-tight">
          CodeBeat <span className="text-accent-soft">Studio</span>
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-1.5 rounded border border-edge bg-panel2 px-3 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:border-accent hover:text-white"
          title="How to use CodeBeat Studio"
        >
          <span className="text-accent-soft">?</span> Docs
        </button>

        <select
          aria-label="Load preset"
          value={currentPreset}
          onChange={(e) => {
            if (e.target.value) loadPreset(e.target.value);
          }}
          className="cursor-pointer rounded border border-edge bg-panel2 px-3 py-1.5 text-xs text-neutral-200 outline-none transition-colors hover:border-accent focus:border-accent"
        >
          <option value="">Presets ▾</option>
          {PRESET_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <button
          onClick={() => exportSong()}
          disabled={isExporting}
          className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? "Exporting…" : "Export WAV"}
        </button>
      </div>
    </header>
  );
}

/** Bottom transport bar: play/stop, BPM, position. */
export function TransportBar() {
  const isPlaying = useStudioStore((s) => s.isPlaying);
  const play = useStudioStore((s) => s.play);
  const stop = useStudioStore((s) => s.stop);
  const song = useStudioStore((s) => s.song);
  const positionSec = useStudioStore((s) => s.positionSec);

  const bpm = song?.config.tempo ?? 120;
  const total = song?.config.duration ?? 0;
  const progress = total > 0 ? Math.min(100, (positionSec / total) * 100) : 0;

  return (
    <div className="flex items-center gap-4 border-t border-edge bg-panel px-4 py-2">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => play()}
          disabled={isPlaying}
          className="flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-[10px]">▶</span> Play
        </button>
        <button
          onClick={() => stop()}
          disabled={!isPlaying}
          className="flex items-center gap-1.5 rounded border border-edge bg-panel2 px-3 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-[10px]">■</span> Stop
        </button>
      </div>

      <div className="text-xs tabular-nums text-neutral-400">
        BPM <span className="font-medium text-neutral-200">{bpm}</span>
      </div>

      <div className="flex flex-1 items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel2">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="shrink-0 text-xs tabular-nums text-neutral-400">
          <span className="text-neutral-200">{formatTime(positionSec)}</span> /{" "}
          {formatTime(total)}
        </div>
      </div>
    </div>
  );
}
