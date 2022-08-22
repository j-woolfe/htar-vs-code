import * as vscode from "vscode";


import {
    find_replacements
} from "./rust_interface";

// Sample type alias
const TARGET = "Int -> String";

export const POTENTIAL_REPLACEMENT = "potential_replacement";

export function refreshDiagnostics(
    doc: vscode.TextDocument,
    emojiDiagnostics: vscode.DiagnosticCollection,
    context: vscode.ExtensionContext
): void {
    console.log("Refreshing diagnostics");
    // // let doc = vscode.window.visibleTextEditors[0].document;
    // // let doc = editor.document
    let extensionPath = context.extensionUri.fsPath;

    console.log(find_replacements(doc, extensionPath, ""));

    const diagnostics: vscode.Diagnostic[] = [];

    for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
        const lineOfText = doc.lineAt(lineIndex);
        if (lineOfText.text.includes(TARGET)) {
            diagnostics.push(createDiagnostic(doc, lineOfText, lineIndex));
        }
    }

    emojiDiagnostics.set(doc.uri, diagnostics);
}

function createDiagnostic(doc: vscode.TextDocument, lineOfText: vscode.TextLine, lineIndex: number): vscode.Diagnostic {
    // find where in the line of that the 'emoji' is mentioned
    const index = lineOfText.text.indexOf(TARGET);

    // create range that represents, where in the document the word is
    const range = new vscode.Range(lineIndex, index, lineIndex, index + TARGET.length);

    const diagnostic = new vscode.Diagnostic(range, "This type could be replaced with an alias",
        vscode.DiagnosticSeverity.Information);
    diagnostic.code = POTENTIAL_REPLACEMENT;
    return diagnostic;
}

export function subscribeToDocumentChanges(context: vscode.ExtensionContext, aliasDiagnostics: vscode.DiagnosticCollection): void {

    if (vscode.window.activeTextEditor) {
        refreshDiagnostics(vscode.window.activeTextEditor.document, aliasDiagnostics, context);
    }
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                refreshDiagnostics(editor.document, aliasDiagnostics, context);


            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document, aliasDiagnostics, context))
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => aliasDiagnostics.delete(doc.uri))
    );

}
