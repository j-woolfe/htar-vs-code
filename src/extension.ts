// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
    subscribeToDocumentChanges,
    POTENTIAL_REPLACEMENT,
} from "./diagnostics";
// import {
//     findReplacements
// } from "./rust_interface";

const COMMAND = "haskell-type-alias-resolver.replace-alias";

const REPLACEMENT1 = "AType";
const REPLACEMENT2 = "AnotherType";

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


    // context.subscriptions.push(
    //   vscode.languages.registerCodeActionsProvider("haskell", new AliasInfo(), {
    //     providedCodeActionKinds: AliasInfo.providedCodeActionKinds,
    //   })
    // );

    // context.subscriptions.push(
    //   vscode.commands.registerCommand(COMMAND, () =>
    //     vscode.env.openExternal(
    //       vscode.Uri.parse(
    //         "https://unicode.org/emoji/charts-12.0/full-emoji-list.html"
    //       )
    //     )
    //   )
    // );
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


    // private createFix(
    //     document: vscode.TextDocument,
    //     range: vscode.Range,
    //     replacement: string
    // ) {
    //     const fix = new vscode.CodeAction(
    //         `Replace with ${replacement}`,
    //         vscode.CodeActionKind.QuickFix
    //     );

    //     fix.edit = new vscode.WorkspaceEdit();
    //     fix.edit.replace(
    //         document.uri,
    //         new vscode.Range(range.start, range.start.translate(0, 13)),
    //         replacement
    //     );
    //     return fix;
    // }

    private createCommand(): vscode.CodeAction {
        const action = new vscode.CodeAction(
            "Alias replacement",
            vscode.CodeActionKind.Empty
        );
        action.command = { command: COMMAND, title: "TITLE", tooltip: "TOOLTIP" };
        return action;
    }
}

// TODO: What should this be called?
// export class AliasInfo implements vscode.CodeActionProvider {
//     public static readonly providedCodeActionKinds = [
//         vscode.CodeActionKind.QuickFix,
//     ];

//     provideCodeActions(
//         document: vscode.TextDocument,
//         range: vscode.Range | vscode.Selection,
//         context: vscode.CodeActionContext,
//         token: vscode.CancellationToken
//     ): vscode.CodeAction[] {
//         // for each diagnostic entry that has the matching `code`, create a code action command
//         return context.diagnostics
//             .filter((diagnostic) => diagnostic.code === POTENTIAL_REPLACEMENT)
//             .map((diagnostic) => this.createCommandCodeAction(diagnostic));
//     }

//     private createCommandCodeAction(
//         diagnostic: vscode.Diagnostic
//     ): vscode.CodeAction {
//         const action = new vscode.CodeAction(
//             "Learn more...",
//             vscode.CodeActionKind.QuickFix
//         );
//         action.command = {
//             command: COMMAND,
//             title: "TITLE2",
//             tooltip: "TOOLTIP2",
//         };
//         action.diagnostics = [diagnostic];
//         action.isPreferred = true;
//         return action;
//     }
// }
// this method is called when your extension is deactivated
export function deactivate() { }
