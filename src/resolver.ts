import * as Expr from './expr';
import * as Stmt from './stmt';
import { Interpreter } from './interpreter';
import { Token } from './token';
import { Lox } from './lox';

enum FunctionType {
  NONE,
  FUNCTION,
  INITIALIZER,
  METHOD
}

enum ClassType {
  NONE,
  CLASS,
  SUBCLASS
}
export class Resolver implements Expr.Visitor<null>, Stmt.Visitor<null> {
  private readonly scopes_: Map<string, boolean>[] = [];
  private currentFunction_: FunctionType = FunctionType.NONE;
  private currentClass_: ClassType = ClassType.NONE;
  constructor(private readonly interpreter_: Interpreter) {}

  resolve(statements: (Stmt.Stmt | null)[]): void {
    for (const statement of statements) {
      this.resolve_(statement);
    }
  }

  visitBlockStmt(stmt: Stmt.Block): null {
    this.beginScope_();
    this.resolve(stmt.statements);
    this.endScope_();
    return null;
  }

  visitClassStmt(stmt: Stmt.Class): null {
    const enclosingClass: ClassType = this.currentClass_;
    this.currentClass_ = ClassType.CLASS;

    this.declare_(stmt.name);
    this.define_(stmt.name);

    if (stmt.superclass && stmt.name.lexeme === stmt.superclass.name.lexeme) {
      Lox.error(stmt.superclass.name, 'A class cannot inherit from itself.');
    }

    if (stmt.superclass) {
      this.currentClass_ = ClassType.SUBCLASS;
      this.resolve_(stmt.superclass);
    }

    if (stmt.superclass) {
      this.beginScope_();
      this.scopes_[this.scopes_.length - 1].set('super', true);
    }

    this.beginScope_();
    this.scopes_[this.scopes_.length - 1].set('this', true);

    for (const method of stmt.methods) {
      let declaration: FunctionType = FunctionType.METHOD;
      if (method.name.lexeme === 'init') {
        declaration = FunctionType.INITIALIZER;
      }
      this.resolveFunction_(method, declaration);
    }

    this.endScope_();

    if (stmt.superclass) this.endScope_();

    this.currentClass_ = enclosingClass;
    return null;
  }

  visitExpressionStmt(stmt: Stmt.Expression): null {
    this.resolve_(stmt.expression);
    return null;
  }

  visitFunctionStmt(stmt: Stmt.Function): null {
    this.declare_(stmt.name);
    this.define_(stmt.name);

    this.resolveFunction_(stmt, FunctionType.FUNCTION);
    return null;
  }

  visitIfStmt(stmt: Stmt.If): null {
    this.resolve_(stmt.condition);
    this.resolve_(stmt.thenBranch);
    if (stmt.elseBranch) this.resolve_(stmt.elseBranch);
    return null;
  }

  visitPrintStmt(stmt: Stmt.Print): null {
    this.resolve_(stmt.expression);
    return null;
  }

  visitReturnStmt(stmt: Stmt.Return): null {
    if (this.currentFunction_ === FunctionType.NONE) {
      Lox.error(stmt.keyword, 'Cannot return from top-level code.');
    }
    if (stmt.value !== null && stmt.value !== undefined) {
      if (this.currentFunction_ === FunctionType.INITIALIZER) {
        Lox.error(stmt.keyword, 'Cannot return a value from an initializer.');
      }
      this.resolve_(stmt.value);
    }
    return null;
  }

  visitVarStmt(stmt: Stmt.Var): null {
    this.declare_(stmt.name);
    if (stmt.initializer) {
      this.resolve_(stmt.initializer);
    }
    this.define_(stmt.name);
    return null;
  }

  visitWhileStmt(stmt: Stmt.While): null {
    this.resolve_(stmt.condition);
    this.resolve_(stmt.body);
    return null;
  }

  visitAssignExpr(expr: Expr.Assign): null {
    this.resolve_(expr.value);
    this.resolveLocal_(expr, expr.name);
    return null;
  }

  visitBinaryExpr(expr: Expr.Binary): null {
    this.resolve_(expr.left);
    this.resolve_(expr.right);
    return null;
  }

  visitCallExpr(expr: Expr.Call): null {
    this.resolve_(expr.callee);

    for (const argument of expr.args) {
      this.resolve_(argument);
    }

    return null;
  }

  visitGetExpr(expr: Expr.Get): null {
    this.resolve_(expr.object);
    return null;
  }

  visitGroupingExpr(expr: Expr.Grouping): null {
    this.resolve_(expr.expression);
    return null;
  }

  visitLiteralExpr(expr: Expr.Literal): null {
    return null;
  }

  visitLogicalExpr(expr: Expr.Logical): null {
    this.resolve_(expr.left);
    this.resolve_(expr.right);
    return null;
  }

  visitSetExpr(expr: Expr.Set): null {
    this.resolve_(expr.value);
    this.resolve_(expr.object);
    return null;
  }

  visitSuperExpr(expr: Expr.Super): null {
    if (this.currentClass_ === ClassType.NONE) {
      Lox.error(expr.keyword, "Cannot use 'super' outside of a class.");
    } else if(this.currentClass_ !== ClassType.SUBCLASS) {
      Lox.error(expr.keyword, "Cannot use 'super' in a class with no superclass.");
    }
    
    this.resolveLocal_(expr, expr.keyword);
    return null;
  }

  visitThisExpr(expr: Expr.This): null {
    if (this.currentClass_ === ClassType.NONE) {
      Lox.error(expr.keyword, "Cannot use 'this' outside of a class.");
      return null;
    }

    this.resolveLocal_(expr, expr.keyword);
    return null;
  }

  visitUnaryExpr(expr: Expr.Unary): null {
    this.resolve_(expr.right);
    return null;
  }

  visitVariableExpr(expr: Expr.Variable): null {
    if (
      this.scopes_.length &&
      this.scopes_[this.scopes_.length - 1].get(expr.name.lexeme) === false
    ) {
      Lox.error(expr.name, 'Cannot read local variable in its own initializer.');
    }

    this.resolveLocal_(expr, expr.name);
    return null;
  }

  private resolve_(expr: Expr.Expr | null): void;
  private resolve_(stmt: Stmt.Stmt | null): void;
  private resolve_(exprOrStmt: Stmt.Stmt | Expr.Expr | null): void {
    if (exprOrStmt instanceof Expr.Expr) {
      exprOrStmt.accept(this);
    } else if (exprOrStmt instanceof Stmt.Stmt) {
      exprOrStmt.accept(this);
    }
  }

  private resolveFunction_(func: Stmt.Function, type: FunctionType) {
    const enclosingFunction: FunctionType = this.currentFunction_;
    this.currentFunction_ = type;

    this.beginScope_();
    for (const param of func.params) {
      this.declare_(param);
      this.define_(param);
    }
    this.resolve(func.body);
    this.endScope_();
    this.currentFunction_ = enclosingFunction;
  }

  private beginScope_(): void {
    this.scopes_.push(new Map<string, boolean>());
  }

  private endScope_(): void {
    this.scopes_.pop();
  }

  private declare_(name: Token): void {
    if (this.scopes_.length === 0) return;

    const scope: Map<string, boolean> = this.scopes_[this.scopes_.length - 1];
    if (scope.has(name.lexeme)) {
      Lox.error(name, 'Variable with this name already declared in this scope.');
    }
    scope.set(name.lexeme, false);
  }

  private define_(name: Token): void {
    if (this.scopes_.length === 0) return;
    this.scopes_[this.scopes_.length - 1].set(name.lexeme, true);
  }

  private resolveLocal_(expr: Expr.Expr, name: Token): void {
    for (let i = this.scopes_.length - 1; i >= 0; i--) {
      if (this.scopes_[i].has(name.lexeme)) {
        this.interpreter_.resolve(expr, this.scopes_.length - 1 - i);
        return;
      }
    }
  }
}
