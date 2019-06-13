import { LoxCallable } from './lox-callable';
import { Interpreter } from './interpreter';
import { LoxInstance } from './lox-instance';
import { LoxFunction } from './lox-function';

export class LoxClass extends LoxCallable {
  constructor(
    readonly name: string,
    readonly superclass: LoxClass,
    private readonly methods_: Map<string, LoxFunction>
  ) {
    super();
  }

  findMethod(name: string): LoxFunction | null {
    if (this.methods_.has(name)) {
      return this.methods_.get(name) as LoxFunction;
    }

    if (this.superclass) {
      return this.superclass.findMethod(name);
    }

    return null;
  }

  toString(): string {
    return this.name;
  }

  call(interpreter: Interpreter, args: any[]): any {
    const instance: LoxInstance = new LoxInstance(this);
    const initializer: LoxFunction | null = this.findMethod('init');
    if (initializer) {
      initializer.bind(instance).call(interpreter, args);
    }

    return instance;
  }

  arity(): number {
    const initializer = this.findMethod('init');
    if (!initializer) return 0;
    return initializer.arity();
  }
}
