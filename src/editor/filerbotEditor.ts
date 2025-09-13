import { errorPush, logPush } from "@/logger";
import { fibLangZhCN, filerbotDarkTheme } from "@/manager/editorLang";
import { saveImageDistributor } from "@/manager/imageStorageHelper";
import { isDarkMode, isMobile } from "@/syapi";
import { showPluginMessage } from "@/utils/common";
import { isZHCN, lang } from "@/utils/lang";
import { Dialog } from "siyuan";
import BaseImageEditor from "./baseImageEditor";

export class FilerbotEditor extends BaseImageEditor {
    private filerobotImageEditor: any = null;
    private editorContainer: HTMLDivElement | null = null;
    private mask: HTMLDivElement | null = null;
    private unsavedModify: boolean = false;
    private observer: MutationObserver | null = null;
    private isClosingNormally: boolean = false;

    private getToken() {
        return localStorage.getItem('token') || '';
    }

    public async init() {
        const script = document.createElement('script');
        script.src = '/plugins/syplugin-imageEditor/static/filerobot-image-editor.4.9.1.min.js';
        script.async = true;
        document.head.appendChild(script);
        const ourFloatView = document.createElement('div');
        ourFloatView.id = 'og-image-editor-float-view';
        ourFloatView.style.zIndex = "10";
        ourFloatView.style.display = "none";
        ourFloatView.style.position = "fixed";
        ourFloatView.style.width = isMobile() ? "100vw" : "80vw";
        ourFloatView.style.height = isMobile() ? "100vh" : "80vh";
        ourFloatView.style.top = "50%";
        ourFloatView.style.left = "50%";
        ourFloatView.style.transform = "translate(-50%, -50%)";
        document.body.appendChild(ourFloatView);
        this.setStyle();
    }

    private setStyle() {
        const oldstyle = document.getElementById('filerbot-image-editor-style-fix');
        oldstyle?.remove();
        const style = document.createElement('style');
        style.id = 'filerbot-image-editor-style-fix';
        style.innerHTML = 
        isDarkMode() ? `.irhhtN {
            background-color: #1e1e1e !important;
        }
        .irhhtN:hover{
            background-color: unset !important;
        }` : "" +
        `
        /*
        #og-image-editor-float-view {
            display: none;
        }
        #og-image-editor-float-view:has(> *) {
            display: block;
        }*/
        `;
        const head = document.getElementsByTagName('head')[0];
        head.appendChild(style);
        
    }

    public async showImageEditor({ source, filePath, element }: { source: string; filePath: string, element: HTMLElement }) {
        this.setStyle();
        this.isClosingNormally = false; // 重置关闭状态
        this.editorContainer = document.getElementById('og-image-editor-float-view') as HTMLDivElement;
        if (!this.editorContainer) {
            this.destroy();
            this.init();
        }
        // 创建遮罩层
        this.mask = document.getElementById('og-image-editor-mask') as HTMLDivElement;
        if (!this.mask) {
            this.mask = document.createElement('div');
            this.mask.id = 'og-image-editor-mask';
            this.mask.style.position = 'fixed';
            this.mask.style.top = '0';
            this.mask.style.left = '0';
            this.mask.style.width = '100vw';
            this.mask.style.height = '100vh';
            this.mask.style.background = 'rgba(0,0,0,0.3)';
            this.mask.style.zIndex = '9';
            this.mask.style.display = 'none';
            document.body.appendChild(this.mask);
        }
        this.mask.style.display = 'block';
        this.editorContainer.style.display = 'block';
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        // 监视编辑器容器的子元素变化
        this.observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && this.editorContainer && this.editorContainer.childElementCount === 0) {
                    this.handleEditorClose();
                    break;
                }
            }
        });
        this.observer.observe(this.editorContainer, { childList: true });

        // 点击遮罩关闭编辑器
        this.mask.addEventListener("mouseup", (event) => {
            if (!this.unsavedModify) {
                this.closeEditor();
                return;
            }
            event.stopPropagation();
            event.preventDefault();
            event.stopImmediatePropagation();
            logPush("unsavedModify", this.unsavedModify);
            // 创建 Dialog，使用 b3-dialog 样式
            const dialogContent = `
                <div class="b3-dialog__body">
                    <div class="b3-dialog__content">
                    <div class="ft__breakword">${lang("dialog_leave_without_save_tip")}</div>
                    <div class="fn__hr"></div>
                    </div>
                    <div class="b3-dialog__action">
                    <button class="b3-button b3-button--remove" id="cancelDialogConfirmBtn">${lang("dialog_leave_without_save_cancel")}</button>
                    <div class="fn__space"></div>
                    <button class="b3-button b3-button--text" id="confirmDialogConfirmBtn">${lang("dialog_leave_without_save_return")}</button>
                    </div>
                </div>
            `;
            const dialog = new Dialog({
                title: '⚠️' + lang("dialog_leave_without_save"),
                content: dialogContent,
                width: '320px',
                height: '180px',
                disableClose: true,
            });
            // 绑定按钮事件
            setTimeout(() => {
                const saveBtn = document.getElementById('confirmDialogConfirmBtn');
                const cancelBtn = document.getElementById('cancelDialogConfirmBtn');
                if (saveBtn) {
                    saveBtn.onclick = () => {
                        dialog.destroy();
                    }
                }
                if (cancelBtn) {
                    cancelBtn.onclick = () => {
                        dialog.destroy();
                        this.closeEditor();
                    };
                }
            }, 0);
        }, true);

        // 首次加载或已销毁时，初始化编辑器
        if (!this.filerobotImageEditor) {
            const FilerobotImageEditor = window.FilerobotImageEditor;
            const TABS = window.FilerobotImageEditor.TABS;
            const TOOLS = window.FilerobotImageEditor.TOOLS;
            const config = {
                source,
                theme: isDarkMode() ? {
                    "palette": filerbotDarkTheme
                } : undefined,
                annotationsCommon: {
                    fill: '#000000',
                    stroke: '#ff0000',
                    strokeWidth: 1,
                    shadowOffsetX: 0,
                    shadowOffsetY: 0,
                    shadowBlur: 0,
                    shadowColor: '#000000',
                    shadowOpacity: 1,
                    opacity: 1,
                },
                Text: {
                    fill: '#000000',
                    stroke: '#ff0000',
                    strokeWidth: 0,
                    text: lang("editor_filerbot_text_default")
                },
                Rotate: { angle: 90, componentType: 'slider' },
                translations: isZHCN() ? fibLangZhCN : undefined,
                Crop: {
                    presetsItems: [
                        { titleKey: 'classicTv', descriptionKey: '4:3', ratio: 4 / 3 },
                        { titleKey: 'cinemascope', descriptionKey: '21:9', ratio: 21 / 9 },
                    ]
                },
                Rect: {
                    fill: '#00000000',
                    stroke: '#ff0000',
                    strokeWidth: 1,
                },
                tabsIds: [TABS.ADJUST, TABS.ANNOTATE, TABS.RESIZE, TABS.FILTERS],
                defaultTabId: TABS.ANNOTATE,
                defaultToolId: TOOLS.TEXT,
                onBeforeSave: (editedImageObject: any) => {
                    return false;
                },
                onModify: (c) => {
                    logPush("modify", c)
                    this.unsavedModify = true;
                }
            };
            this.filerobotImageEditor = new FilerobotImageEditor(this.editorContainer, config);
        } else {
            this.filerobotImageEditor.config.source = source;
        }
        this.unsavedModify = false;
        this.filerobotImageEditor.render({
            onClose: (closingReason: any) => {
                logPush('Closing reason', closingReason);
                this.closeEditor();
            },
            onSave: async (editedImageObject: any, designState: any) => {
                logPush('保存图片', editedImageObject, designState);
                try {
                    await saveImageDistributor(filePath, editedImageObject.imageBase64);
                } catch (e) {
                    errorPush('图片上传失败', e);
                }
                let src = element.getAttribute('src') || '';
                let base = src.split('?')[0];
                element.setAttribute('src', base + '?t=' + Date.now());
                this.unsavedModify = false;
                return 0;
            },
        });
    }

    private handleEditorClose() {
        if (!this.isClosingNormally) {
            showPluginMessage(lang("editor_unexpected_exit_tip"), 7000, "error");
            logPush("Filerobot editor closed unexpectedly.");
        }

        if (this.mask) {
            this.mask.style.display = 'none';
        }

        if (this.editorContainer) {
            this.editorContainer.style.display = 'none';
        }

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    private closeEditor() {
        this.isClosingNormally = true;
        if (this.filerobotImageEditor) {
            this.filerobotImageEditor.terminate();
        }
        // The MutationObserver will handle the rest
    }

    public isAvailable() {
        return true;
    }
    public destroy() {
        this.closeEditor();
        // 移除插入的 script
        const script = document.querySelector('script[src*="filerobot-image-editor"]');
        if (script && script.parentNode) {
            script.parentNode.removeChild(script);
        }
        // 移除遮罩层
        const mask = document.getElementById('og-image-editor-mask');
        if (mask && mask.parentNode) {
            mask.parentNode.removeChild(mask);
        }
        // 移除浮层容器
        document.querySelectorAll("#og-image-editor-float-view").forEach((child) => {
            child.remove();
        });
        this.filerobotImageEditor = null;
    }
}