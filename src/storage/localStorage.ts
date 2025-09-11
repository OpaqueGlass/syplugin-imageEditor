import { showPluginMessage } from "@/utils/common";
import { BaseStorage } from "./baseStorage";
import { lang } from "@/utils/lang";

export default class LocalStorage extends BaseStorage {
    public init(config): void {

    }
    public async saveWithDataURL(dataPath: string, dataURL: string): Promise<boolean> {
        return this.uploadFile(dataPath, dataURL);
    }
    private async uploadFile (path: string, base64: string): Promise<boolean> {
        const match = base64.match(/^data:([^;]+);base64,(.*)$/);
        if (!match) throw new Error('base64格式错误');
        const mime = match[1];
        const b64data = match[2];
        const byteString = atob(b64data);
        const arrayBuffer = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
            arrayBuffer[i] = byteString.charCodeAt(i);
        }
        let ext = '';
        if (mime.startsWith('image/')) {
            ext = '.' + mime.split('/')[1];
        } else if (mime === 'application/pdf') {
            ext = '.pdf';
        }
        let fileName = path.split('/').pop() || 'file';
        if (!fileName.includes('.') && ext) fileName += ext;
        const file = new File([arrayBuffer], fileName, { type: mime });
        const url = '/api/file/putFile';
        const data = new FormData();
        data.append('path', path);
        data.append('isDir', 'false');
        data.append('modTime', Math.floor(Date.now() / 1000).toString());
        data.append('file', file);
        const result = await fetch(url, {
            body: data,
            method: 'POST',
            headers: {
                Authorization: 'Token ' + (localStorage.getItem('token') || ''),
            },
        }).then((response) => response.json());
        if (result.code !== 0) {
            showPluginMessage(lang("save_failed") + result.msg, 5000, "error");
            return false;
        } else {
            return true;
        }
    };
}