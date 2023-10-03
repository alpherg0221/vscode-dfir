import * as vscode from "vscode";
import * as utils from "./utils/utils.js";

type ParseInfo = {
    pGuid: string;
    sn: string;
    psPath: string;
    line: string;
};

export async function searchAncestor(sn?: string) {
    // エディタがないまたは".log"ファイルではない場合は処理を終了
    if (!(await utils.isLogFile())) {
        return;
    }

    // 検索ボックスからsnを取得
    let input: string;
    if (sn === null) {
        input = await vscode.window.showInputBox(
            { title: "親プロセスを検索", placeHolder: "snを入力してください", },
        );
        if (input === void 0) {
            console.log("No Input");
            return;
        }
    } else {
        input = sn;
    }

    // 現在のテキストを取得
    const text = vscode.window.activeTextEditor.document.getText();

    // 指定されたsnの行を取得
    let matchedLine = text.match(RegExp(`^.*sn=${input}.*$`, "m"));

    // 指定されたsnが存在しなければ処理終了
    if (matchedLine === null) {
        console.log("No SN");
        return;
    }

    // infoとinfoListの初期化
    let info = await parseLine(matchedLine.toString());
    const infoList: ParseInfo[] = [info];

    // ループで親取り出し
    while (info.pGuid !== "ROOT") {
        // 指定されたparentGUIDの行を取得
        matchedLine = await getLine(text, info.pGuid);

        // 指定されたparentGUIDが存在しなければ処理終了
        if (matchedLine === null) {
            break;
        }

        // infoの取得とinfoListへの追加
        info = await parseLine(matchedLine.toString());
        infoList.unshift(info);
    }

    infoList.unshift({ pGuid: "ROOT", sn: "ROOT", psPath: "ROOT", line: "ROOT", });

    await showAncestor(infoList);
}

async function getLine(text: string, pGuid: string) {
    // 指定されたparentGUIDの行を取得
    const matchedLine = text.match(RegExp(`^.*evt=ps subEvt=start.*psGUID={${pGuid}}.*$`, "m"));

    // 指定されたsnが存在しなければ処理終了
    if (matchedLine === null) {
        return null;
    }

    return matchedLine;
}

async function parseLine(line: string) {
    const matchPGUID = (() => {
        if (line.includes("evt=ps subEvt=start")) {
            return line.match(RegExp("parentGUID={(.+)}"));
        } else {
            return line.match(RegExp("psGUID={(.+)}"));
        }
    })();
    const pGUID = (() => {
        if (matchPGUID === null || matchPGUID.length < 2 || matchPGUID[1] === null) {
            return "";
        } else {
            return matchPGUID[1];
        }
    })();

    const sn = line.match(RegExp("sn=([0-9]+)"))[1];

    const matchPsPath = (() => {
        if (line.includes("evt=ps subEvt=start")) {
            return line.match(RegExp("psPath=\"(.+?)\" "));
        } else {
            return null;
        }
    })();
    const psPath = (() => {
        if (matchPsPath === null || matchPsPath.length < 2 || matchPsPath[1] === null) {
            return "";
        } else {
            return matchPsPath[1];
        }
    })();

    return <ParseInfo>{ pGuid: pGUID, sn: sn, psPath: psPath, line: line, };
}

async function showAncestor(infoList: ParseInfo[]) {
    vscode.window.createTreeView("ancestor-view", {
        treeDataProvider: new TreeDataProvider(infoList),
    });
}

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
    private readonly infoList: ParseInfo[];

    constructor(infoList: ParseInfo[]) {
        this.infoList = infoList;
    }

    getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
        return element;
    }

    getChildren(element?: TreeItem): vscode.ProviderResult<TreeItem[]> {
        if (element) {
            if (element.child.length !== 0) {
                return [new TreeItem(element.child)];
            } else {
                return [];
            }
        }

        return [new TreeItem(this.infoList)];
    }
}

export class TreeItem extends vscode.TreeItem {
    readonly child: ParseInfo[];

    constructor(infoList: ParseInfo[]) {
        super("", vscode.TreeItemCollapsibleState.Expanded);

        // infoListが2個以上なら2個目以降をchildに指定
        if (infoList.length < 2) {
            this.child = [];
        } else {
            this.child = infoList.slice(1);
        }

        // snがROOTならROOT専用の表示に変更
        if (infoList[0].sn === "ROOT") {
            this.label = "ROOT";
            this.iconPath = new vscode.ThemeIcon(
                "type-hierarchy",
                new vscode.ThemeColor("terminal.ansiBrightRed"),
            );
        } else if (infoList[0].psPath === "") {
            this.label = `sn=${infoList[0].sn}`; //24647 24624
            this.iconPath = new vscode.ThemeIcon(
                "server-process",
                new vscode.ThemeColor("terminal.ansiBrightBlack"),
            );
        } else {
            this.label = `sn=${infoList[0].sn}  psPath=${infoList[0].psPath}`;
            this.iconPath = new vscode.ThemeIcon(
                "notebook-execute-all",
                new vscode.ThemeColor("terminal.ansiGreen"),
            );
        }

        this.tooltip = infoList[0].line;
    }
}