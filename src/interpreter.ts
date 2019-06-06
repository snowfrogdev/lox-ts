import * as Expr from "./expr";
import { RuntimeError } from "./runtime-error";
import { Token } from "./token";
import { TokenType } from "./token-type";
import { Lox } from "./lox";

export class Interpreter implements Expr.Visitor<{}> {
  interpret(expression: Expr.Expr) {
    try {
      const value: {} = this.evaluate_(expression);
      // 7.4 in the book uses a custom stringify function but we don't need it in JS
      console.log(value);
    } catch (error) {
      Lox.runtimeError(error);
    }
  }

  visitLiteralExpr(expr: Expr.Literal): {} {
    return expr;
  }

  visitUnaryExpr(expr: Expr.Unary): {} {
    const right: {} = this.evaluate_(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy_(right);
      case TokenType.MINUS:
        this.checkNumberOperand_(expr.operator, right);
        return -(<number>right);
    }

    // Unreachable - the book uses null here
    return {};
  }

  private checkNumberOperand_(operator: Token, operand: {}) {
    if (typeof operand === "number") return;

    throw new RuntimeError(operator, "Operand must be a number.");
  }

  private checkNumberOperands_(operator: Token, left: {}, right: {}) {
    if (typeof left === "number" && typeof right === "number") return;

    throw new RuntimeError(operator, "Operands must be numbers.");
  }

  private isTruthy_(object: {}): boolean {
    if (object === null || object === undefined) return false;
    if (typeof object === "boolean") return object;
    return true;
  }

  private isEqual_(a: {}, b: {}): boolean {
    // nil is only equal to nil
    if ((a === null || a === undefined) && (b === null || b === undefined))
      return true;
    if (a === null || a === undefined) return false;

    return a === b;
  }

  

  visitGroupingExpr(expr: Expr.Grouping): {} {
    return this.evaluate_(expr.expression);
  }

  private evaluate_(expr: Expr.Expr): {} {
    return expr.accept(this);
  }

  visitBinaryExpr(expr: Expr.Binary): {} {
    const left: {} = this.evaluate_(expr.left);
    const right: {} = this.evaluate_(expr.right);

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
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }

        if (typeof left === "string" && typeof right === "string") {
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

    // Unreachable - the book uses null here
    return {};
  }
}
