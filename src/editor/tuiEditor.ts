import { debugPush, logPush, warnPush } from "@/logger";
import { tuiLang } from "@/manager/editorLang";
import { saveImageDistributor } from "@/manager/imageStorageHelper";
import { isMobile } from "@/syapi";
import { showPluginMessage } from "@/utils/common";
import { isZHCN, lang } from "@/utils/lang";
import { Dialog } from "siyuan";
import ImageEditor from "tui-image-editor";
import "tui-image-editor/dist/tui-image-editor.css";

export default class TuiEditor {
    private imageEditor: any = null;
    private editorContainer: HTMLDivElement | null = null;
    private mask: HTMLDivElement | null = null;
    private unsavedModify: boolean = false;
    private shadowRoot: ShadowRoot | null = null;

    public async init() {
        const style = document.createElement('style');
        style.id = 'tui-image-editor-style-fix';
        style.innerHTML = `
        svg[display="none"] {
            display: none !important;
        }
        .tui-image-editor-header-buttons {
            display: none !important;
        }
        `;
        const style2 = document.createElement('link');
        style2.id = 'tui-image-editor-style';
        style2.rel = 'stylesheet';
        style2.href = "/plugins/syplugin-imageEditor/static/tui-image-editor.css";

        const ourFloatView = document.createElement('div');
        ourFloatView.id = 'og-image-editor-float-view';
        ourFloatView.style.zIndex = "10";
        ourFloatView.style.display = "none";
        ourFloatView.style.position = "fixed";
        ourFloatView.style.width = "80vw";
        ourFloatView.style.height = "90vh";
        ourFloatView.style.top = "50%";
        ourFloatView.style.left = "50%";
        ourFloatView.style.transform = "translate(-50%, -50%)";

        // Attach shadowRoot
        this.shadowRoot = ourFloatView.attachShadow({ mode: 'open' });
        // this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(style2);
        document.body.appendChild(ourFloatView);
        const head = document.getElementsByTagName('head')[0];
        head.appendChild(style);
    }

    private closeEditor() {
        this.editorContainer!.style.display = 'none';
        this.mask!.style.display = 'none';
        if (this.imageEditor) {
            this.imageEditor.destroy();
            this.imageEditor = null;
        }
        let editorDiv = document.getElementById('tui-image-editor-container') as HTMLDivElement;
        if (editorDiv) editorDiv.innerHTML = '';
    }

    public async showImageEditor({ source, filePath, element }: { source: string; filePath: string, element: HTMLElement }) {
        this.editorContainer = document.getElementById('og-image-editor-float-view') as HTMLDivElement;
        logPush("edi", this.editorContainer)
        if (!this.editorContainer) {
            this.destroy();
            this.init();
        }

        if (!this.shadowRoot) {
            console.error('ShadowRoot not initialized.');
            return;
        }

        this.mask = this.shadowRoot.getElementById('og-image-editor-mask') as HTMLDivElement;
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

        let editorDiv = this.shadowRoot.getElementById('tui-image-editor-container') as HTMLDivElement;
        if (!editorDiv) {
            editorDiv = document.createElement('div');
            editorDiv.id = 'tui-image-editor-container';
            editorDiv.style.width = '100%';
            editorDiv.style.height = '100%';
            editorDiv.style.zIndex = "10";
            this.shadowRoot.appendChild(editorDiv);
        } else {
            editorDiv.innerHTML = '';
        }

        // fetch("/plugins/syplugin-imageEditor/static/tui.svg")
        // .then(res => res.text())
        // .then(txt => {
        //     const parser = new DOMParser();
        //     const doc = parser.parseFromString(txt, "image/svg+xml");
        //     const svgNode = doc.documentElement;
        //     this.shadowRoot.appendChild(svgNode);
        // });


        this.mask.onclick = () => {
            if (!this.unsavedModify) {
                this.closeEditor();
                return;
            }
            logPush("unsavedModify", this.unsavedModify);
            // 创建 Dialog，使用 b3-dialog 样式
            const dialogContent = `
                <div class="b3-dialog__body">
                  <div class="b3-dialog__content">
                    <div class="ft__breakword">${lang("dialog_leave_without_save")}</div>
                    <div class="fn__hr"></div>
                    <div class="ft__smaller ft__on-surface">${lang("dialog_leave_without_save_tip")}</div>
                  </div>
                  <div class="b3-dialog__action">
                    <button class="b3-button b3-button--remove" id="cancelDialogConfirmBtn">${lang("dialog_leave_without_save_cancel")}</button>
                    <div class="fn__space"></div>
                    <button class="b3-button b3-button--text" id="confirmDialogConfirmBtn">${lang("dialog_leave_without_save_confirm")}</button>
                  </div>
                </div>
            `;
            const dialog = new Dialog({
                title: '⚠️',
                content: dialogContent,
                width: '320px',
                height: '180px',
                disableClose: true,
                destroyCallback: this.closeEditor.bind(this),
            });
            // 绑定按钮事件
            setTimeout(() => {
                const saveBtn = document.getElementById('confirmDialogConfirmBtn');
                const cancelBtn = document.getElementById('cancelDialogConfirmBtn');
                if (saveBtn) {
                    saveBtn.onclick = async () => {
                        try {
                            const base64 = this.imageEditor.toDataURL();
                            await saveImageDistributor(filePath, base64);
                            let src = element.getAttribute('src') || '';
                            let base = src.split('?')[0];
                            element.setAttribute('src', base + '?t=' + Date.now());
                        } catch (e) {
                            showPluginMessage(lang("save_failed") + e);
                        }
                        dialog.destroy();
                    };
                }
                if (cancelBtn) {
                    cancelBtn.onclick = () => {
                        dialog.destroy();
                    };
                }
            }, 0);

        }

        const options = {
            includeUI: {
                loadImage: {
                    path: source,
                    name: 'image',
                },
                theme: {},
                menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'mask', 'filter'],
                initMenu: 'shape',
                uiSize: {
                    width: '100%',
                    height: '100%',
                },
                menuBarPosition: 'bottom',
                locale: isZHCN() ? tuiLang : undefined
            },
            cssMaxWidth: isMobile() ? document.documentElement.clientWidth : 700,
            cssMaxHeight: isMobile() ? document.documentElement.clientHeight : 500,
            selectionStyle: {
                cornerSize: 20,
                rotatingPointOffset: 70,
            },
            usageStatistics: false,
        };

        // @ts-ignore
        this.imageEditor = new ImageEditor(editorDiv, options);
        logPush("editor", this.imageEditor);
        
        this.unsavedModify = false;
        this.imageEditor.on('objectAdded', (props) => {
            logPush('objectAdded', props);
            this.unsavedModify = true;
        });
        this.imageEditor.on('objectMoved', (props) => {
            logPush('objectMoved', props);
            this.unsavedModify = true;
        });
        this.imageEditor.on('objectScaled', (props) => {
            logPush('objectScaled', props);
            this.unsavedModify = true;
        });
        this.imageEditor.on('objectRotated', (props) => {
            logPush('objectRotated', props);
            this.unsavedModify = true;
        });
        this.imageEditor.on('textEditing', () => {
            logPush('textEditing');
            this.unsavedModify = true;
        });
        const that = this;
        setTimeout(() => {
            that.imageEditor.on('undoStackChanged', (length) => {
                logPush('undoStackChanged', length);
                if (length > 0) {
                    that.unsavedModify = true;
                }
            });
            logPush("aaa", that.shadowRoot.querySelectorAll("svg use"))
                that.shadowRoot.querySelectorAll("svg use").forEach((el: any) => {
                    const href = el.getAttributeNS("http://www.w3.org/1999/xlink", "href");
                    debugPush("doing")
                    el.setAttributeNS("http://www.w3.org/1999/xlink", "href", "/plugins/syplugin-imageEditor/static/tui.svg" + href);
                });
        }, 1000);

        // 添加保存按钮
        let saveBtn = document.getElementById('tui-image-editor-save-btn') as HTMLButtonElement;
        if (!saveBtn) {
            saveBtn = document.createElement('button');
            saveBtn.id = 'tui-image-editor-save-btn';
            saveBtn.innerText = lang("editor_save");
            saveBtn.style.position = 'absolute';
            saveBtn.style.right = '24px';
            saveBtn.style.top = '24px';
            saveBtn.style.zIndex = '20';
            saveBtn.style.padding = '8px 24px';
            saveBtn.style.fontSize = '16px';
            saveBtn.style.background = '#409eff';
            saveBtn.style.color = '#fff';
            saveBtn.style.border = 'none';
            saveBtn.style.borderRadius = '4px';
            saveBtn.style.cursor = 'pointer';
            this.editorContainer.appendChild(saveBtn);
        }
        saveBtn.onclick = async () => {
            try {
                const base64 = this.imageEditor.toDataURL();
                await saveImageDistributor(filePath, base64);
                // 刷新图片
                let src = element.getAttribute('src') || '';
                let base = src.split('?')[0];
                element.setAttribute('src', base + '?t=' + Date.now());
                this.unsavedModify = false;
                showPluginMessage(lang("save_success"), 3000);
            } catch (e) {
                showPluginMessage(lang("save_failed") + e);
            }
        };
    }

    public destroy() {
        const mask = this.shadowRoot?.getElementById('og-image-editor-mask');
        if (mask && mask.parentNode) {
            mask.parentNode.removeChild(mask);
        }
        const floatView = document.getElementById('og-image-editor-float-view');
        if (floatView && floatView.parentNode) {
            floatView.parentNode.removeChild(floatView);
        }
    }
}