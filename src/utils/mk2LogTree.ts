import { Mk2Tree } from "./mk2Log";

type JSONDict = {
    [key: string]: string | number | JSONDict[];
};

export class Mk2LogTree {
    readonly tree: JSONDict;
    readonly countedTree: JSONDict;
    readonly childCount: JSONDict[];

    constructor(jsonlist: any[]) {
        const mk2tree = new Mk2Tree();
        jsonlist.forEach((entry) => {
            mk2tree.update(entry);
        });

        this.tree = structuredClone(mk2tree.root);
        this.countedTree = this.addCount(structuredClone(this.tree))[1];
        this.childCount = this.countChild(structuredClone(this.countedTree)).sort((first, second) => {
            if (first["childCnt"] > second["childCnt"]) {
                return -1;
            } else if (first["childCnt"] < second["childCnt"]) {
                return 1;
            } else {
                if (first["descendantCnt"] > second["descendantCnt"]) {
                    return -1;
                } else if (first["descendantCnt"] < second["descendantCnt"]) {
                    return 1;
                } else {
                    return 0;
                }
            }
        });
    }

    private addCount(tree: JSONDict): [number, JSONDict] {
        const _tree = structuredClone(tree);

        // evt="ps"または、subEvt="inject"、subEvt="guardInject"以外の場合
        if (!["ps", "ROOT"].includes(_tree["evt"] as string) || ["inject", "guardInject"].includes(_tree["subEvt"] as string)) {
            return [1, _tree];
        }

        // "childCnt"追加処理
        _tree["childCnt"] = (_tree["children"] as JSONDict[]).length;

        // "descendantCnt"がkeyにあるとき
        if ("descendantCnt" in _tree) {
            return [_tree["descendantCnt"] as number, _tree];
        }

        // 初期化
        _tree["descendantCnt"] = 0;

        // "children"がkeyにあるとき
        (_tree["children"] as JSONDict[]).forEach((child, i) => {
            const [cnt, childAdded] = this.addCount(child);
            (_tree["descendantCnt"] as number) += (cnt as number);
            _tree["children"][i] = childAdded;
        });

        return [_tree["descendantCnt"] + 1, _tree];
    }

    private countChild(tree: JSONDict): JSONDict[] {
        const _tree = structuredClone(tree);
        const countList: JSONDict[] = [];

        // evt="ps"または、subEvt="inject"、subEvt="guardInject"以外の場合
        if (!["ps", "ROOT"].includes(_tree["evt"] as string) || ["inject", "guardInject"].includes(_tree["subEvt"] as string)) {
            return countList;
        }

        // childrenがないかサイズが0の場合
        if (!("children" in _tree) || (_tree["children"] as JSONDict[]).length === 0) {
            countList.push(this.simplifyTree(structuredClone(_tree)));
            return countList;
        }

        (_tree["children"] as JSONDict[]).forEach((child) => {
            countList.push(...this.countChild(child));
        });

        if (tree["evt"] === "ps") {
            countList.push(this.simplifyTree(structuredClone(_tree)));
        }

        return countList;
    }

    private simplifyTree(tree: JSONDict): JSONDict {
        const _tree = structuredClone(tree);
        const _treeObj: JSONDict = {};

        ["sn", "date", "evt", "psPath", "childCnt", "descendantCnt"].forEach((key) => {
            if (key in _tree) {
                _treeObj[key] = _tree[key];
            }
        });

        return _treeObj;
    }
}