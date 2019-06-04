import { writeFileSync } from "fs";

class GenerateAst {
  static main() {
    const args = process.argv;
    if (args.length !== 3) {
      console.error("Usage: generate_ast <output directory>");
      process.exit(1);
    }
    const outputDir = args[2];
    GenerateAst.defineAst_(outputDir, "Expr", [
      "Binary   - readonly left: Expr, readonly operator: Token, readonly right: Expr",
      "Grouping - readonly expression: Expr",
      "Literal  - readonly value: {}",
      "Unary    - readonly operator: Token, readonly right: Expr"
    ]);
  }

  private static defineAst_(
    outputDir: string,
    baseName: string,
    types: string[]
  ) {
    const path = `${outputDir}/${baseName.toLowerCase()}.ts`;

    const text = `
import { Token } from "./token";

${GenerateAst.defineVisitor_(baseName, types)}

export abstract class ${baseName} {
  abstract accept<R>(visitor: Visitor<R>): R
}

${GenerateAst.defineType_(baseName, types)}
`;
    writeFileSync(path, text.trimLeft());
  }

  private static defineVisitor_(baseName: string, types: string[]): string {
    const visitors = types
      .map(type => {
        const typeName = type.split("-")[0].trim();
        return `visit${typeName}${baseName}(${baseName.toLocaleLowerCase()}: ${typeName}): R;
  `;
      })
      .join("")
      .trimRight();

    return `export interface Visitor<R> {
  ${visitors}
}`;
  }

  private static defineType_(baseName: string, types: string[]): string {
    return types
      .map(type => {
        const className = type.split("-")[0].trim();
        const fields = type.split("-")[1].trim();
        return `
export class ${className} extends ${baseName} {
  constructor(${fields}) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {     
      return visitor.visit${className}${baseName}(this);
  }
}
`;
      })
      .join("");
  }
}

GenerateAst.main();
