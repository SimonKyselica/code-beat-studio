// AST node types produced by the parser. The grammar is intentionally generic:
// every directive is a CallNode and every "key: value" is a PropertyNode. The
// interpreter gives meaning to specific names (track, play, reverb, ...).

export interface NumberValue {
  type: "number";
  value: number;
  line: number;
}

export interface StringValue {
  type: "string";
  value: string;
  line: number;
}

export interface IdentValue {
  type: "ident";
  value: string;
  line: number;
}

export interface ArrayValue {
  type: "array";
  items: ValueNode[];
  line: number;
}

export interface CallValue {
  type: "call";
  name: string;
  args: Arg[];
  line: number;
}

export type ValueNode =
  | NumberValue
  | StringValue
  | IdentValue
  | ArrayValue
  | CallValue;

export interface Arg {
  /** Present for named args like `wave: "sine"`. */
  name: string | null;
  value: ValueNode;
}

export interface PropertyNode {
  type: "property";
  key: string;
  value: ValueNode;
  line: number;
}

export interface CallStatement {
  type: "call";
  name: string;
  args: Arg[];
  block: Statement[] | null;
  line: number;
}

export type Statement = PropertyNode | CallStatement;

export class ParseError extends Error {
  line: number;
  constructor(message: string, line: number) {
    super(message);
    this.name = "ParseError";
    this.line = line;
  }
}
