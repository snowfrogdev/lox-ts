import { Interpreter } from "./interpreter";

export abstract class LoxCallable {
  abstract call(interpreter: Interpreter, args: any[]): any
  abstract arity(): number
}