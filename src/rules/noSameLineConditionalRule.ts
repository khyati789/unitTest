/*
 * SonarTS
 * Copyright (C) 2017-2019 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import * as Lint from "tslint";
import * as ts from "typescript";
import { SonarRuleMetaData } from "../sonarRule";
import { startLineAndCharacter, endLineAndCharacter, findChild } from "../utils/navigation";
import { SonarRuleVisitor } from "../utils/sonarAnalysis";
import { isIfStatement } from "../utils/nodes";

export class Rule extends Lint.Rules.AbstractRule {
  public static metadata: SonarRuleMetaData = {
    description: "Conditionals should start on new lines",
    options: null,
    optionsDescription: "",
    rspecKey: "RSPEC-3972",
    ruleName: "no-same-line-conditional",
    type: "functionality",
    typescriptOnly: false,
  };

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return new Visitor(this.getOptions().ruleName).visit(sourceFile).getIssues();
  }
}

class Visitor extends SonarRuleVisitor {
  private static readonly MESSAGE = 'Move this "if" to a new line or add the missing "else".';

  protected visitSourceFile(node: ts.SourceFile): void {
    this.checkStatements(Array.from(node.statements));
    super.visitSourceFile(node);
  }

  protected visitBlock(node: ts.Block): void {
    this.checkStatements(Array.from(node.statements));
    super.visitBlock(node);
  }

  protected visitModuleDeclaration(node: ts.ModuleDeclaration): void {
    if (node.body && node.body.kind === ts.SyntaxKind.ModuleBlock) {
      this.checkStatements(Array.from(node.body.statements));
    }
    super.visitModuleDeclaration(node);
  }

  private checkStatements(statements: ts.Statement[]): void {
    statements.forEach((statement, index) => {
      if (isIfStatement(statement) && index > 0) {
        const previousStatement = statements[index - 1];

        if (isIfStatement(previousStatement)) {
          const ifTokenLine = startLineAndCharacter(statement).line;
          const previousStatementLastLine = endLineAndCharacter(previousStatement).line;
          if (ifTokenLine === previousStatementLastLine) {
            const ifKeyword = findChild(statement, ts.SyntaxKind.IfKeyword);
            this.addIssue(ifKeyword, Visitor.MESSAGE);
          }
        }
      }
    });
  }
}
