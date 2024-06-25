import type { ConfigKey } from "./types";

export const CodeSnapConfigNames = [
    "backgroundColor",
    "boxShadow",
    "containerPadding",
    "roundedCorners",
    "showWindowControls",
    "showWindowTitle",
    "showLineNumbers",
    "realLineNumbers",
    "transparentBackground",
    "target",
    "shutterAction",
] as const;

export const extensionSettingsNames: ConfigKey[] = [
    ...CodeSnapConfigNames,
    "enableResizing",
    "roundingLevel",
    "lockOnOpen",
    "linkOnOpen",
    "saveFormat",
    "windowStyle",
    "windowTitleTemplate",
    "saveScale",
    "aspectRatio",
    "fullLinesSelection",
    "highlightLineNumber",
] as const;
