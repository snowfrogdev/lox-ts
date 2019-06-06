import { Token } from "./token";

export class RuntimeError extends Error{
  constructor(readonly token: Token, message: string) {
    super(message)
  }
}