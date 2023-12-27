import { homedir } from "os"
import path from "path"
import * as vscode from "vscode"
import { extensionSettingsNames } from "../constants"
import { getSettings, hasOneSelection, loadHtml, writeFile } from "../util"

type message = (
    { type: "copied" | "update-config" | "ready" } |
    { type: "save", data: string } |
    { type: "save-config", config: {} }
)

type updateTypes = "config" | "text" | "both"

export function SnapFactory(context: vscode.ExtensionContext) {
    return async () => {
        const panel = await createPanel(context)

        const update = async (updateType: updateTypes) => {
            if (updateType !== "config") {
                await vscode.commands.executeCommand("editor.action.clipboardCopyWithSyntaxHighlightingAction")
            }

            panel.webview.postMessage({
                type: updateType === "both" ? "update" : `update-${updateType}`,
                ...getConfig()
            })
        }

        const actions = ActionsFactory({ panel, update })

        panel.webview.onDidReceiveMessage(async ({ type, ...args }: message) => {
            if (type in actions) {
                actions[type]({ ...args } as any)
            } else {
                vscode.window.showErrorMessage(`Easy CodeSnap 📸: Unknown shutterAction "${type}"`)
            }
        })

        const selectionHandler = vscode.window.onDidChangeTextEditorSelection(
            (e) => (hasOneSelection(e.selections) && update("text"))
        )
        panel.onDidDispose(() => selectionHandler.dispose())
    }
}

interface ActionFactoryProps {
    panel: vscode.WebviewPanel
    update: (type: updateTypes) => Promise<void>
}

function ActionsFactory(props: ActionFactoryProps) {
    const { panel, update } = props

    const flash = () => panel.webview.postMessage({ type: "flash" })

    return {
        async save({ data }: { data: string }) {
            flash()
            await saveImage(data)
        },

        copied: () => vscode.window.showInformationMessage("Image copied to clipboard!"),

        ready() {
            const editor = vscode.window.activeTextEditor
            if (editor && hasOneSelection(editor.selections)) { update("both") }
        },

        "update-config": () => update("config"),

        "save-config"({ config }: { config: { [key: string]: any } }) {
            const extensionSettings = vscode.workspace.getConfiguration("easy-codesnap")

            extensionSettingsNames.forEach((name) => {
                if (name in config && extensionSettings.get(name) !== config[name]) {
                    extensionSettings.update(
                        name,
                        config[name],
                        vscode.ConfigurationTarget.Global
                    )
                }
            })

            vscode.window.showInformationMessage("Settings saved as default!")
        }
    }
}

const getConfig = () => {
    const editorSettings = getSettings("editor", ["fontLigatures", "tabSize"])

    const editor = vscode.window.activeTextEditor
    if (editor) { editorSettings.tabSize = editor.options.tabSize }

    const extensionSettings = getSettings("easy-codesnap", extensionSettingsNames)

    const selection = editor?.selection
    const startLine = selection ? selection.start.line : 0

    let windowTitle = ""
    if (editor) {
        const activeFileName = editor.document.uri.path.split("/").pop()
        windowTitle = `${vscode.workspace.name} - ${activeFileName}`
    }

    return {
        ...editorSettings,
        ...extensionSettings,
        startLine,
        windowTitle
    }
}

const createPanel = async (context: vscode.ExtensionContext) => {
    const panel = vscode.window.createWebviewPanel(
        "easy-codesnap",
        "Easy CodeSnap 📸",
        { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
        {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(context.extensionPath)],
            retainContextWhenHidden: true
        }
    )

    panel.webview.html = await loadHtml(
        path.resolve(context.extensionPath, "webview/index.html"),
        panel,
        context
    )

    return panel
}

let lastUsedImageUri = vscode.Uri.file(path.resolve(homedir(), "Desktop/code.png"))
const saveImage = async (data: string) => {
    const uri = await vscode.window.showSaveDialog({
        filters: { Images: ["png"] },
        defaultUri: lastUsedImageUri
    })

    lastUsedImageUri = uri as vscode.Uri

    if (uri) {
        writeFile(uri.fsPath, Buffer.from(data, "base64")).then(() => {
            vscode.window.showInformationMessage(`Image saved on: ${uri.fsPath}`)
        })
    }
}