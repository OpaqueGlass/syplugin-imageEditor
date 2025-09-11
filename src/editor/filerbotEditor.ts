
import { errorPush, logPush } from "@/logger";
import { fibLangZhCN } from "@/manager/editorLang";
import { saveImageDistributor } from "@/manager/imageStorageHelper";
import { isZHCN, lang } from "@/utils/lang";

export class FilerbotEditor {
    private filerobotImageEditor: any = null;
    private editorContainer: HTMLDivElement | null = null;
    private mask: HTMLDivElement | null = null;

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
        ourFloatView.style.width = "80vw";
        ourFloatView.style.height = "90vh";
        ourFloatView.style.top = "50%";
        ourFloatView.style.left = "50%";
        ourFloatView.style.transform = "translate(-50%, -50%)";
        document.body.appendChild(ourFloatView);
    }

    public async showImageEditor({ source, filePath, element }: { source: string; filePath: string, element: HTMLElement }) {
        this.editorContainer = document.getElementById('og-image-editor-float-view') as HTMLDivElement;
        if (!this.editorContainer) {
            throw new Error('未找到挂载点 #og-image-editor-float-view');
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

        // 点击遮罩关闭编辑器
        this.mask.onclick = () => {
            this.editorContainer!.style.display = 'none';
            this.mask!.style.display = 'none';
            if (this.filerobotImageEditor) {
                this.filerobotImageEditor.terminate();
                this.filerobotImageEditor = null;
            }
        };

        // 首次加载或已销毁时，初始化编辑器
        if (!this.filerobotImageEditor) {
            const FilerobotImageEditor = window.FilerobotImageEditor;
            const TABS = window.FilerobotImageEditor.TABS;
            const TOOLS = window.FilerobotImageEditor.TOOLS;
            const config = {
                source,
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
            };
            this.filerobotImageEditor = new FilerobotImageEditor(this.editorContainer, config);
        } else {
            this.filerobotImageEditor.config.source = source;
        }
        this.filerobotImageEditor.render({
            onClose: (closingReason: any) => {
                logPush('Closing reason', closingReason);
                this.editorContainer!.style.display = 'none';
                this.mask!.style.display = 'none';
                this.filerobotImageEditor.terminate();
                this.filerobotImageEditor = null;
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
            },
        });
    }
    public destroy() {
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
        const floatView = document.getElementById('og-image-editor-float-view');
        if (floatView && floatView.parentNode) {
            floatView.parentNode.removeChild(floatView);
        }
    }
}