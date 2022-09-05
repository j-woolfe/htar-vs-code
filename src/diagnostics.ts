import * as vscode from "vscode";


import {
    findReplacements,
    Match
} from "./rust_interface";

// Sample type alias
// const TARGET = "Int -> String";

export const POTENTIAL_REPLACEMENT = "potential_replacement";

export function refreshDiagnostics(
    doc: vscode.TextDocument,
    aliasDiagnostics: vscode.DiagnosticCollection,
    context: vscode.ExtensionContext
): void {
    console.log("Refreshing diagnostics");
    // // let doc = vscode.window.visibleTextEditors[0].document;
    // // let doc = editor.document
    let extensionPath = context.extensionUri.fsPath;
    const diagnostics: vscode.Diagnostic[] = [];

    const targets = findTargets(doc);

    // For each type sig in file, run backend with sig as target
    targets.forEach(target => {
        const response = findReplacements(doc, extensionPath, target.text);
        if (response) {
            response.matches.forEach(match => diagnostics.push(createDiagnostic(match, target, doc)))
        }
    });

    aliasDiagnostics.set(doc.uri, diagnostics);
}

type Target = {
    text: string,
    range: vscode.Range
}

function findTargets(doc: vscode.TextDocument): Target[] {
    const targets: Target[] = [];
    // TODO: better than this
    for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
        const lineOfText = doc.lineAt(lineIndex);

        if (lineOfText.text.includes("::")) {
            const start = lineOfText.text.indexOf(":: ");
            // TODO:: Handle end of line properly
            const end = lineOfText.text.length;
            const text = lineOfText.text.slice(start + 3);

            const range = new vscode.Range(
                lineIndex,
                start + 3,
                lineIndex,
                end
            )

            targets.push({ text, range });
        }
    }

    console.log(targets)

    return targets
}

function createDiagnostic(match: Match, target: Target, doc: vscode.TextDocument): vscode.Diagnostic {
    const message = `The type ${target.text} could be replaced with ${match.replaced_type}`;
    const severity = vscode.DiagnosticSeverity.Information;
    // const severity = vscode.DiagnosticSeverity.Error;
    const match_range = new vscode.Range(
        match.location.start.row ,
        match.location.start.col,
        match.location.end.row,
        match.location.end.col
    );
    const location = new vscode.Location(doc.uri, match_range)
    const info = new vscode.DiagnosticRelatedInformation(location, match.replaced_type)

    const diagnostic = new vscode.Diagnostic(target.range, message, severity);
    diagnostic.code = POTENTIAL_REPLACEMENT;
    diagnostic.source = "htar";
    diagnostic.relatedInformation = [info];

    return diagnostic
}

// function createDiagnostic(doc: vscode.TextDocument, lineOfText: vscode.TextLine, lineIndex: number): vscode.Diagnostic {
//     // find where in the line of that the 'emoji' is mentioned
//     const index = lineOfText.text.indexOf(TARGET);

//     // create range that represents, where in the document the word is
//     const range = new vscode.Range(lineIndex, index, lineIndex, index + TARGET.length);

//     const diagnostic = new vscode.Diagnostic(range, "This type could be replaced with an alias",
//         vscode.DiagnosticSeverity.Information);
//     diagnostic.code = POTENTIAL_REPLACEMENT;
//     return diagnostic;
// }

export function subscribeToDocumentChanges(context: vscode.ExtensionContext, aliasDiagnostics: vscode.DiagnosticCollection): void {

    if (vscode.window.activeTextEditor) {
        refreshDiagnostics(vscode.window.activeTextEditor.document, aliasDiagnostics, context);
    }
    // context.subscriptions.push(
    //     vscode.window.onDidChangeActiveTextEditor(editor => {
    //         if (editor) {
    //             refreshDiagnostics(editor.document, aliasDiagnostics, context);
    //         }
    //     })
    // );

    context.subscriptions.push(
        // vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document, aliasDiagnostics, context))
        vscode.workspace.onDidSaveTextDocument(e => refreshDiagnostics(e, aliasDiagnostics, context))
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => aliasDiagnostics.delete(doc.uri))
    );

}
