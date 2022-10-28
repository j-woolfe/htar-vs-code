// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
    subscribeToDocumentChanges,
    POTENTIAL_REPLACEMENT,
} from "./diagnostics";


export function activate(context: vscode.ExtensionContext) {
    console.log("Extension activated");


    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            "haskell",
            new AliasReplacer(),
            {
                providedCodeActionKinds: AliasReplacer.providedCodeActionKinds,
            }
        )
    );

    const aliasDiagnostics = vscode.languages.createDiagnosticCollection("alias");
    context.subscriptions.push(aliasDiagnostics);

    subscribeToDocumentChanges(context, aliasDiagnostics);
}

export class AliasReplacer implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix,
    ];

    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range,
        context: vscode.CodeActionContext
    ): vscode.CodeAction[] | undefined {

        const diagnostics = context.diagnostics;

        const actions = diagnostics
            .filter(d => d.code === POTENTIAL_REPLACEMENT)
            .map(d => this.createFix(document, d));

        return actions
    }

    private createFix(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic
    ) {
        const replaced_type = diagnostic.relatedInformation![0].message;

        const fix = new vscode.CodeAction(
            `Replace with ${replaced_type}`,
            vscode.CodeActionKind.QuickFix
        );

        fix.edit = new vscode.WorkspaceEdit();
        fix.edit.replace(
            document.uri,
            diagnostic.range,
            replaced_type
        );

        fix.isPreferred = true;

        return fix
    }

}

// this method is called when your extension is deactivated
export function deactivate() { }
