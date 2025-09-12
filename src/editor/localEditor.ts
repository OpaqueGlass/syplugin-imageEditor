import { errorPush, logPush } from "@/logger";
import { getReadOnlyGSettings } from "@/manager/settingManager";
import { escapeHTML, showPluginMessage } from "@/utils/common";
import { isValidStr } from "@/utils/commonCheck";
import { Dialog, getBackend, getFrontend } from "siyuan";
import BaseImageEditor from "./baseImageEditor";
import { lang } from "@/utils/lang";

export class LocalCmdEditor extends BaseImageEditor {
    public async init() {
        
    }

    public async showImageEditor({ source, filePath, element }: { source: string; filePath: string, element: HTMLElement }) {
        const { spawn } = window.require("child_process");
        const path = window.require("path");
        let src = element.getAttribute('src') || '';
        let base = src.split('?')[0];
        logPush("打开本地编辑器", path.join(window.siyuan.config.system.dataDir, base));

        const g_setting = getReadOnlyGSettings();
        if (!isValidStr(g_setting.localEditorPath)) {
            showPluginMessage(lang("msg_not_set_exec_path"));
            return;
        }
        const args = g_setting.localEditorArgs ? g_setting.localEditorArgs.split('\n') : [];
        const imagePath = path.join(window.siyuan.config.system.dataDir, base);
        // 如果为空，则补充 path, 如果不为空，替换其中的%%PATH%%为path
        const finalArgs = args.length > 0 ? args.map((v: string) => {
            if (v.indexOf('%%PATH%%') >= 0) {
                return v.replace(/%%PATH%%/g, imagePath);
            }
            return v;
        }) : [imagePath];
        logPush("编辑器调用参数", g_setting.localEditorPath, finalArgs);
        const child = spawn(g_setting.localEditorPath, finalArgs);
        showPluginMessage(lang("msg_called_external_editor"));
        child.on("error", (err) => {
            showPluginMessage(lang("msg_call_external_editor_failed") + err.message, 8000, "error");
            errorPush("本地编辑器调用失败", err);
        });
        child.stdout.on("data", (data) => {
            logPush(`stdout: ${data}`);
        });

        child.stderr.on("data", (data) => {
            logPush(`stderr: ${data}`);
        });
        const callDate = new Date();
        child.on("close", (code) => {
            logPush(`子进程退出，code = ${code}`);
            const endDate = new Date();
            if (endDate.getTime() - callDate.getTime() < 3000) {
                const dialogContent = `
                    <div class="b3-dialog__body">
                        <div class="b3-dialog__content">
                            <div class="ft__breakword">${escapeHTML(lang("dialog_external_editor_wait_tip"))}</div>
                            <div class="fn__hr"></div>
                            <div class="ft__breakword">${escapeHTML(lang("dialog_external_editor_exitcode"))}${code}</div>
                            <div class="fn__hr"></div>
                            <div class="ft__breakword">${escapeHTML(lang("dialog_external_editor_cmd"))}${g_setting.localEditorPath} ${escapeHTML(lang("dialog_external_editor_args"))}${JSON.stringify(finalArgs)}</div>
                        </div>
                        <div class="b3-dialog__action">
                            <button class="b3-button b3-button--remove" id="cancelDialogBtn">${lang("dialog_external_editor_cancel")}</button>
                            <div class="fn__space"></div>
                            <button class="b3-button b3-button--text" id="refreshDialogBtn">${lang("dialog_external_editor_refresh")}</button>
                        </div>
                    </div>
                `;
                const dialog = new Dialog({
                    title: '⏳' + lang("dialog_external_editor_title"),
                    content: dialogContent,
                    width: '480px',
                    height: '320px',
                    disableClose: true,
                });

                // Bind button events
                setTimeout(() => {
                    const refreshBtn = document.getElementById('refreshDialogBtn');
                    const cancelBtn = document.getElementById('cancelDialogBtn');
                    if (refreshBtn) {
                        refreshBtn.onclick = () => {
                            dialog.destroy();
                            let src = element.getAttribute('src') || '';
                            let base = src.split('?')[0];
                            element.setAttribute('src', base + '?t=' + Date.now());
                        };
                    }
                    if (cancelBtn) {
                        cancelBtn.onclick = () => {
                            dialog.destroy();
                            this.closeEditor();
                        };
                    }
                }, 0);
            }
            let src = element.getAttribute('src') || '';
            let base = src.split('?')[0];
            element.setAttribute('src', base + '?t=' + Date.now());
        });
        
    }
    public isAvailable() {
        const frontEnd = getFrontend();
        if (["browser-desktop", "browser-mobile", "mobile"].includes(frontEnd)) {
            showPluginMessage(lang("local_editor_frontend_error"));
            return false;
        }
        const backEnd = getBackend();
        if (["docker", "android", "ios", "harmony"].includes(backEnd)) {
            showPluginMessage(lang("local_editor_backend_error"));
            return false;
        }
        return true;
    }
    private closeEditor() {
        
    }
    public destroy() {
        
    }
}