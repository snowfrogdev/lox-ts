/* import * as Expr from "./expr";

export class AstPrinter implements Expr.Visitor<string> {
  print(expr: Expr.Expr): string {
    return expr.accept(this);
  }

  visitBinaryExpr(expr: Expr.Binary): string {
    return this.parenthesize_(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGroupingExpr(expr: Expr.Grouping): string {
    return this.parenthesize_("group", expr.expression);
  }

  visitLiteralExpr(expr: Expr.Literal): string {
    if (expr.value === null || expr.value === undefined) return "nil";
    return expr.value.toString();
  }

  visitUnaryExpr(expr: Expr.Unary): string {
    return this.parenthesize_(expr.operator.lexeme, expr.right);
  }

  private parenthesize_(name: string, ...exprs: Expr.Expr[]): string {
    let str = `(${name}`;
    for (const expr of exprs) {
      str += " ";
      str += expr.accept(this);
    }
    str += ")";
    return str;
  }
}
*/
