import { FilerbotEditor } from "@/editor/filerbotEditor"
import TuiEditor from "@/editor/tuiEditor";
import { logPush } from "@/logger";

export const IMAGE_EDITOR_KEY = {
    FILERBOT: 'filerbot',
    TUI: 'tui'
}
const EDITOR = {
    [IMAGE_EDITOR_KEY.FILERBOT]: new FilerbotEditor(),
    [IMAGE_EDITOR_KEY.TUI]: new TuiEditor(), 
}
const DEFAULT_EDITOR = IMAGE_EDITOR_KEY.TUI;

let currentEditor;

export function showImageEditor({ source, filePath, element }: { source: string; filePath: string, element: HTMLElement }) {
    currentEditor.showImageEditor({ source, filePath, element });
}

export function initImageEditor() {
    currentEditor.init();
}

export function changeEditor(editorKey: string) {
    if (currentEditor) {
        currentEditor.destroy();
    }
    logPush("调整编辑器是", editorKey);
    currentEditor = EDITOR[editorKey] || EDITOR[DEFAULT_EDITOR];
    currentEditor.init();
}