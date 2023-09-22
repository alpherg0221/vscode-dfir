import * as vscode from "vscode";
import * as search from "./search";
import * as highlight from "./highlight";
import * as utils from "./utils/utils";
import * as ancestor from "./ancestor";
import * as children from "./children";


export async function activate(context: vscode.ExtensionContext) {
	// 検索コマンド(含む行を残す)の登録
	vscode.commands.registerCommand("vscode-dfir.search-include", async () => search.search(search.SearchMode.INCLUDE));
	// 検索コマンド(含まない行を残す)の登録
	vscode.commands.registerCommand("vscode-dfir.search-exclude", async () => search.search(search.SearchMode.EXCLUDE));
	// 親プロセス検索コマンドの登録
	vscode.commands.registerCommand("vscode-dfir.search-ancestor", async () => ancestor.searchAncestor(null));
	// 子プロセス数カウントコマンドの登録
	vscode.commands.registerCommand("vscode-dfir.count-child", async () => children.getChildCount());
	// 子プロセス数一覧画面から親プロセスを検索するコマンドの登録
	vscode.commands.registerCommand("vscode-dfir.search-ancestor.sn", async (element: children.TreeItem) => {
		if (element) {
			ancestor.searchAncestor(element.self.sn);
		}
	});

	// 親プロセス検索画面のplaceholder
	vscode.window.registerTreeDataProvider("ancestor-view", new ancestor.TreeDataProvider([{
		pGuid: "ROOT", sn: "ROOT", psPath: "ROOT", line: "ROOT",
	}]));
	// 子プロセス検索画面のplaceholder
	vscode.window.registerTreeDataProvider("children-view", new children.TreeDataProvider([{
		childCnt: 0, date: "", descendantCnt: 0, evt: "", psPath: "", sn: "ROOT",
	}]));

	vscode.window.onDidChangeActiveTextEditor(async () => {
		await highlight.highlight();
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(async (event) => {
		if (event.document.fileName !== vscode.window.activeTextEditor.document.fileName) {
			return;
		}
		await highlight.highlight();
	}, null, context.subscriptions);

	if (await utils.isLogFile()) {
		await highlight.highlight();
	}
}

export function deactivate() { }
