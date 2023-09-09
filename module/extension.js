const vscode = require('vscode');
const search = require('./search');
const highlight = require('./highlight');
const utils = require('./utils.js');

/**
* @param {vscode.ExtensionContext} context
*/
async function activate(context) {
	// コマンドの登録
	vscode.commands.registerCommand("vscode-dfir.search-include", async () => search.search(search.SearchMode.INCLUDE));
	vscode.commands.registerCommand("vscode-dfir.search-exclude", async () => search.search(search.SearchMode.EXCLUDE));

	vscode.window.onDidChangeActiveTextEditor(async () => {
		await highlight.highlight();
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(async (event) => {
		if (event.document.fileName != vscode.window.activeTextEditor.document.fileName) return;
		await highlight.highlight();
	}, null, context.subscriptions);

	if (await utils.isLogFile()) {
		await highlight.highlight();
	}
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
};
