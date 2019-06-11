import { LoxCallable } from './lox-callable';
import * as Stmt from './stmt';
import { Interpreter } from './interpreter';
import { Environment } from './environment';
import { Return } from './return';

export class LoxFunction extends LoxCallable {
  constructor(private readonly declaration_: Stmt.Function, private readonly closure_: Environment) {
    super();
  }

  toString(): string {
    return `<fn ${this.declaration_.name.lexeme}>`;
  }

  arity(): number {
    return this.declaration_.params.length;
  }

  call(interpreter: Interpreter, args: any[]): any {
    const environment: Environment = new Environment(this.closure_);
    for (let i = 0; i < this.declaration_.params.length; i++) {
      environment.define(this.declaration_.params[i].lexeme, args[i]);
    }

    try {
      interpreter.executeBlock(this.declaration_.body, environment);
    } catch (returnValue) {
      return (<Return>returnValue).value
    }

    
    return null;
  }
}
