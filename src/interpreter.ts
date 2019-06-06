import * as Expr from "./expr";
import { RuntimeError } from "./runtime-error";
import { Token } from "./token";
import { TokenType } from "./token-type";
import { Lox } from "./lox";

export class Interpreter implements Expr.Visitor<any> {
  interpret(expression: Expr.Expr) {
    try {
      const value: any = this.evaluate_(expression);
      // 7.4 in the book uses a custom stringify function but we don't need it in JS
      console.log(value);
    } catch (error) {
      Lox.runtimeError(error);
    }
  }

  visitLiteralExpr(expr: Expr.Literal): any {
    return expr;
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

  visitGroupingExpr(expr: Expr.Grouping): any {
    return this.evaluate_(expr.expression);
  }

  private evaluate_(expr: Expr.Expr): any {
    return expr.accept(this);
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
