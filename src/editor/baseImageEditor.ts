export default abstract class BaseImageEditor {
    public abstract init(): Promise<void>;
    public abstract showImageEditor({ source, filePath, element }: { source: string; filePath: string, element: HTMLElement }): Promise<void>;
}