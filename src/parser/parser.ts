// Recursive-descent parser. Turns the token stream into a list of top-level
// statements (config / track / preset). Commas and newlines act as soft
// separators between statements, so the source stays forgiving to write.

import { tokenize, type Token } from "./lexer";
import {
  ParseError,
  type Arg,
  type Statement,
  type ValueNode,
} from "./ast";

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }

  private next(): Token {
    return this.tokens[this.pos++];
  }

  private atEnd(): boolean {
    return this.peek().type === "eof";
  }

  private expect(type: Token["type"], context: string): Token {
    const tok = this.peek();
    if (tok.type !== type) {
      throw new ParseError(
        `expected ${type} ${context} but found "${tok.value || tok.type}"`,
        tok.line
      );
    }
    return this.next();
  }

  /** Skip the soft separators (commas) that may sit between statements. */
  private skipSeparators(): void {
    while (this.peek().type === "comma") this.next();
  }

  parseProgram(): Statement[] {
    const statements: Statement[] = [];
    this.skipSeparators();
    while (!this.atEnd()) {
      statements.push(this.parseStatement());
      this.skipSeparators();
    }
    return statements;
  }

  private parseBlock(): Statement[] {
    this.expect("lbrace", "to open block");
    const statements: Statement[] = [];
    this.skipSeparators();
    while (this.peek().type !== "rbrace" && !this.atEnd()) {
      statements.push(this.parseStatement());
      this.skipSeparators();
    }
    this.expect("rbrace", "to close block");
    return statements;
  }

  private parseStatement(): Statement {
    const tok = this.peek();
    if (tok.type !== "ident") {
      throw new ParseError(
        `expected a statement but found "${tok.value || tok.type}"`,
        tok.line
      );
    }
    const name = this.next().value;

    // Property assignment: `key: value`
    if (this.peek().type === "colon") {
      this.next();
      const value = this.parseValue();
      return { type: "property", key: name, value, line: tok.line };
    }

    // Call statement: `name(args)` optionally followed by a `{ block }`
    let args: Arg[] = [];
    if (this.peek().type === "lparen") {
      args = this.parseArgList();
    }
    let block: Statement[] | null = null;
    if (this.peek().type === "lbrace") {
      block = this.parseBlock();
    }
    return { type: "call", name, args, block, line: tok.line };
  }

  private parseArgList(): Arg[] {
    this.expect("lparen", "to open argument list");
    const args: Arg[] = [];
    while (this.peek().type !== "rparen" && !this.atEnd()) {
      args.push(this.parseArg());
      if (this.peek().type === "comma") {
        this.next();
      } else {
        break;
      }
    }
    this.expect("rparen", "to close argument list");
    return args;
  }

  private parseArg(): Arg {
    // Named argument: `name: value` where name is a bare identifier.
    if (this.peek().type === "ident" && this.peek(1).type === "colon") {
      const name = this.next().value;
      this.next(); // colon
      const value = this.parseValue();
      return { name, value };
    }
    return { name: null, value: this.parseValue() };
  }

  private parseValue(): ValueNode {
    const tok = this.peek();
    switch (tok.type) {
      case "number":
        this.next();
        return { type: "number", value: parseFloat(tok.value), line: tok.line };
      case "string":
        this.next();
        return { type: "string", value: tok.value, line: tok.line };
      case "lbracket":
        return this.parseArray();
      case "ident": {
        this.next();
        // `name(...)` is a call value (e.g. synth(...), reverb(...)).
        if (this.peek().type === "lparen") {
          const args = this.parseArgList();
          return { type: "call", name: tok.value, args, line: tok.line };
        }
        // Bare identifier treated as a string-like value (e.g. up, lowpass).
        return { type: "ident", value: tok.value, line: tok.line };
      }
      default:
        throw new ParseError(
          `expected a value but found "${tok.value || tok.type}"`,
          tok.line
        );
    }
  }

  private parseArray(): ValueNode {
    const open = this.expect("lbracket", "to open array");
    const items: ValueNode[] = [];
    while (this.peek().type !== "rbracket" && !this.atEnd()) {
      items.push(this.parseValue());
      if (this.peek().type === "comma") {
        this.next();
      } else {
        break;
      }
    }
    this.expect("rbracket", "to close array");
    return { type: "array", items, line: open.line };
  }
}

export function parse(source: string): Statement[] {
  const tokens = tokenize(source);
  return new Parser(tokens).parseProgram();
}
