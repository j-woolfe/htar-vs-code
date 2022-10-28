import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import { spawnSync } from "child_process";

type Response = {
    echo_request: RequestAlias;
    matches: [Match];
};

type RequestAlias = {
    target_type: string;
    source: string;
};

export type Match = {
    matched: string;
    location: Range;
    variable_map: Map<string, string>;
    replaced_type: string;
};

type Range = {
    start: Position;
    end: Position;
};

type Position = {
    row: number;
    col: number;
};

export function findReplacements(
    doc: vscode.TextDocument,
    extensionPath: string,
    targetType: string
): Response | undefined {
    const workPaths = vscode.workspace.workspaceFolders;
    if (workPaths?.length) {
        const workPath = workPaths[0].uri.fsPath;
        const filePath = doc.uri.path;

        let fileName: string;

        if (doc.uri.scheme === "file") {
            fileName = filePath
                .split("/")
                .reduce(
                    (accu, curr, currIn, arr) =>
                        currIn === arr.length - 1 ? accu + curr : accu,
                    ""
                );
        } else if (doc.uri.scheme === "git") {
            fileName = filePath
                .split("/")
                .reduce(
                    (accu, curr, currIn, arr) =>
                        currIn === arr.length - 1 ? accu + curr : accu,
                    ""
                )
                .split(".")
                .reduce(
                    (accu: string[], curr, currIn, arr) =>
                        currIn === arr.length - 1 ? accu : [...accu, curr],
                    []
                )
                .join(".");
        } else {
            fileName = "none";
        }

        const exePath = path.join(
            extensionPath,
            "bin",
            os.type() === 'Windows_NT' ? "htar.exe" : "htar",
        );

        const resolverProcess = spawnSync(
            exePath + ` --target="${targetType}" --path="${path.join(extensionPath, "test.hs")}"`,
            // exePath + ` --help`,
            {
                shell: os.type() === 'Windows_NT' ? 'powershell.exe' : '/bin/bash',
                cwd: workPath,
                encoding: 'utf8',
            }
        );

        // console.log(resolverProcess);

        let result: Response = JSON.parse(resolverProcess.stdout);

        return result;
    }
}
