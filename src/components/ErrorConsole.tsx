import { useStudioStore } from "../store/useStudioStore";

export default function ErrorConsole() {
  const errors = useStudioStore((s) => s.errors);

  return (
    <div className="h-full overflow-auto border-t border-edge bg-[#0a0a0a] px-4 py-2 font-mono text-xs">
      {errors.length === 0 ? (
        <div className="flex items-center gap-2 text-neutral-600">
          <span className="text-green-600">●</span> No errors — ready to play.
        </div>
      ) : (
        <ul className="space-y-1">
          {errors.map((err, i) => (
            <li key={i} className="text-red-400">
              <span className="font-semibold text-red-500">ERROR</span>
              {err.line != null && (
                <>
                  {" "}
                  line <span className="text-red-300">{err.line}</span>
                </>
              )}{" "}
              <span className="text-neutral-500">—</span> {err.message}
              <span className="ml-2 text-[10px] uppercase tracking-wide text-red-900">
                {err.stage}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
