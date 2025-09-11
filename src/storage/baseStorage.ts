export abstract class BaseStorage {

    public abstract init(config: any): void;

    public abstract saveWithDataURL(dataPath: string, dataURL: string): Promise<boolean>;
}