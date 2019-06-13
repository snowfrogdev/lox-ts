import { LoxCallable } from './lox-callable';
import * as Stmt from './stmt';
import { Interpreter } from './interpreter';
import { Environment } from './environment';
import { Return } from './return';
import { LoxInstance } from './lox-instance';

export class LoxFunction extends LoxCallable {
  constructor(
    private readonly declaration_: Stmt.Function,
    private readonly closure_: Environment,
    private readonly isInitializer_: boolean
  ) {
    super();
  }

  bind(instance: LoxInstance): LoxFunction {
    const environment: Environment = new Environment(this.closure_);
    environment.define('this', instance);
    return new LoxFunction(this.declaration_, environment, this.isInitializer_);
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
      if (this.isInitializer_) return this.closure_.getAt(0, 'this');
      
      return (<Return>returnValue).value;
    }

    if (this.isInitializer_) return this.closure_.getAt(0, 'this');
    return null;
  }
}
