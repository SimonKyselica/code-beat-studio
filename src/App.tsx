import { useEffect, useRef } from "react";
import Editor from "./components/Editor";
import Timeline from "./components/Timeline";
import Toolbar, { TransportBar } from "./components/Toolbar";
import ErrorConsole from "./components/ErrorConsole";
import HelpModal from "./components/HelpModal";
import { useStudioStore } from "./store/useStudioStore";
import { getPositionSeconds } from "./audio/engine";

export default function App() {
  const isPlaying = useStudioStore((s) => s.isPlaying);
  const setPosition = useStudioStore((s) => s.setPosition);
  const rafRef = useRef<number | null>(null);

  // Drive the playhead / scrubber from the transport clock while playing.
  useEffect(() => {
    if (!isPlaying) return;
    const tick = () => {
      setPosition(getPositionSeconds());
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, setPosition]);

  return (
    <div className="flex h-screen flex-col bg-base text-neutral-200">
      <Toolbar />
      <main className="flex min-h-0 flex-1">
        <section className="w-1/2 min-w-0 border-r border-edge">
          <Editor />
        </section>
        <section className="w-1/2 min-w-0">
          <Timeline />
        </section>
      </main>
      <TransportBar />
      <div className="h-24 shrink-0">
        <ErrorConsole />
      </div>
      <HelpModal />
    </div>
  );
}
