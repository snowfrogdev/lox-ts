import { Token } from './token';
import * as Expr from './expr';
import { TokenType } from './token-type';
import { Lox } from './lox';
import * as Stmt from './stmt';

export class Parser {
  private current_ = 0;
  constructor(private readonly tokens_: Token[]) {}

  parse(): (Stmt.Stmt | null)[] {
    const statements: (Stmt.Stmt | null)[] = [];
    while (!this.isAtEnd_()) {
      statements.push(this.declaration_());
    }

    return statements;
  }

  private expression_(): Expr.Expr {
    return this.assignment_();
  }

  private declaration_(): Stmt.Stmt | null {
    try {
      if (this.match_(TokenType.CLASS)) return this.classDeclaration_();
      if (this.match_(TokenType.FUN)) return this.function_('function');
      if (this.match_(TokenType.VAR)) return this.varDeclaration_();

      return this.statement_();
    } catch (error) {
      this.synchronize_();
      return null;
    }
  }

  private classDeclaration_(): Stmt.Stmt {
    const name: Token = this.consume_(TokenType.IDENTIFIER, 'Expect class name.');
    this.consume_(TokenType.LEFT_BRACE, "Expect '{' before class body.");

    const methods: Stmt.Function[] = [];
    while (!this.check_(TokenType.RIGHT_BRACE) && !this.isAtEnd_()) {
      methods.push(this.function_('method'));
    }

    this.consume_(TokenType.RIGHT_BRACE, "Expect '}' after class body.");

    return new Stmt.Class(name, methods);
  }

  private statement_(): Stmt.Stmt {
    if (this.match_(TokenType.FOR)) return this.forStatement_();
    if (this.match_(TokenType.IF)) return this.ifStatement_();
    if (this.match_(TokenType.PRINT)) return this.printStatement_();
    if (this.match_(TokenType.RETURN)) return this.returnStatement_();
    if (this.match_(TokenType.WHILE)) return this.whileStatement_();
    if (this.match_(TokenType.LEFT_BRACE)) return new Stmt.Block(this.block_());

    return this.expressionStatement_();
  }

  private forStatement_(): Stmt.Stmt {
    this.consume_(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

    let initializer: Stmt.Stmt | null;
    if (this.match_(TokenType.SEMICOLON)) {
      initializer = null;
    } else if (this.match_(TokenType.VAR)) {
      initializer = this.varDeclaration_();
    } else {
      initializer = this.expressionStatement_();
    }

    let condition: Expr.Expr | null = null;
    if (!this.check_(TokenType.SEMICOLON)) {
      condition = this.expression_();
    }
    this.consume_(TokenType.SEMICOLON, "Expect ';' after loop condition.");

    let increment: Expr.Expr | null = null;
    if (!this.check_(TokenType.RIGHT_PAREN)) {
      increment = this.expression_();
    }
    this.consume_(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

    let body: Stmt.Stmt = this.statement_();

    if (increment) {
      body = new Stmt.Block([body, new Stmt.Expression(increment)]);
    }

    if (!condition) condition = new Expr.Literal(true);
    body = new Stmt.While(condition, body);

    if (initializer) {
      body = new Stmt.Block([initializer, body]);
    }

    return body;
  }

  private ifStatement_(): Stmt.Stmt {
    this.consume_(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition: Expr.Expr = this.expression_();
    this.consume_(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch: Stmt.Stmt = this.statement_();
    let elseBranch: Stmt.Stmt | undefined;
    if (this.match_(TokenType.ELSE)) {
      elseBranch = this.statement_();
    }

    return new Stmt.If(condition, thenBranch, elseBranch);
  }

  private printStatement_(): Stmt.Stmt {
    const value: Expr.Expr = this.expression_();
    this.consume_(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Stmt.Print(value);
  }

  private returnStatement_(): Stmt.Stmt {
    const keyword: Token = this.previous_();
    let value: Expr.Expr | undefined;
    if (!this.check_(TokenType.SEMICOLON)) {
      value = this.expression_();
    }

    this.consume_(TokenType.SEMICOLON, "Expect ';' after return value.");
    return new Stmt.Return(keyword, value);
  }

  private varDeclaration_(): Stmt.Stmt {
    const name: Token = this.consume_(TokenType.IDENTIFIER, 'Expect variable name.');

    let initializer: Expr.Expr | undefined;
    if (this.match_(TokenType.EQUAL)) {
      initializer = this.expression_();
    }

    this.consume_(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return new Stmt.Var(name, initializer);
  }

  private whileStatement_(): Stmt.Stmt {
    this.consume_(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition: Expr.Expr = this.expression_();
    this.consume_(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
    const body: Stmt.Stmt = this.statement_();

    return new Stmt.While(condition, body);
  }

  private expressionStatement_(): Stmt.Stmt {
    const expr: Expr.Expr = this.expression_();
    this.consume_(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new Stmt.Expression(expr);
  }

  private function_(kind: string): Stmt.Function {
    const name: Token = this.consume_(TokenType.IDENTIFIER, `Expect ${kind} name.`);
    this.consume_(TokenType.LEFT_PAREN, `Expect ${kind} name.`);
    const parameters: Token[] = [];
    if (!this.check_(TokenType.RIGHT_PAREN)) {
      do {
        if (parameters.length >= 8) {
          this.error_(this.peek_(), 'Cannot have more than 8 parameters.');
        }

        parameters.push(this.consume_(TokenType.IDENTIFIER, 'Expect parameter name.'));
      } while (this.match_(TokenType.COMMA));
    }
    this.consume_(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");

    this.consume_(TokenType.LEFT_BRACE, `Expect '{' before ${kind} body`);
    const body: (Stmt.Stmt | null)[] = this.block_();
    return new Stmt.Function(name, parameters, body);
  }

  private block_(): (Stmt.Stmt | null)[] {
    const statements: (Stmt.Stmt | null)[] = [];

    while (!this.check_(TokenType.RIGHT_BRACE) && !this.isAtEnd_()) {
      statements.push(this.declaration_());
    }

    this.consume_(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  private assignment_(): Expr.Expr {
    const expr: Expr.Expr = this.or_();

    if (this.match_(TokenType.EQUAL)) {
      const equals: Token = this.previous_();
      const value: Expr.Expr = this.assignment_();

      if (expr instanceof Expr.Variable) {
        const name: Token = expr.name;
        return new Expr.Assign(name, value);
      } else if (expr instanceof Expr.Get) {
        const get: Expr.Get = expr;
        return new Expr.Set(get.object, get.name, value)
      }

      this.error_(equals, 'Invalid assignement target.');
    }

    return expr;
  }

  private or_(): Expr.Expr {
    let expr: Expr.Expr = this.and_();

    while (this.match_(TokenType.OR)) {
      const operator: Token = this.previous_();
      const right = this.and_();
      expr = new Expr.Logical(expr, operator, right);
    }

    return expr;
  }

  private and_(): Expr.Expr {
    let expr: Expr.Expr = this.equality_();

    while (this.match_(TokenType.AND)) {
      const operator = this.previous_();
      const right = this.equality_();
      expr = new Expr.Logical(expr, operator, right);
    }

    return expr;
  }

  private equality_(): Expr.Expr {
    let expr: Expr.Expr = this.comparison_();

    while (this.match_(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator: Token = this.previous_();
      const right: Expr.Expr = this.comparison_();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  private comparison_(): Expr.Expr {
    let expr: Expr.Expr = this.addition_();
    while (
      this.match_(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)
    ) {
      const operator: Token = this.previous_();
      const right: Expr.Expr = this.addition_();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  private addition_(): Expr.Expr {
    let expr: Expr.Expr = this.multiplication_();
    while (this.match_(TokenType.MINUS, TokenType.PLUS)) {
      const operator: Token = this.previous_();
      const right: Expr.Expr = this.multiplication_();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  private multiplication_(): Expr.Expr {
    let expr: Expr.Expr = this.unary_();
    while (this.match_(TokenType.SLASH, TokenType.STAR)) {
      const operator: Token = this.previous_();
      const right: Expr.Expr = this.unary_();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  private unary_(): Expr.Expr {
    if (this.match_(TokenType.BANG, TokenType.MINUS)) {
      const operator: Token = this.previous_();
      const right: Expr.Expr = this.unary_();
      return new Expr.Unary(operator, right);
    }

    return this.call_();
  }

  private finishCall_(callee: Expr.Expr): Expr.Expr {
    const args: Expr.Expr[] = [];
    if (!this.check_(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length >= 8) {
          this.error_(this.peek_(), 'Cannot have more than 8 arguments.');
        }
        args.push(this.expression_());
      } while (this.match_(TokenType.COMMA));
    }

    const paren = this.consume_(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");

    return new Expr.Call(callee, paren, args);
  }

  private call_(): Expr.Expr {
    let expr: Expr.Expr = this.primary_();

    while (true) {
      if (this.match_(TokenType.LEFT_PAREN)) {
        expr = this.finishCall_(expr);
      } else if (this.match_(TokenType.DOT)) {
        const name: Token = this.consume_(TokenType.IDENTIFIER, "Expect property name after '.'.");
        expr = new Expr.Get(expr, name);
      } else {
        break;
      }
    }

    return expr;
  }

  private primary_(): Expr.Expr {
    if (this.match_(TokenType.FALSE)) return new Expr.Literal(false);
    if (this.match_(TokenType.TRUE)) return new Expr.Literal(true);
    if (this.match_(TokenType.NIL)) return new Expr.Literal(null);

    if (this.match_(TokenType.NUMBER, TokenType.STRING)) {
      return new Expr.Literal(this.previous_().literal);
    }

    if (this.match_(TokenType.THIS)) {
      return new Expr.This(this.previous_());
    }

    if (this.match_(TokenType.IDENTIFIER)) {
      return new Expr.Variable(this.previous_());
    }

    if (this.match_(TokenType.LEFT_PAREN)) {
      const expr: Expr.Expr = this.expression_();
      this.consume_(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new Expr.Grouping(expr);
    }

    throw this.error_(this.peek_(), 'Expect expression.');
  }

  private match_(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check_(type)) {
        this.advance_();
        return true;
      }
    }

    return false;
  }

  private consume_(type: TokenType, message: string): Token {
    if (this.check_(type)) return this.advance_();

    throw this.error_(this.peek_(), message);
  }

  private check_(type: TokenType): boolean {
    if (this.isAtEnd_()) return false;
    return this.peek_().type === type;
  }

  private advance_(): Token {
    if (!this.isAtEnd_()) this.current_++;
    return this.previous_();
  }

  private isAtEnd_(): boolean {
    return this.peek_().type === TokenType.EOF;
  }

  private peek_(): Token {
    return this.tokens_[this.current_];
  }

  private previous_(): Token {
    return this.tokens_[this.current_ - 1];
  }

  private error_(token: Token, message: string): ParseError {
    Lox.error(token, message);
    return new ParseError();
  }

  private synchronize_() {
    this.advance_();

    while (!this.isAtEnd_()) {
      if (this.previous_().type === TokenType.SEMICOLON) return;

      switch (this.peek_().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance_();
    }
  }
}

class ParseError extends Error {}
