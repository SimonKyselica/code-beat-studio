import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import {
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { dslExtensions } from "./dslLanguage";
import { useStudioStore } from "../store/useStudioStore";

const editorTheme = EditorView.theme(
  {
    "&": { backgroundColor: "#0d0d0d", color: "#e5e5e5", height: "100%" },
    ".cm-content": { caretColor: "#a78bfa", padding: "12px 0" },
    "&.cm-focused": { outline: "none" },
    ".cm-gutters": { backgroundColor: "#0d0d0d", border: "none" },
    ".cm-tooltip": {
      backgroundColor: "#1b1b1b",
      border: "1px solid #2a2a2a",
      color: "#e5e5e5",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      backgroundColor: "#7c3aed",
      color: "#ffffff",
    },
  },
  { dark: true }
);

export default function Editor() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const setCode = useStudioStore((s) => s.setCode);
  const code = useStudioStore((s) => s.code);

  // Mount the editor once.
  useEffect(() => {
    if (!containerRef.current) return;
    const view = new EditorView({
      parent: containerRef.current,
      state: EditorState.create({
        doc: useStudioStore.getState().code,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...completionKeymap,
            indentWithTab,
          ]),
          dslExtensions,
          editorTheme,
          EditorView.updateListener.of((u) => {
            if (u.docChanged) setCode(u.state.doc.toString());
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [setCode]);

  // Sync external code changes (e.g. loading a preset) into the editor.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (view.state.doc.toString() !== code) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: code },
      });
    }
  }, [code]);

  return <div ref={containerRef} className="h-full w-full overflow-hidden" />;
}
