import * as vscode from "vscode";
import * as utils from "./utils.js";
import axios, { AxiosResponse } from "axios";

type Mk2LogItem = {
    childCnt: number;
    date: string;
    descendantCnt: number;
    evt: string;
    psPath: string;
    sn: string;
};

export async function getChildCount() {
    // エディタがないまたは".log"ファイルではない場合は処理を終了
    if (!(await utils.isLogFile())) {
        return;
    }

    // LogをJSONに変換
    const jsonList = [];
    const splitedText = vscode.window.activeTextEditor.document.getText().split(/\r\n|\n/);
    splitedText.forEach((line) => {
        jsonList.push(utils.dictify(line));
    });

    // 現在のファイル名を取得
    const filename = vscode.window.activeTextEditor.document.fileName.split("\\").slice(-1)[0].replace(".log", "");

    // APIからtreeを取得
    const res = await axios.post("http://www.az.lab.uec.ac.jp:8080/tree/count/vsc", JSON.stringify(jsonList));

    // treeを表示
    await showChildren(res.data, filename);
}

export async function showChildren(tree: Mk2LogItem[], filename: string) {
    vscode.window.createTreeView("children-view", {
        treeDataProvider: new TreeDataProvider(tree),
    });
}

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
    private readonly root: Mk2LogItem[];

    constructor(root: Mk2LogItem[]) {
        this.root = root;
    }

    getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
        return element;
    }

    getChildren(element?: TreeItem): vscode.ProviderResult<TreeItem[]> {
        if (element) {
            return [];
        }

        // 取得したJSONのリストをTreeItemのリストに変換
        const children: TreeItem[] = [];
        this.root.forEach((e) => {
            children.push(new TreeItem(e));
        });

        return children;
    }
}

export class TreeItem extends vscode.TreeItem {
    readonly self: Mk2LogItem;

    constructor(child: Mk2LogItem) {
        super("");

        this.self = child;

        // 文字数合わせ
        const childCntStr = child.childCnt.toString().padEnd(4, " ");
        const descendantCntStr = child.descendantCnt.toString().padEnd(4, " ");

        // ラベルとアイコンの設定
        this.label = `sn:${child.sn}  子:${childCntStr}  子孫:${descendantCntStr}  ${child.psPath}`;
        this.iconPath = new vscode.ThemeIcon(
            "notebook-execute-all",
            new vscode.ThemeColor("terminal.ansiGreen"),
        );

        // ツールチップに日時を設定
        this.tooltip = `${child.date} `;

        // snがROOTならplaceholderを表示
        if (child.sn === "ROOT") {
            this.label = "No Contents";
            this.iconPath = new vscode.ThemeIcon(
                "notebook-execute-all",
                new vscode.ThemeColor("terminal.ansiBrightBlack"),
            );
        }
    }
}