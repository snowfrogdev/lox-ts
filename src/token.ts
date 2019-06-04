import { TokenType } from "./token-type";

export class Token {
  constructor(
    readonly type: TokenType,
    readonly lexeme: string,
    readonly literal: {} | undefined,
    readonly line: number
  ) {}

  toString(): string {
    return `${this.type} ${this.lexeme} ${this.literal}`;
  }
}
