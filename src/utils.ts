import * as vscode from "vscode";
import * as shlex from "shlex";

export async function isLogFile(): Promise<boolean> {
    // エディタがないまたは".log"ファイルではない場合はfalse
    const editor = vscode.window.activeTextEditor;

    if (editor !== undefined) {
        return editor && editor.document.fileName.endsWith(".log");
    } else {
        return false;
    }
}

export function dictify(line: string) {
    const date = Date.parse(line.slice(0, 29));
    const entry = {
        "date": line.slice(0, 29),
        "timeStamp": Math.floor(date.valueOf() / 1000),
    };

    line = line.slice(30);

    const cmd = line.indexOf("cmd=");
    if (cmd > 0) {
        const psid = line.indexOf("psID=");
        const cmds = line.slice(cmd + 4, psid - 1);
        line = line.replace(cmds, shlex.quote(cmds));
    }

    let elems: string[] = [];
    try {
        elems = shlex.split(line);
    } catch {
        line = line.replace('\\"', '\\""');
        elems = shlex.split(line);
    }

    elems.forEach((elem) => {
        let key: string, value: string;
        [key, value] = elem.split("=", 2);
        entry[key] = value;
    });

    return entry;
}