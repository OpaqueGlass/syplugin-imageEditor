import { FilerbotEditor } from "@/editor/filerbotEditor"
import { LocalCmdEditor } from "@/editor/localEditor";
import TuiEditor from "@/editor/tuiEditor";
import { logPush } from "@/logger";
import { isMobile } from "@/syapi";
import { showPluginMessage } from "@/utils/common";
import { getBackend, getFrontend, Protyle } from "siyuan";
import { getReadOnlyGSettings } from "./settingManager";

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
    const frontEnd = getFrontend();
    const g_settings = getReadOnlyGSettings();
    // 暂时禁用掉
    if (protyle && ["desktop", "desktop-window"].includes(frontEnd) && g_settings["compatibilityMode"] == false && false) {
        protyle.reload();
    } else {
        const src = imgElement.getAttribute('src') || imgElement.getAttribute('data-src') || '';
        if (!src) {
            logPush("refreshImg: 未获取到图片 src，跳过缓存刷新");
            return;
        }
        const base = src.split('?')[0];
        const modified = `${base}?t=${Date.now()}`;
        const dataSrc = imgElement.getAttribute('data-src');
        // 同步刷新引用同一资源的其它图片
        if (dataSrc) {
            document.querySelectorAll(`img[data-src="${dataSrc}"]`).forEach((el) => {
                el.setAttribute('src', modified);
            });
        } else {
            imgElement.setAttribute('src', modified);
        }
        protyle.reload();
    }
}