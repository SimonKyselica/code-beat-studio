// Tokenizer for the CodeBeat DSL. Produces a flat token stream with 1-based
// line numbers so the parser and error console can point at the right line.

export type TokenType =
  | "lbrace"
  | "rbrace"
  | "lparen"
  | "rparen"
  | "lbracket"
  | "rbracket"
  | "comma"
  | "colon"
  | "string"
  | "number"
  | "ident"
  | "eof";

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

export class LexError extends Error {
  line: number;
  constructor(message: string, line: number) {
    super(message);
    this.name = "LexError";
    this.line = line;
  }
}

const SINGLE_CHAR: Record<string, TokenType> = {
  "{": "lbrace",
  "}": "rbrace",
  "(": "lparen",
  ")": "rparen",
  "[": "lbracket",
  "]": "rbracket",
  ",": "comma",
  ":": "colon",
};

function isIdentStart(ch: string): boolean {
  return /[A-Za-z_]/.test(ch);
}

function isIdentPart(ch: string): boolean {
  return /[A-Za-z0-9_]/.test(ch);
}

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

  const advance = (): string => {
    const ch = source[i++];
    if (ch === "\n") {
      line++;
      col = 1;
    } else {
      col++;
    }
    return ch;
  };

  const peek = (offset = 0): string => source[i + offset] ?? "";

  while (i < source.length) {
    const ch = peek();

    // Whitespace (newlines are not significant — statements self-delimit).
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      advance();
      continue;
    }

    // Line comment: //...
    if (ch === "/" && peek(1) === "/") {
      while (i < source.length && peek() !== "\n") advance();
      continue;
    }

    // Block comment: /* ... */
    if (ch === "/" && peek(1) === "*") {
      advance();
      advance();
      while (i < source.length && !(peek() === "*" && peek(1) === "/")) {
        advance();
      }
      advance();
      advance();
      continue;
    }

    const startLine = line;
    const startCol = col;

    // Punctuation
    if (SINGLE_CHAR[ch]) {
      advance();
      tokens.push({ type: SINGLE_CHAR[ch], value: ch, line: startLine, col: startCol });
      continue;
    }

    // String literal (double or single quotes)
    if (ch === '"' || ch === "'") {
      const quote = advance();
      let value = "";
      while (i < source.length && peek() !== quote) {
        if (peek() === "\n") {
          throw new LexError("unterminated string literal", startLine);
        }
        if (peek() === "\\") {
          advance();
          value += advance();
        } else {
          value += advance();
        }
      }
      if (i >= source.length) {
        throw new LexError("unterminated string literal", startLine);
      }
      advance(); // closing quote
      tokens.push({ type: "string", value, line: startLine, col: startCol });
      continue;
    }

    // Number (integer or decimal, optional leading minus)
    if (isDigit(ch) || (ch === "-" && isDigit(peek(1))) || (ch === "." && isDigit(peek(1)))) {
      let value = "";
      if (peek() === "-") value += advance();
      while (i < source.length && (isDigit(peek()) || peek() === ".")) {
        value += advance();
      }
      tokens.push({ type: "number", value, line: startLine, col: startCol });
      continue;
    }

    // Identifier / keyword
    if (isIdentStart(ch)) {
      let value = "";
      while (i < source.length && isIdentPart(peek())) {
        value += advance();
      }
      tokens.push({ type: "ident", value, line: startLine, col: startCol });
      continue;
    }

    throw new LexError(`unexpected character "${ch}"`, startLine);
  }

  tokens.push({ type: "eof", value: "", line, col });
  return tokens;
}
