import { Token } from "./token";
import { RuntimeError } from "./runtime-error";

export class Environment {
  readonly values = new Map<string, any>();
  constructor(readonly enclosing?: Environment) {}

  get(name: Token): any {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme);
    }

    if (this.enclosing) return this.enclosing.get(name)

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  assign(name: Token, value: any) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  define(name: string, value: any): void {
    this.values.set(name, value);
  }

  ancestor(distance: number): Environment {
    let environement: Environment = this
    for(let i = 0; i < distance; i++) {
      environement = environement.enclosing as Environment
    }
    return environement
  }

  getAt(distance: number, name: string): any {
    return this.ancestor(distance).values.get(name)
  }

  assignAt(distance: number, name: Token, value: any) {
    this.ancestor(distance).values.set(name.lexeme, value)
  }
}
