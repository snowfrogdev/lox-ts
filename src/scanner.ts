import { Token } from "./token";
import { TokenType } from "./token-type";
import { Lox } from "./lox";

export class Scanner {
  private readonly tokens_: Token[] = [];
  private start_ = 0;
  private current_ = 0;
  private line_ = 1;
  private static readonly keywords: Map<string, TokenType> = new Map([
    ["and", TokenType.AND],
    ["class", TokenType.CLASS],
    ["else", TokenType.ELSE],
    ["false", TokenType.FALSE],
    ["for", TokenType.FOR],
    ["fun", TokenType.FUN],
    ["if", TokenType.IF],
    ["nil", TokenType.NIL],
    ["or", TokenType.OR],
    ["print", TokenType.PRINT],
    ["return", TokenType.RETURN],
    ["super", TokenType.SUPER],
    ["this", TokenType.THIS],
    ["true", TokenType.TRUE],
    ["var", TokenType.VAR],
    ["while", TokenType.WHILE]
  ]);
  constructor(private readonly source_: string) {}

  scanTokens(): Token[] {
    while (!this.isAtEnd_()) {
      this.start_ = this.current_;
      this.scanToken_();
    }

    this.tokens_.push(new Token(TokenType.EOF, "", undefined, this.line_));
    return this.tokens_;
  }

  private scanToken_() {
    const char = this.advance_();
    switch (char) {
      case "(":
        this.addToken_(TokenType.LEFT_PAREN);
        break;
      case ")":
        this.addToken_(TokenType.RIGHT_PAREN);
        break;
      case "{":
        this.addToken_(TokenType.LEFT_BRACE);
        break;
      case "}":
        this.addToken_(TokenType.RIGHT_BRACE);
        break;
      case ",":
        this.addToken_(TokenType.COMMA);
        break;
      case ".":
        this.addToken_(TokenType.DOT);
        break;
      case "-":
        this.addToken_(TokenType.MINUS);
        break;
      case "+":
        this.addToken_(TokenType.PLUS);
        break;
      case ";":
        this.addToken_(TokenType.SEMICOLON);
        break;
      case "*":
        this.addToken_(TokenType.STAR);
        break;
      case "!":
        this.addToken_(
          this.match_("=") ? TokenType.BANG_EQUAL : TokenType.BANG
        );
        break;
      case "=":
        this.addToken_(
          this.match_("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL
        );
        break;
      case "<":
        this.addToken_(
          this.match_("=") ? TokenType.LESS_EQUAL : TokenType.LESS
        );
        break;
      case ">":
        this.addToken_(
          this.match_("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
        break;
      case "/":
        if (this.match_("/")) {
          // A comment goes until the end of the line.
          while (this.peek_() != "\n" && !this.isAtEnd_()) this.advance_();
        } else {
          this.addToken_(TokenType.SLASH);
        }
        break;
      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace.
        break;
      case "\n":
        this.line_++;
        break;
      case '"':
        this.string_();
        break;
      default:
        if (this.isDigit_(char)) {
          this.number_();
        } else if (this.isAlpha_(char)) {
          this.identifier_();
        } else {
          Lox.error(this.line_, "Unexpected character.");
        }
        break;
    }
  }

  private identifier_() {
    while (this.isAlphaNumeric_(this.peek_())) {
      this.advance_();
    }

    // See if the identifier is reserverd word.
    const text = this.source_.substring(this.start_, this.current_);

    let type = Scanner.keywords.get(text);
    if (!type) type = TokenType.IDENTIFIER;
    this.addToken_(type);
  }

  private number_() {
    while (this.isDigit_(this.peek_())) this.advance_();

    // Look for a fractional part.
    if (this.peek_() === "." && this.isDigit_(this.peekNext_())) {
      // Consume the '.'
      this.advance_();

      while (this.isDigit_(this.peek_())) this.advance_();
    }

    this.addToken_(
      TokenType.NUMBER,
      parseFloat(this.source_.substring(this.start_, this.current_))
    );
  }

  private string_() {
    while (this.peek_() !== '"' && !this.isAtEnd_()) {
      if (this.peek_() === "\n") this.line_++;
      this.advance_();
    }

    if (this.isAtEnd_()) {
      Lox.error(this.line_, "Unterminated string.");
      return;
    }

    // The closing ".
    this.advance_();

    // Trim the surrounding quotes.
    const value = this.source_.substring(this.start_ + 1, this.current_ - 1);
    this.addToken_(TokenType.STRING, value);
  }

  private match_(expected: string): boolean {
    if (this.isAtEnd_()) return false;
    if (this.source_[this.current_] !== expected) return false;

    this.current_++;
    return true;
  }

  private peek_(): string {
    if (this.isAtEnd_()) return "\0";
    return this.source_[this.current_];
  }

  private peekNext_(): string {
    if (this.current_ + 1 >= this.source_.length) return "\0";
    return this.source_[this.current_ + 1];
  }

  private isAlpha_(char: string): boolean {
    return (
      (char >= "a" && char <= "z") ||
      (char >= "A" && char <= "Z") ||
      char == "_"
    );
  }

  private isAlphaNumeric_(char: string): boolean {
    return this.isAlpha_(char) || this.isDigit_(char);
  }

  private isDigit_(char: string): boolean {
    return char >= "0" && char <= "9";
  }

  private isAtEnd_(): boolean {
    return this.current_ >= this.source_.length;
  }

  private advance_(): string {
    this.current_++;
    return this.source_[this.current_ - 1];
  }

  private addToken_(type: TokenType, literal?: {}) {
    const text = this.source_.substring(this.start_, this.current_);
    this.tokens_.push(new Token(type, text, literal, this.line_));
  }
}
