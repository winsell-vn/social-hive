export interface StorageResult {
  path: string;
  url: string;
  size: number;
}

export interface IStorageAdapter {
  save(
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<StorageResult>;
  read(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

export const STORAGE_ADAPTER = "STORAGE_ADAPTER";
