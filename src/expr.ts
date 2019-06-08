import { Token } from "./token";

export interface Visitor<R> {
  visitAssignExpr(expr: Assign): R;
  visitBinaryExpr(expr: Binary): R;
  visitGroupingExpr(expr: Grouping): R;
  visitLiteralExpr(expr: Literal): R;
  visitUnaryExpr(expr: Unary): R;
  visitVariableExpr(expr: Variable): R;
}

export abstract class Expr {
  abstract accept<R>(visitor: Visitor<R>): R
}


export class Assign extends Expr {
  constructor(readonly name: Token, readonly value: Expr) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {     
      return visitor.visitAssignExpr(this);
  }
}

export class Binary extends Expr {
  constructor(readonly left: Expr, readonly operator: Token, readonly right: Expr) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {     
      return visitor.visitBinaryExpr(this);
  }
}

export class Grouping extends Expr {
  constructor(readonly expression: Expr) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {     
      return visitor.visitGroupingExpr(this);
  }
}

export class Literal extends Expr {
  constructor(readonly value: any) {
    super();
  }

  valueOf() {
    return this.value;
  }

  accept<R>(visitor: Visitor<R>): R {     
      return visitor.visitLiteralExpr(this);
  }
}

export class Unary extends Expr {
  constructor(readonly operator: Token, readonly right: Expr) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {     
      return visitor.visitUnaryExpr(this);
  }
}

export class Variable extends Expr {
  constructor(readonly name: Token) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {     
      return visitor.visitVariableExpr(this);
  }
}

