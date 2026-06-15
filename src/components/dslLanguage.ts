// CodeBeat DSL language support for CodeMirror 6: a StreamLanguage tokenizer plus
// a dark HighlightStyle. Token categories map to distinct lezer tags so each
// kind of word (structure / playback / shaping / effects) gets its own color.

import {
  HighlightStyle,
  StreamLanguage,
  syntaxHighlighting,
} from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import {
  autocompletion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";

const STRUCTURE = new Set(["config", "track", "at", "loop", "preset"]);
const PLAYBACK = new Set(["play", "rest", "chord", "arpeggio", "beat"]);
const SHAPING = new Set([
  "instrument",
  "effects",
  "volume",
  "adsr",
  "pitch",
  "synth",
]);
const EFFECTS = new Set([
  "reverb",
  "delay",
  "chorus",
  "distortion",
  "bitcrusher",
  "filter",
  "phaser",
  "pan",
  "fadeIn",
  "fadeOut",
]);

interface DslState {
  inBlockComment: boolean;
}

const dslStream = StreamLanguage.define<DslState>({
  name: "codebeat",
  startState: () => ({ inBlockComment: false }),
  token(stream, state) {
    if (state.inBlockComment) {
      if (stream.match(/.*?\*\//)) state.inBlockComment = false;
      else stream.skipToEnd();
      return "comment";
    }
    if (stream.eatSpace()) return null;

    if (stream.match("//")) {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match("/*")) {
      if (!stream.match(/.*?\*\//)) {
        state.inBlockComment = true;
        stream.skipToEnd();
      }
      return "comment";
    }

    const ch = stream.peek();

    // String literal
    if (ch === '"' || ch === "'") {
      stream.next();
      let escaped = false;
      let next: string | void;
      while ((next = stream.next())) {
        if (next === ch && !escaped) break;
        escaped = !escaped && next === "\\";
      }
      return "string";
    }

    // Number
    if (stream.match(/^-?\d+(\.\d+)?/)) return "number";

    // Identifier / keyword
    if (stream.match(/^[A-Za-z_]\w*/)) {
      const word = stream.current();
      if (STRUCTURE.has(word)) return "structure";
      if (PLAYBACK.has(word)) return "playback";
      if (SHAPING.has(word)) return "shaping";
      if (EFFECTS.has(word)) return "effect";
      // property key (identifier immediately before a colon)
      if (/^\s*:/.test(stream.string.slice(stream.pos))) return "property";
      return "variable";
    }

    stream.next();
    return null;
  },
  tokenTable: {
    structure: t.keyword,
    playback: t.macroName,
    shaping: t.typeName,
    effect: t.atom,
    property: t.propertyName,
    string: t.string,
    number: t.number,
    comment: t.comment,
    variable: t.variableName,
  },
});

const dslHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#c084fc", fontWeight: "600" },
  { tag: t.macroName, color: "#7dd3fc" },
  { tag: t.typeName, color: "#fbbf24" },
  { tag: t.atom, color: "#f472b6" },
  { tag: t.propertyName, color: "#a78bfa" },
  { tag: t.string, color: "#86efac" },
  { tag: t.number, color: "#fdba74" },
  { tag: t.comment, color: "#5a5a5a", fontStyle: "italic" },
  { tag: t.variableName, color: "#e5e5e5" },
]);

const COMPLETIONS = [
  ...[...STRUCTURE].map((label) => ({ label, type: "keyword" })),
  ...[...PLAYBACK].map((label) => ({ label, type: "function" })),
  ...[...SHAPING].map((label) => ({ label, type: "property" })),
  ...[...EFFECTS].map((label) => ({ label, type: "function" })),
];

function dslCompletions(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/\w+/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  return {
    from: word.from,
    options: COMPLETIONS,
  };
}

export const dslExtensions = [
  dslStream,
  syntaxHighlighting(dslHighlightStyle),
  autocompletion({ override: [dslCompletions] }),
];
