const vscode = require('vscode');

async function isLogFile() {
    // エディタがないまたは".log"ファイルではない場合はfalse
    const editor = vscode.window.activeTextEditor;
    return (editor && editor.document.fileName.endsWith(".log"))
}

module.exports = {
    isLogFile,
}