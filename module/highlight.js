const vscode = require('vscode');
const utils = require('./utils.js');

const decorationList = [
    vscode.window.createTextEditorDecorationType({ backgroundColor: "#FF8C0044" }), // evt=net
    vscode.window.createTextEditorDecorationType({ backgroundColor: "#0000FF44" }), // evt=ps subEvt=start
    vscode.window.createTextEditorDecorationType({ backgroundColor: "#00800044" }), // evt=file
]

async function highlight() {
    // エディタがないまたは".log"ファイルではない場合は処理を終了
    if (!(await utils.isLogFile())) return;

    // 現在のテキストを取得
    const editor = vscode.window.activeTextEditor;
    const text = editor.document.getText();

    // 検索
    const matchesList = [
        [...text.matchAll(RegExp("^.+evt=net.+$", "gm"))],
        [...text.matchAll(RegExp("^.+evt=ps subEvt=start.+$", "gm"))],
        [...text.matchAll(RegExp("^.+evt=file.+$", "gm"))],
    ]

    // 表示を更新
    const decorationsList = [
        [], [], [],
    ];

    matchesList.forEach((matches, index) => {
        matches.forEach((match) => {
            const startPos = editor.document.positionAt(match.index - 1);
            const endPos = editor.document.positionAt(match.index + match[0].length);
            decorationsList[index].push({ range: new vscode.Range(startPos, endPos) });
        });
    });

    editor.setDecorations(decorationList[0], decorationsList[0]);
    editor.setDecorations(decorationList[1], decorationsList[1]);
    editor.setDecorations(decorationList[2], decorationsList[2]);
}

module.exports = {
    highlight,
}