import * as vscode from "vscode";
import * as path from "path";
import { spawnSync } from "child_process";

type Response = {
    echo_request: RequestAlias;
    matches: [Match];
};

type RequestAlias = {
    target_type: string;
    source: string;
};

type Match = {
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

export function find_replacements(
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

        // TODO: Fix for other OSes
        const exePath = path.join(
            extensionPath,
            "bin",
            "rust-ts-experiments"
        );

        const resolverProcess = spawnSync(
            exePath + ` --target="String -> Int" --path="${path.join(extensionPath, "test.hs")}"`,
            // exePath + ` --help`,
            {
                shell: '/bin/bash', // TODO: Fix for other OSes
                cwd: workPath,
                encoding: 'utf8',
            }
        );

        // console.log(resolverProcess.stdout);
        console.log(resolverProcess);

        let result: Response = JSON.parse(resolverProcess.stdout);

        return result;
    }

    console.log("workPaths?.length is falsy");
}
