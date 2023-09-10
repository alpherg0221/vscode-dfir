import * as vscode from "vscode";
import * as utils from "./utils.js";

// 参考：https://stackoverflow.com/questions/67934437/vscode-is-there-any-api-to-get-search-results

export class SearchMode {
    static get INCLUDE() { return "含む行"; }
    static get EXCLUDE() { return "含まない行"; }
}

export async function search(mode: string) {
    // エディタがないまたは".log"ファイルではない場合は処理を終了
    if (!(await utils.isLogFile())) return;

    const selection = vscode.window.activeTextEditor.selection;
    let range;
    if (selection.isEmpty) {
        range = vscode.window.activeTextEditor.document.getWordRangeAtPosition(
            vscode.window.activeTextEditor.selection.active, /\S+/,
        );
    } else {
        range = vscode.window.activeTextEditor.selection;
    }

    const selected = range ? vscode.window.activeTextEditor.document.getText(range) : "";

    // 検索する文字の入力を取得
    const input = await vscode.window.showInputBox(
        { title: `絞り込み (${mode}を残す)`, value: selected, },
    );
    if (input === void 0) return;

    // 現在のテキストを取得
    const editor = vscode.window.activeTextEditor;
    const text = editor.document.getText();

    const escaped = input.replace(/[-\/\\^$*+?.()|\[\]{}]/g, '\\$&');

    // 検索
    let matches;
    switch (mode) {
        case SearchMode.INCLUDE:
            matches = [...text.matchAll(RegExp("^(?!.*" + escaped + ").*$", "gm"))];
            break;
        case SearchMode.EXCLUDE:
            matches = [...text.matchAll(RegExp("^.*" + escaped + ".*$", "gm"))];
            break;
        default:
            return;
    }

    // 表示を更新
    await editor.edit((builder) => {
        matches.forEach((match) => {
            const startPos = editor.document.positionAt(match.index - 1);
            const endPos = editor.document.positionAt(match.index + match[0].length);
            builder.replace(new vscode.Selection(startPos, endPos), "");
        });
    });
}