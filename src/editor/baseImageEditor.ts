import { Protyle } from "siyuan";

export default abstract class BaseImageEditor {
    public abstract init(): Promise<void>;
    public abstract showImageEditor({ source, filePath, element, protyle }: { source: string; filePath: string, element: HTMLElement, protyle: Protyle }): Promise<void>;
    public abstract isAvailable(): boolean;
    public abstract destroy(): void;
}