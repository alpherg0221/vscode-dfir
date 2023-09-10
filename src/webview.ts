import * as vscode from "vscode";

export async function showWebView(fileName: string) {
    const panel = vscode.window.createWebviewPanel(
        'Mk2LogTree',
        `Mk2LogTree - ${fileName.split("\\").slice(-1)[0]}`,
        vscode.ViewColumn.One,
        {},
    );

    const jsonText = (await vscode.workspace.openTextDocument(fileName)).getText()
    const json: { [key: string]: string | any[] }[] = JSON.parse(jsonText)

    const dict: { [key: string]: any[] } = { "root": [] };

    json.forEach((e) => {
        if ("parentGUID" in e) return;

        e["childlen"] = []
        dict["root"].push(e);
    });

    console.log(dict)

    panel.webview.html = `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hello World</title>
        </head>
        <body>
            <h1>Hello World!</h1>
        </body>
    </html>
    `;
}