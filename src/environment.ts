import { Token } from "./token";
import { RuntimeError } from "./runtime-error";

export class Environment {
  private readonly values_ = new Map<string, any>();
  constructor(readonly enclosing?: Environment) {}

  get(name: Token): any {
    if (this.values_.has(name.lexeme)) {
      return this.values_.get(name.lexeme);
    }

    if (this.enclosing) return this.enclosing.get(name)

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  assign(name: Token, value: any) {
    if (this.values_.has(name.lexeme)) {
      this.values_.set(name.lexeme, value);
      return;
    }

    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  define(name: string, value: any): void {
    this.values_.set(name, value);
  }
}
