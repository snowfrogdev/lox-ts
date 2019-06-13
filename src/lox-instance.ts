import { LoxClass } from './lox-class';
import { Token } from './token';
import { RuntimeError } from './runtime-error';
import { LoxFunction } from './lox-function';

export class LoxInstance {
  private readonly fields_: Map<string, any> = new Map()
  constructor(private klass_: LoxClass) {}

  get(name: Token): any {
    if(this.fields_.has(name.lexeme)) {
      return this.fields_.get(name.lexeme)
    }

    const method: LoxFunction | null = this.klass_.findMethod(name.lexeme)
    if (method) return method.bind(this);

    throw new RuntimeError(name, "Undefined property '" + name.lexeme + "'.");
  }

  set(name: Token, value: any): void {
    this.fields_.set(name.lexeme, value)
  }

  toString(): string {
    return this.klass_.name + ' instance';
  }
}
