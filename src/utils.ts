import * as vscode from "vscode";

export async function isLogFile(): Promise<boolean> {
    // エディタがないまたは".log"ファイルではない場合はfalse
    const editor = vscode.window.activeTextEditor;

    if (editor != undefined) {
        return editor && editor.document.fileName.endsWith(".log");
    } else {
        return false;
    }
}