import { FilerbotEditor } from "@/editor/filerbotEditor"
import { LocalCmdEditor } from "@/editor/localEditor";
import TuiEditor from "@/editor/tuiEditor";
import { logPush } from "@/logger";
import { isMobile } from "@/syapi";
import { showPluginMessage } from "@/utils/common";
import { Protyle } from "siyuan";

export const IMAGE_EDITOR_KEY = {
    TUI: 'tui',
    FILERBOT: 'filerbot',
    LOCAL: "local"
}
const EDITOR = {
    [IMAGE_EDITOR_KEY.FILERBOT]: new FilerbotEditor(),
    [IMAGE_EDITOR_KEY.TUI]: new TuiEditor(), 
    [IMAGE_EDITOR_KEY.LOCAL]: new LocalCmdEditor(),
}
const DEFAULT_EDITOR = isMobile() ? IMAGE_EDITOR_KEY.FILERBOT : IMAGE_EDITOR_KEY.TUI;

let currentEditor;

export function showImageEditor({ source, filePath, element, protyle }: { source: string; filePath: string, element: HTMLElement, protyle: Protyle }) {
    currentEditor.showImageEditor({ source, filePath, element, protyle });
}

export function initImageEditor() {
    currentEditor.init();
}

export function changeEditor(editorKey: string) {
    if (currentEditor) {
        currentEditor.destroy();
        logPush("destroy")
    }
    logPush("调整编辑器到", editorKey);
    currentEditor = EDITOR[editorKey] || EDITOR[DEFAULT_EDITOR];
    if (!currentEditor.isAvailable()) {
        logPush("编辑器不可用", editorKey);
        currentEditor = EDITOR[DEFAULT_EDITOR];
    }
    currentEditor.init();
}

export function destroyEditor() {
    if (currentEditor) {
        currentEditor.destroy();
    }
}

export function refreshImg(imgElement, protyle) {
    logPush("protyle", protyle);
    if (protyle) {
        protyle.reload();
    } else {
        let src = imgElement.getAttribute('src') || '';
        let base = src.split('?')[0];
        imgElement.setAttribute('src', base + '?t=' + Date.now());
    }
}