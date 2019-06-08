import { readFileSync } from "fs";
import readline from "readline";
import { Scanner } from "./scanner";
import { Token } from "./token";
import { TokenType } from "./token-type";
import { Parser } from "./parser";
import { Expr } from "./expr";
import { RuntimeError } from "./runtime-error";
import { Interpreter } from "./interpreter";
import { Stmt } from "./stmt";

export class Lox {
  private static readonly interpreter: Interpreter = new Interpreter();
  static hadError = false;
  static hadRuntimeError = false;

  static main() {
    const args = process.argv;
    if (args.length > 3) {
      console.error("Usage: lox-ts [script]");
      process.exit(64);
    } else if (args.length === 3) {
      Lox.runFile(args[2]);
    } else {
      Lox.runPrompt();
    }
  }

  private static runFile(path: string) {
    const file: string = readFileSync(path, { encoding: "utf8" });
    Lox.run(file);

    // Indicate an error in the exit code.
    if (Lox.hadError) process.exit(65);
    if (Lox.hadRuntimeError) process.exit(70);
  }

  private static runPrompt() {
    const rl: readline.Interface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "> "
    });

    rl.prompt();

    rl.on("line", line => {
      Lox.run(line);
      Lox.hadError = false;
      rl.prompt();
    });

    rl.on("close", () => {
      console.log("Have a great day!");
      process.exit(0);
    });
  }

  private static run(source: string) {
    const scanner: Scanner = new Scanner(source);
    const tokens: Token[] = scanner.scanTokens();
    const parser: Parser = new Parser(tokens);
    const statements: (Stmt|null)[] = parser.parse();

    // Stop if there was a syntax error.
    if (this.hadError) return;

    Lox.interpreter.interpret(statements);
  }

  static error(token: Token, message: string): void;
  static error(line: number, message: string): void;
  static error(lineOrToken: number | Token, message: string): void {
    if (!(lineOrToken instanceof Token)) {
      return Lox.report(lineOrToken, "", message);
    }

    if (lineOrToken.type === TokenType.EOF) {
      return Lox.report(lineOrToken.line, " at end", message);
    }

    Lox.report(lineOrToken.line, ` at '${lineOrToken.lexeme}'`, message);
  }

  static runtimeError(error: RuntimeError) {
    console.error(`${error.message}\n[line ${error.token.line}]`);
    Lox.hadRuntimeError = true;
  }

  private static report(line: number, where: string, message: string) {
    console.error(`[Line ${line}] Error${where}: ${message}`);
    Lox.hadError = true;
  }
}

Lox.main();
