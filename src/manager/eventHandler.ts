import { getPluginInstance } from "@/utils/pluginHelper";
import Mutex from "@/utils/mutex";
import { getReadOnlyGSettings } from "@/manager/settingManager";
import { IEventBusMap, openTab } from "siyuan";
import { logPush } from "@/logger";
import { showImageEditor } from "./editorHelper";
import { lang } from "@/utils/lang";
export default class EventHandler {
    private handlerBindList: Record<string, (arg1: CustomEvent)=>void> = {
        "loaded-protyle-static": this.loadedProtyleRetryEntry.bind(this), // mutex需要访问EventHandler的属性
        "open-menu-image": this.openMenuImage.bind(this),
    };
    // 关联的设置项，如果设置项对应为true，则才执行绑定
    private relateGsettingKeyStr: Record<string, string> = {
        "loaded-protyle-static": null, // mutex需要访问EventHandler的属性
        "open-menu-image": null,
        "ws-main": "immediatelyUpdate",
    };

    private loadAndSwitchMutex: Mutex;
    private simpleMutex: number = 0;
    private docIdMutex: Record<string, number> = {};
    constructor() {
        this.loadAndSwitchMutex = new Mutex();
    }

    bindHandler() {
        const plugin = getPluginInstance();
        const g_setting = getReadOnlyGSettings();
        // const g_setting = getReadOnlyGSettings();
        for (let key in this.handlerBindList) {
            if (this.relateGsettingKeyStr[key] == null || g_setting[this.relateGsettingKeyStr[key]]) {
                plugin.eventBus.on(key, this.handlerBindList[key]);
            }
        }
        
    }

    unbindHandler() {
        const plugin = getPluginInstance();
        for (let key in this.handlerBindList) {
            plugin.eventBus.off(key, this.handlerBindList[key]);
        }
    }

    async loadedProtyleRetryEntry(event: CustomEvent<IEventBusMap["loaded-protyle-static"]>) {
        // do sth
    }

    async openMenuImage(event: CustomEvent<IEventBusMap["open-menu-image"]>) {
        const {menu, protyle, element} = event.detail;
        logPush("menue", menu, protyle, element);
        const src = element.querySelector("img").getAttribute("src");
        if (src.startsWith("asset")) {
            menu.addItem({
                label: lang("open_with_editor"),
                icon: "ogiconFileImage",
                click: () => {
                    // 在这里处理点击事件
                    showImageEditor({
                        source: element.querySelector("img").getAttribute("src"),
                        filePath: "data/" + element.querySelector("img").getAttribute("data-src"),
                        element: element.querySelector("img"),
                    });
                }
            });
        }
    }

}