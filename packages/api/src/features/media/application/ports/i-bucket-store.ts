export interface BucketObjectHead {
  bytes: number;
  contentType: string;
}

export abstract class IBucketStore {
  abstract presignPut(
    key: string,
    contentType: string,
    expiresSeconds: number,
  ): Promise<string>;
  abstract head(key: string): Promise<BucketObjectHead | null>;
  abstract delete(key: string): Promise<void>;
  abstract publicUrl(key: string): string;
}
