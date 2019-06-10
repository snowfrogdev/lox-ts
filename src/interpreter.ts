import * as Expr from "./expr";
import { Lox } from "./lox";
import { RuntimeError } from "./runtime-error";
import * as Stmt from "./stmt";
import { Token } from "./token";
import { TokenType } from "./token-type";
import { Environment } from "./environment";

export class Interpreter implements Expr.Visitor<any>, Stmt.Visitor<void> {
  private environment_ = new Environment();

  interpret(statements: (Stmt.Stmt | null)[]): void {
    try {
      for (const statement of statements) {
        this.execute_(statement);
      }
    } catch (error) {
      Lox.runtimeError(error);
    }
  }

  visitLiteralExpr(expr: Expr.Literal): any {
    return expr;
  }

  visitLogicalExpr(expr: Expr.Logical): any {
    const left = this.evaluate_(expr.left)

    if (expr.operator.type === TokenType.OR) {
      if (this.isTruthy_(left)) return left
    } else {
      if (!this.isTruthy_(left)) return left
    }

    return this.evaluate_(expr.right)
  }

  visitUnaryExpr(expr: Expr.Unary): any {
    const right: any = this.evaluate_(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy_(right);
      case TokenType.MINUS:
        this.checkNumberOperand_(expr.operator, right);
        return -(<number>right);
    }

    // Unreachable
    return null;
  }

  visitVariableExpr(expr: Expr.Variable): any {
    return this.environment_.get(expr.name);
  }

  private checkNumberOperand_(operator: Token, operand: any) {
    if (typeof operand.valueOf() === "number") return;

    throw new RuntimeError(operator, "Operand must be a number.");
  }

  private checkNumberOperands_(operator: Token, left: any, right: any) {
    if (
      typeof left.valueOf() === "number" &&
      typeof right.valueOf() === "number"
    )
      return;

    throw new RuntimeError(operator, "Operands must be numbers.");
  }

  private isTruthy_(object: any): boolean {
    if (object === null || object === undefined) return false;
    if (typeof object === "boolean") return object;
    return true;
  }

  private isEqual_(a: any, b: any): boolean {
    // nil is only equal to nil
    if (
      (a.valueOf() === null || a.valueOf() === undefined) &&
      (b.valueOf() === null || b.valueOf() === undefined)
    )
      return true;
    if (a.valueOf() === null || a.valueOf() === undefined) return false;

    return a.valueOf() === b.valueOf();
  }

  private stringify_(object: any): string {
    if (object === null && object === undefined) return "nil";

    if (object.value) return object.value;
    return object.toString();
  }

  visitGroupingExpr(expr: Expr.Grouping): any {
    return this.evaluate_(expr.expression);
  }

  private evaluate_(expr: Expr.Expr): any {
    return expr.accept(this);
  }

  private execute_(stmt: Stmt.Stmt | null): void {
    stmt!.accept(this); // Temporary !, this should be removed
  }

  private executeBlock_(
    statements: (Stmt.Stmt | null)[],
    environment: Environment
  ): void {
    const previous: Environment = this.environment_;
    try {
      this.environment_ = environment;

      for (const statement of statements) {
        this.execute_(statement);
      }
    } finally {
      this.environment_ = previous;
    }
  }

  visitBlockStmt(stmt: Stmt.Block): null {
    this.executeBlock_(stmt.statements, new Environment(this.environment_));
    return null;
  }

  visitExpressionStmt(stmt: Stmt.Expression): null {
    this.evaluate_(stmt.expression);
    return null;
  }

  visitIfStmt(stmt: Stmt.If): null {
    if (this.isTruthy_(this.evaluate_(stmt.condition))) {
      this.execute_(stmt.thenBranch)
    } else if (stmt.elseBranch) {
      this.execute_(stmt.elseBranch)
    }
    return null;
  }

  visitPrintStmt(stmt: Stmt.Print): null {
    const value: any = this.evaluate_(stmt.expression);
    console.log(this.stringify_(value));
    return null;
  }

  visitVarStmt(stmt: Stmt.Var): null {
    let value: any;
    if (stmt.initializer) {
      value = this.evaluate_(stmt.initializer);
    }

    this.environment_.define(stmt.name.lexeme, value);
    return null;
  }

  visitAssignExpr(expr: Expr.Assign): any {
    const value: any = this.evaluate_(expr.value);

    this.environment_.assign(expr.name, value);
    return value;
  }

  visitBinaryExpr(expr: Expr.Binary): any {
    const left: any = this.evaluate_(expr.left);
    const right: any = this.evaluate_(expr.right);

    switch (expr.operator.type) {
      case TokenType.GREATER:
        this.checkNumberOperands_(expr.operator, left, right);
        return <number>left > <number>right;
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands_(expr.operator, left, right);
        return <number>left >= <number>right;
      case TokenType.LESS:
        this.checkNumberOperands_(expr.operator, left, right);
        return <number>left < <number>right;
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands_(expr.operator, left, right);
        return <number>left <= <number>right;
      case TokenType.MINUS:
        this.checkNumberOperands_(expr.operator, left, right);
        return <number>left - <number>right;
      case TokenType.PLUS:
        if (
          typeof left.valueOf() === "number" &&
          typeof right.valueOf() === "number"
        ) {
          return left + right;
        }

        if (
          typeof left.valueOf() === "string" &&
          typeof right.valueOf() === "string"
        ) {
          return left + right;
        }

        throw new RuntimeError(
          expr.operator,
          "Operands must be two numbers or two strings."
        );
      case TokenType.SLASH:
        this.checkNumberOperands_(expr.operator, left, right);
        return <number>left / <number>right;
      case TokenType.STAR:
        this.checkNumberOperands_(expr.operator, left, right);
        return <number>left * <number>right;
      case TokenType.BANG_EQUAL:
        return !this.isEqual_(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual_(left, right);
    }

    // Unreachable
    return null;
  }
}
