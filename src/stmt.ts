import { Expr } from "./expr";
import { Token } from "./token";

export interface Visitor<R> {
  visitBlockStmt(stmt: Block): R;
  visitExpressionStmt(stmt: Expression): R;
  visitIfStmt(stmt: If): R;
  visitPrintStmt(stmt: Print): R;
  visitVarStmt(stmt: Var): R;
}

export abstract class Stmt {
  abstract accept<R>(visitor: Visitor<R>): R
}


export class Block extends Stmt {
  constructor(readonly statements: (Stmt | null)[]) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {     
      return visitor.visitBlockStmt(this);
  }
}

export class Expression extends Stmt {
  constructor(readonly expression: Expr) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {     
      return visitor.visitExpressionStmt(this);
  }
}

export class If extends Stmt {
  constructor(readonly condition: Expr, readonly thenBranch: Stmt, readonly elseBranch?: Stmt) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {     
      return visitor.visitIfStmt(this);
  }
}

export class Print extends Stmt {
  constructor(readonly expression: Expr) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {     
      return visitor.visitPrintStmt(this);
  }
}

export class Var extends Stmt {
  constructor(readonly name: Token, readonly initializer?: Expr) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {     
      return visitor.visitVarStmt(this);
  }
}

