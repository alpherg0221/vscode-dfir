import * as vscode from "vscode";
import * as search from "./search";
import * as highlight from "./highlight";
import * as utils from "./utils";
import * as ancestor from "./ancestor";


export async function activate(context: vscode.ExtensionContext) {
	// コマンドの登録
	vscode.commands.registerCommand("vscode-dfir.search-include", async () => search.search(search.SearchMode.INCLUDE));
	vscode.commands.registerCommand("vscode-dfir.search-exclude", async () => search.search(search.SearchMode.EXCLUDE));
	vscode.commands.registerCommand("vscode-dfir.search-ancestor", async () => ancestor.searchAncestor(""));

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

export function deactivate() { }