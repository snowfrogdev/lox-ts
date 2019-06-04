import { readFileSync } from "fs";
import readline from "readline";
import { Scanner } from "./scanner";
import { Token } from "./token";

export class Lox {
  static hadError = false;

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

    for (const token of tokens) {
      console.log(token);
    }
  }

  static error(line: number, message: string) {
    Lox.report(line, "", message);
  }

  private static report(line: number, where: string, message: string) {
    console.error(`[Line ${line}] Error${where}: ${message}`);
    Lox.hadError = true;
  }
}

Lox.main();
